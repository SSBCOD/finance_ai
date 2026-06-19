"""
Сервисы для работы со счётом.

Основная логика:
- Начисление зарплаты (автопополнение)
- Автосписание подписок в их дату
- Проведение оплаты с автоопределением категории
- "Промотка" времени для теста
"""

import calendar
import random
from decimal import Decimal
from datetime import date

from django.db import transaction
from django.utils import timezone

from apps.finances.models import Category, Expense, Income
from .models import BankAccount, AccountTransaction, ScheduledPayment


def get_or_create_account(user):
    """Получить счёт пользователя или создать новый."""
    account, created = BankAccount.objects.get_or_create(user=user)
    if created and not account.account_number:
        # Генерируем фиктивный номер счёта KZ
        account.account_number = 'KZ' + ''.join(str(random.randint(0, 9)) for _ in range(16))
        account.save(update_fields=['account_number'])
    return account


def _resolve_day(day_of_month, year, month):
    """
    Вернуть фактический день в конкретном месяце.
    day_of_month = 0 → последний день месяца (28/29/30/31).
    Иначе — минимум(day_of_month, последний день месяца).
    """
    last_day = calendar.monthrange(year, month)[1]
    if day_of_month == 0:
        return last_day
    return min(day_of_month, last_day)


@transaction.atomic
def _record_transaction(account, direction, source, amount, ref_date,
                        category=None, description=''):
    """Создать операцию по счёту и обновить баланс."""
    amount = Decimal(str(amount))
    if direction == AccountTransaction.Direction.IN:
        account.balance += amount
    else:
        account.balance -= amount

    account.save(update_fields=['balance'])

    return AccountTransaction.objects.create(
        account=account,
        direction=direction,
        source=source,
        amount=amount,
        category=category,
        description=description,
        date=ref_date,
        balance_after=account.balance,
    )


@transaction.atomic
def apply_salary_if_due(account, ref_date=None):
    """
    Начислить зарплату, если для месяца ref_date она ещё не начислялась
    и нужный день уже наступил.
    Возвращает True, если начисление произошло.
    """
    ref_date = ref_date or timezone.now().date()

    if not account.salary_enabled or account.salary_amount <= 0:
        return False

    pay_day = _resolve_day(account.salary_day, ref_date.year, ref_date.month)

    # Уже наступил день выплаты?
    if ref_date.day < pay_day:
        return False

    # Уже выплачивали в этом месяце?
    if account.last_salary_date and (
        account.last_salary_date.year == ref_date.year
        and account.last_salary_date.month == ref_date.month
    ):
        return False

    salary_date = date(ref_date.year, ref_date.month, pay_day)

    # Категория дохода "Зарплата"
    salary_cat = Category.objects.filter(
        type=Category.Type.INCOME, name='Зарплата'
    ).first()

    _record_transaction(
        account,
        AccountTransaction.Direction.IN,
        AccountTransaction.Source.SALARY,
        account.salary_amount,
        salary_date,
        category=salary_cat,
        description='Зарплата',
    )

    # Дублируем в Income для общей аналитики
    Income.objects.create(
        user=account.user,
        amount=account.salary_amount,
        category=salary_cat,
        date=salary_date,
        comment='Автоматическое начисление зарплаты',
    )

    account.last_salary_date = salary_date
    account.save(update_fields=['last_salary_date'])
    return True


@transaction.atomic
def apply_subscriptions_if_due(account, ref_date=None):
    """
    Автоматически списать подписки, у которых наступила дата
    и которые ещё не списаны в этом месяце.
    Возвращает количество проведённых списаний.
    """
    ref_date = ref_date or timezone.now().date()
    count = 0

    subs = account.scheduled_payments.filter(
        is_active=True,
        kind=ScheduledPayment.Kind.SUBSCRIPTION,
    )

    for sub in subs:
        pay_day = _resolve_day(sub.day_of_month, ref_date.year, ref_date.month)
        if ref_date.day < pay_day:
            continue
        if sub.is_paid_this_month(ref_date):
            continue

        pay_date = date(ref_date.year, ref_date.month, pay_day)

        _record_transaction(
            account,
            AccountTransaction.Direction.OUT,
            AccountTransaction.Source.SCHEDULED,
            sub.amount,
            pay_date,
            category=sub.category,
            description=f'Подписка: {sub.name}',
        )

        Expense.objects.create(
            user=account.user,
            amount=sub.amount,
            category=sub.category,
            date=pay_date,
            comment=f'Автосписание подписки: {sub.name}',
        )

        sub.last_paid_date = pay_date
        sub.save(update_fields=['last_paid_date'])
        count += 1

    return count


def sync_account(account, ref_date=None):
    """
    Синхронизировать счёт на дату ref_date:
    начислить зарплату и списать подписки, если пора.
    Вызывается при открытии страницы счёта.
    """
    ref_date = ref_date or timezone.now().date()
    salary_applied = apply_salary_if_due(account, ref_date)
    subs_applied = apply_subscriptions_if_due(account, ref_date)
    return {'salary_applied': salary_applied, 'subscriptions_applied': subs_applied}


