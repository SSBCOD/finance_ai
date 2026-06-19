"""
Views для финансов: категории, доходы, расходы и аналитика.
"""

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Category, Income, Expense
from .serializers import (
    CategorySerializer,
    CategoryCreateSerializer,
    IncomeSerializer,
    ExpenseSerializer,
)
from .services import FinanceAnalyticsService
from apps.users.permissions import IsAdmin, IsOwnerOrAdmin


# =============================================================================
# CATEGORIES
# =============================================================================

class CategoryListView(generics.ListAPIView):
    """
    Список категорий.
    
    GET /api/finances/categories/
    
    Возвращает:
    - Системные категории (доступны всем)
    - Пользовательские категории текущего пользователя
    
    Фильтры:
    - ?type=income или ?type=expense
    """
    
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['type']
    
    def get_queryset(self):
        user = self.request.user
        
        # ADMIN видит все категории
        if user.role == 'ADMIN':
            return Category.objects.all()
        
        # Обычный пользователь видит системные + свои категории
        return Category.objects.filter(
            Q(is_system=True) | Q(user=user)
        )


class CategoryCreateView(generics.CreateAPIView):
    """
    Создание новой категории.
    
    POST /api/finances/categories/
    
    Категория привязывается к текущему пользователю.
    """
    
    serializer_class = CategoryCreateSerializer
    permission_classes = [IsAuthenticated]


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Просмотр, редактирование и удаление категории.
    
    GET/PATCH/DELETE /api/finances/categories/<id>/
    
    - Пользователь может управлять только своими категориями
    - ADMIN может управлять всеми категориями
    - Системные категории нельзя удалить обычному пользователю
    """
    
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'ADMIN':
            return Category.objects.all()
        
        return Category.objects.filter(
            Q(is_system=True) | Q(user=user)
        )
    
    def destroy(self, request, *args, **kwargs):
        category = self.get_object()
        
        # Обычный пользователь не может удалить системную категорию
        if category.is_system and request.user.role != 'ADMIN':
            return Response({
                'error': 'Нельзя удалить системную категорию.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        return super().destroy(request, *args, **kwargs)


# =============================================================================
# INCOMES
# =============================================================================

class IncomeListCreateView(generics.ListCreateAPIView):
    """
    Список и создание доходов.
    
    GET /api/finances/incomes/ - список доходов пользователя
    POST /api/finances/incomes/ - создание нового дохода
    
    Фильтры:
    - ?category=<id>
    - ?date_from=YYYY-MM-DD
    - ?date_to=YYYY-MM-DD
    - ?search=<text> - поиск по комментарию
    """
    
    serializer_class = IncomeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['comment']
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date']
    
    def get_queryset(self):
        user = self.request.user
        queryset = Income.objects.filter(user=user)
        
        # Фильтр по датам
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        
        return queryset


class IncomeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Просмотр, редактирование и удаление дохода.
    
    GET/PATCH/DELETE /api/finances/incomes/<id>/
    """
    
    serializer_class = IncomeSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'ADMIN':
            return Income.objects.all()
        
        return Income.objects.filter(user=user)


# =============================================================================
# EXPENSES
# =============================================================================

class ExpenseListCreateView(generics.ListCreateAPIView):
    """
    Список и создание расходов.
    
    GET /api/finances/expenses/ - список расходов пользователя
    POST /api/finances/expenses/ - создание нового расхода
    
    Фильтры аналогичны доходам.
    """
    
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['comment']
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date']
    
    def get_queryset(self):
        user = self.request.user
        queryset = Expense.objects.filter(user=user)
        
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        
        return queryset


class ExpenseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Просмотр, редактирование и удаление расхода.
    
    GET/PATCH/DELETE /api/finances/expenses/<id>/
    """
    
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'ADMIN':
            return Expense.objects.all()
        
        return Expense.objects.filter(user=user)


# =============================================================================
# ANALYTICS
# =============================================================================

class AnalyticsView(APIView):
    """
    Финансовая аналитика для текущего пользователя.
    
    GET /api/finances/analytics/
    
    Возвращает:
    - Доходы за текущий месяц (общая сумма и по категориям)
    - Расходы за текущий месяц (общая сумма и по категориям)
    - Баланс за месяц
    - Общий баланс
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        service = FinanceAnalyticsService(request.user)
        analytics = service.get_full_analytics()
        
        return Response(analytics)
