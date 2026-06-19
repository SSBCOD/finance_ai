"""
API views для счёта.

Эндпоинты:
- GET    /api/accounts/account/        — данные счёта (+ синхронизация дат)
- PATCH  /api/accounts/account/        — настройки зарплаты
- GET    /api/accounts/transactions/   — история операций
- POST   /api/accounts/topup/          — ручное пополнение
- POST   /api/accounts/pay/            — оплата (с автокатегорией)
- GET    /api/accounts/analytics/      — аналитика для графиков
- POST   /api/accounts/fast-forward/   — промотать время (тест)
- CRUD   /api/accounts/scheduled/      — запланированные платежи
- POST   /api/accounts/scheduled/<id>/pay/ — провести ручной платёж
- CRUD   /api/accounts/rules/          — правила автокатегорий
"""

from datetime import date, datetime
from decimal import Decimal, InvalidOperation

from django.db.models import Sum
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.finances.models import Category, Expense
from .models import ScheduledPayment, AutoCategoryRule
from .serializers import (
    BankAccountSerializer, AccountTransactionSerializer,
    ScheduledPaymentSerializer, AutoCategoryRuleSerializer,
)
from . import services


def _parse_date(value):
    """Распарсить дату из строки YYYY-MM-DD, иначе None."""
    if not value:
        return None
    try:
        return datetime.strptime(value, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return None


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def account_view(request):
    """Данные счёта. При GET синхронизирует зарплату/подписки."""
    account = services.get_or_create_account(request.user)

    if request.method == 'GET':
        sync_result = services.sync_account(account)
        account.refresh_from_db()
        data = BankAccountSerializer(account, context={'request': request}).data
        data['sync'] = sync_result
        return Response(data)

    # PATCH — настройки зарплаты
    serializer = BankAccountSerializer(
        account, data=request.data, partial=True, context={'request': request}
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transactions_view(request):
    """История операций по счёту."""
    account = services.get_or_create_account(request.user)
    qs = account.transactions.select_related('category').all()

    # Фильтр по направлению
    direction = request.query_params.get('direction')
    if direction in ('in', 'out'):
        qs = qs.filter(direction=direction)

    limit = request.query_params.get('limit')
    if limit and limit.isdigit():
        qs = qs[:int(limit)]

    serializer = AccountTransactionSerializer(qs, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def topup_view(request):
    """
    Пополнение счёта.
    income_type: 'salary' | 'freelance' | 'other' | 'none'
    Если 'none' — это не доход (перевод), в Доходах не отражается.
    """
    account = services.get_or_create_account(request.user)
    try:
        amount = Decimal(str(request.data.get('amount')))
    except (InvalidOperation, TypeError):
        return Response({'error': 'Некорректная сумма'}, status=status.HTTP_400_BAD_REQUEST)

    if amount <= 0:
        return Response({'error': 'Сумма должна быть больше 0'}, status=status.HTTP_400_BAD_REQUEST)

    description = request.data.get('description', '')
    income_type = request.data.get('income_type', 'other')
    ref_date = _parse_date(request.data.get('date')) or timezone.now().date()

    txn = services.manual_topup(account, amount, description, ref_date, income_type=income_type)
    account.refresh_from_db()
    return Response({
        'transaction': AccountTransactionSerializer(txn, context={'request': request}).data,
        'balance': account.balance,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pay_view(request):
    """
    Оплата со счёта.
    Если категория не передана и не определилась автоматически —
    возвращаем need_category=True, чтобы фронт показал выбор.
    Если передан флаг force=false и категория не найдена — не проводим.
    """
    account = services.get_or_create_account(request.user)

    try:
        amount = Decimal(str(request.data.get('amount')))
    except (InvalidOperation, TypeError):
        return Response({'error': 'Некорректная сумма'}, status=status.HTTP_400_BAD_REQUEST)

    if amount <= 0:
        return Response({'error': 'Сумма должна быть больше 0'}, status=status.HTTP_400_BAD_REQUEST)

    description = request.data.get('description', '')
    category_id = request.data.get('category')
    ref_date = _parse_date(request.data.get('date')) or timezone.now().date()

    category = None
    if category_id:
        category = Category.objects.filter(id=category_id).first()
    else:
        # Пытаемся определить автоматически
        category = services.detect_category(account, description)
        # Если не определилось и фронт не форсит — просим выбрать
        if category is None and not request.data.get('force'):
            return Response({
                'need_category': True,
                'message': 'Не удалось определить категорию. Выберите вручную.',
            }, status=status.HTTP_200_OK)

    # Проверка лимита (только предупреждение)
    warning = _check_limit_warning(request.user, category, amount, ref_date)

    result = services.make_payment(account, amount, description, category, ref_date)
    account.refresh_from_db()

    return Response({
        'transaction': AccountTransactionSerializer(result['transaction'], context={'request': request}).data,
        'balance': account.balance,
        'limit_warning': warning,
    }, status=status.HTTP_201_CREATED)


def _check_limit_warning(user, category, amount, ref_date):
    """
    Проверить, превышается ли месячный лимит категории.
    Возвращает dict с предупреждением или None. Оплату НЕ блокирует.
    """
    if not category:
        return None

    from apps.budget.models import CategoryLimit

    limit = CategoryLimit.objects.filter(
        budget__user=user,
        budget__year=ref_date.year,
        budget__month=ref_date.month,
        category=category,
    ).first()

    if not limit:
        return None

    spent = Expense.objects.filter(
        user=user,
        category=category,
        date__year=ref_date.year,
        date__month=ref_date.month,
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

    new_total = spent + amount
    if new_total > limit.limit_amount:
        return {
            'category': category.name,
            'limit': float(limit.limit_amount),
            'spent': float(spent),
            'after': float(new_total),
            'over': float(new_total - limit.limit_amount),
        }
    return None


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_view(request):
    """
    Аналитика для графиков на странице счёта:
    - расходы по категориям (за текущий месяц)
    - динамика баланса (по операциям)
    - прогресс по лимитам
    """
    account = services.get_or_create_account(request.user)
    today = timezone.now().date()

    # 1. Расходы по категориям за текущий месяц
    expenses_qs = account.transactions.filter(
        direction='out',
        date__year=today.year,
        date__month=today.month,
    ).select_related('category')

    by_category = {}
    for txn in expenses_qs:
        if txn.category:
            name = txn.category.get_localized_name(request.user.language)
        else:
            name = 'Без категории'
        by_category[name] = by_category.get(name, Decimal('0')) + txn.amount
    by_category = {k: float(v) for k, v in by_category.items()}

    # 2. Динамика баланса (последние 30 операций в хронологическом порядке)
    recent = list(account.transactions.all()[:30])
    recent.reverse()
    balance_history = [
        {'date': str(t.date), 'balance': float(t.balance_after)}
        for t in recent
    ]

    # 3. Прогресс по лимитам
    from apps.budget.models import CategoryLimit
    limits_data = []
    limits = CategoryLimit.objects.filter(
        budget__user=request.user,
        budget__year=today.year,
        budget__month=today.month,
    ).select_related('category')

    for lim in limits:
        spent = Expense.objects.filter(
            user=request.user,
            category=lim.category,
            date__year=today.year,
            date__month=today.month,
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        limits_data.append({
            'category': lim.category.get_localized_name(request.user.language),
            'limit': float(lim.limit_amount),
            'spent': float(spent),
            'percent': float(spent / lim.limit_amount * 100) if lim.limit_amount else 0,
        })

    # Суммарные приход/расход за месяц
    month_in = account.transactions.filter(
        direction='in', date__year=today.year, date__month=today.month
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
    month_out = account.transactions.filter(
        direction='out', date__year=today.year, date__month=today.month
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

    return Response({
        'by_category': by_category,
        'balance_history': balance_history,
        'limits': limits_data,
        'month_in': float(month_in),
        'month_out': float(month_out),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def limits_status_view(request):
    """
    Статус лимитов по категориям за текущий месяц (для онлайн-банка).
    Возвращает список с id категории, лимитом, потрачено и остатком.
    """
    from apps.budget.models import CategoryLimit
    today = timezone.now().date()

    data = []
    limits = CategoryLimit.objects.filter(
        budget__user=request.user,
        budget__year=today.year,
        budget__month=today.month,
    ).select_related('category')

    for lim in limits:
        spent = Expense.objects.filter(
            user=request.user,
            category=lim.category,
            date__year=today.year,
            date__month=today.month,
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        remaining = lim.limit_amount - spent
        data.append({
            'category_id': lim.category_id,
            'category': lim.category.get_localized_name(request.user.language),
            'limit': float(lim.limit_amount),
            'spent': float(spent),
            'remaining': float(remaining),
            'percent': float(spent / lim.limit_amount * 100) if lim.limit_amount else 0,
        })

    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def fast_forward_view(request):
    """Промотать время на один цикл зарплаты (для теста)."""
    account = services.get_or_create_account(request.user)
    result = services.fast_forward(account)
    account.refresh_from_db()
    return Response({
        'result': result,
        'balance': account.balance,
        'target_date': result.get('target_date'),
    })


class ScheduledPaymentViewSet(viewsets.ModelViewSet):
    """CRUD для запланированных платежей."""
    serializer_class = ScheduledPaymentSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        account = services.get_or_create_account(self.request.user)
        return account.scheduled_payments.select_related('category').all()

    def perform_create(self, serializer):
        account = services.get_or_create_account(self.request.user)
        serializer.save(account=account)

    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        """Провести ручной запланированный платёж."""
        sp = self.get_object()
        account = services.get_or_create_account(request.user)
        result = services.pay_scheduled(account, sp)
        account.refresh_from_db()
        return Response({
            'result': result,
            'balance': account.balance,
            'payment': ScheduledPaymentSerializer(sp, context={'request': request}).data,
        })


class AutoCategoryRuleViewSet(viewsets.ModelViewSet):
    """CRUD для правил автоопределения категорий."""
    serializer_class = AutoCategoryRuleSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        account = services.get_or_create_account(self.request.user)
        return account.category_rules.select_related('category').all()

    def perform_create(self, serializer):
        account = services.get_or_create_account(self.request.user)
        serializer.save(account=account)