def detect_category(account, description):
    """
    Попытаться определить категорию расхода по описанию.
    Возвращает Category или None.
    """
    if not description:
        return None
    text = description.lower()
    for rule in account.category_rules.select_related('category').all():
        if rule.keyword.lower() in text:
            return rule.category
    return None


@transaction.atomic
def make_payment(account, amount, description='', category=None, ref_date=None):
    """
    Провести оплату со счёта.
    Если категория не передана — пытаемся определить автоматически.
    Возвращает dict с результатом и флагом, нужна ли категория от пользователя.
    """
    ref_date = ref_date or timezone.now().date()
    amount = Decimal(str(amount))

    # Автоопределение категории, если не задана
    if category is None:
        category = detect_category(account, description)

    txn = _record_transaction(
        account,
        AccountTransaction.Direction.OUT,
        AccountTransaction.Source.PAYMENT,
        amount,
        ref_date,
        category=category,
        description=description,
    )

    # Дублируем в Expense для аналитики
    Expense.objects.create(
        user=account.user,
        amount=amount,
        category=category,
        date=ref_date,
        comment=description or 'Оплата со счёта',
    )

    return {'transaction': txn, 'category': category}


@transaction.atomic
def pay_scheduled(account, scheduled_payment, ref_date=None):
    """
    Провести ручной запланированный платёж (квартира, ком. услуги).
    """
    ref_date = ref_date or timezone.now().date()

    if scheduled_payment.is_paid_this_month(ref_date):
        return {'paid': False, 'reason': 'already_paid'}

    _record_transaction(
        account,
        AccountTransaction.Direction.OUT,
        AccountTransaction.Source.SCHEDULED,
        scheduled_payment.amount,
        ref_date,
        category=scheduled_payment.category,
        description=f'Платёж: {scheduled_payment.name}',
    )

    Expense.objects.create(
        user=account.user,
        amount=scheduled_payment.amount,
        category=scheduled_payment.category,
        date=ref_date,
        comment=f'Запланированный платёж: {scheduled_payment.name}',
    )

    scheduled_payment.last_paid_date = ref_date
    scheduled_payment.save(update_fields=['last_paid_date'])
    return {'paid': True}


@transaction.atomic
def manual_topup(account, amount, description='', ref_date=None, income_type='other'):
    """
    Пополнение счёта.
    income_type: 'salary' | 'freelance' | 'other' | 'none'.
    'none' — перевод (не доход), в Income не пишется.
    """
    ref_date = ref_date or timezone.now().date()
    amount = Decimal(str(amount))

    # Сопоставление типа дохода с категорией
    income_category_map = {
        'salary': 'Зарплата',
        'freelance': 'Фриланс',
        'other': 'Другое',
    }

    category = None
    if income_type in income_category_map:
        category = Category.objects.filter(
            type=Category.Type.INCOME, name=income_category_map[income_type]
        ).first()

    txn = _record_transaction(
        account,
        AccountTransaction.Direction.IN,
        AccountTransaction.Source.MANUAL_TOPUP,
        amount,
        ref_date,
        category=category,
        description=description or 'Пополнение счёта',
    )

    # Доход в Finance AI только если это доход (не перевод)
    if income_type != 'none':
        Income.objects.create(
            user=account.user,
            amount=amount,
            category=category,
            date=ref_date,
            comment=description or 'Пополнение счёта',
        )

    return txn


def _next_salary_date(account, after):
    """Ближайшая дата зарплаты строго после `after`."""
    year, month = after.year, after.month
    for _ in range(24):
        pay_day = _resolve_day(account.salary_day, year, month)
        d = date(year, month, pay_day)
        if d > after:
            return d
        if month == 12:
            year, month = year + 1, 1
        else:
            month += 1
    return None


def fast_forward(account, target_date=None):
    """
    Промотать время вперёд на один цикл зарплаты (для теста).
    Один вызов = одна зарплата + подписки за этот период.

    Сначала применяем то, что уже наступило на сегодня, затем
    переходим к ближайшей следующей дате зарплаты.
    """
    today = timezone.now().date()
    result = {'salary_applied': 0, 'subscriptions_applied': 0, 'target_date': str(today)}

    # 1. Применяем всё, что уже наступило на сегодня
    if apply_salary_if_due(account, today):
        result['salary_applied'] += 1
    result['subscriptions_applied'] += apply_subscriptions_if_due(account, today)

    # 2. Определяем следующую дату зарплаты
    if account.salary_enabled and account.salary_amount > 0:
        after = account.last_salary_date or today
        nd = _next_salary_date(account, after)
    else:
        # Зарплата выключена — просто переходим к концу следующего месяца (для подписок)
        if today.month == 12:
            ny, nm = today.year + 1, 1
        else:
            ny, nm = today.year, today.month + 1
        nd = date(ny, nm, calendar.monthrange(ny, nm)[1])

    if not nd:
        return result

    # 3. Синхронизируемся на эту дату (одна зарплата + подписки месяца)
    r2 = sync_account(account, nd)
    if r2['salary_applied']:
        result['salary_applied'] += 1
    result['subscriptions_applied'] += r2['subscriptions_applied']
    result['target_date'] = str(nd)
    return result
