"""
Views для работы с бюджетом.
"""

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import date

from .models import MonthlyBudget, CategoryLimit
from .serializers import (
    MonthlyBudgetSerializer,
    MonthlyBudgetCreateSerializer,
    MonthlyBudgetUpdateSerializer,
    CategoryLimitSerializer,
    CategoryLimitCreateSerializer,
)
from .services import BudgetService
from apps.users.permissions import IsOwnerOrAdmin


class MonthlyBudgetListView(generics.ListAPIView):
    """
    Список всех бюджетов пользователя.
    
    GET /api/budget/
    """
    
    serializer_class = MonthlyBudgetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return MonthlyBudget.objects.filter(user=self.request.user)


class MonthlyBudgetCreateView(generics.CreateAPIView):
    """
    Создание нового месячного бюджета.
    
    POST /api/budget/
    
    Поля:
    - year
    - month
    - total_budget
    - category_limits (опционально) - список {category: id, limit_amount: ...}
    """
    
    serializer_class = MonthlyBudgetCreateSerializer
    permission_classes = [IsAuthenticated]


class MonthlyBudgetDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Просмотр, обновление и удаление бюджета.
    
    GET/PATCH/DELETE /api/budget/<id>/
    """
    
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return MonthlyBudgetUpdateSerializer
        return MonthlyBudgetSerializer
    
    def get_queryset(self):
        return MonthlyBudget.objects.filter(user=self.request.user)


class CurrentBudgetView(APIView):
    """
    Бюджет на текущий месяц.
    
    GET /api/budget/current/
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        service = BudgetService(request.user)
        budget = service.get_current_budget()
        
        if not budget:
            return Response({
                'message': 'Бюджет на текущий месяц не установлен.',
                'has_budget': False
            }, status=status.HTTP_200_OK)
        
        serializer = MonthlyBudgetSerializer(budget)
        return Response(serializer.data)


class BudgetSummaryView(APIView):
    """
    Сводка по бюджету.
    
    GET /api/budget/summary/
    GET /api/budget/summary/?year=2024&month=1
    
    Возвращает:
    - Общий бюджет
    - Потраченная сумма
    - Остаток
    - Лимиты по категориям
    - Превышенные лимиты
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        
        if year:
            year = int(year)
        if month:
            month = int(month)
        
        service = BudgetService(request.user)
        summary = service.get_budget_summary(year, month)
        
        return Response(summary)


# =============================================================================
# CATEGORY LIMITS
# =============================================================================

class CategoryLimitCreateView(generics.CreateAPIView):
    """
    Добавление лимита категории к бюджету.
    
    POST /api/budget/<budget_id>/limits/
    """
    
    serializer_class = CategoryLimitCreateSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, budget_id):
        try:
            budget = MonthlyBudget.objects.get(
                id=budget_id,
                user=request.user
            )
        except MonthlyBudget.DoesNotExist:
            return Response({
                'error': 'Бюджет не найден.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Проверяем, что лимит для этой категории ещё не создан
        category = serializer.validated_data['category']
        if CategoryLimit.objects.filter(budget=budget, category=category).exists():
            return Response({
                'error': 'Лимит для этой категории уже установлен.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        CategoryLimit.objects.create(budget=budget, **serializer.validated_data)
        
        return Response({
            'message': 'Лимит категории добавлен.'
        }, status=status.HTTP_201_CREATED)


class CategoryLimitDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Просмотр, обновление и удаление лимита категории.
    
    GET/PATCH/DELETE /api/budget/limits/<id>/
    """
    
    serializer_class = CategoryLimitSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return CategoryLimit.objects.filter(budget__user=self.request.user)
