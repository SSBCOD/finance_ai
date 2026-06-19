"""
Сервисный слой для работы с бюджетом.
"""

from decimal import Decimal
from datetime import date
from django.db.models import Sum
from django.db.models.functions import Coalesce

from apps.finances.models import Expense
from .models import MonthlyBudget, CategoryLimit


class BudgetService:
    """
    Сервис для работы с бюджетом.
    """
    
    def __init__(self, user):
        self.user = user
    
    def get_current_budget(self):
        """Получить бюджет на текущий месяц."""
        today = date.today()
        try:
            return MonthlyBudget.objects.get(
                user=self.user,
                year=today.year,
                month=today.month
            )
        except MonthlyBudget.DoesNotExist:
            return None
    
    def get_budget_for_month(self, year, month):
        """Получить бюджет на конкретный месяц."""
        try:
            return MonthlyBudget.objects.get(
                user=self.user,
                year=year,
                month=month
            )
        except MonthlyBudget.DoesNotExist:
            return None
    
    def get_total_spent(self, year, month):
        """Получить общую сумму расходов за месяц."""
        first_day = date(year, month, 1)
        if month == 12:
            last_day = date(year + 1, 1, 1)
        else:
            last_day = date(year, month + 1, 1)
        
        result = Expense.objects.filter(
            user=self.user,
            date__gte=first_day,
            date__lt=last_day
        ).aggregate(
            total=Coalesce(Sum('amount'), Decimal('0'))
        )
        
        return result['total']
    
    def get_category_spent(self, category, year, month):
        """Получить сумму расходов по категории за месяц."""
        first_day = date(year, month, 1)
        if month == 12:
            last_day = date(year + 1, 1, 1)
        else:
            last_day = date(year, month + 1, 1)
        
        result = Expense.objects.filter(
            user=self.user,
            category=category,
            date__gte=first_day,
            date__lt=last_day
        ).aggregate(
            total=Coalesce(Sum('amount'), Decimal('0'))
        )
        
        return result['total']
    
    def get_budget_summary(self, year=None, month=None):
        """
        Получить сводку по бюджету.
        Используется для AI-чата.
        """
        if year is None or month is None:
            today = date.today()
            year = today.year
            month = today.month
        
        budget = self.get_budget_for_month(year, month)
        
        if not budget:
            return {
                'has_budget': False,
                'year': year,
                'month': month,
                'message': 'Бюджет на этот месяц не установлен'
            }
        
        total_spent = self.get_total_spent(year, month)
        remaining = budget.total_budget - total_spent
        
        # Получаем информацию по лимитам категорий
        category_limits = []
        exceeded_categories = []
        
        for limit in budget.category_limits.all():
            spent = self.get_category_spent(limit.category, year, month)
            limit_remaining = limit.limit_amount - spent
            
            limit_info = {
                'category': limit.category.name,
                'icon': limit.category.icon,
                'limit': float(limit.limit_amount),
                'spent': float(spent),
                'remaining': float(limit_remaining),
                'is_exceeded': limit_remaining < 0
            }
            category_limits.append(limit_info)
            
            if limit_remaining < 0:
                exceeded_categories.append({
                    'category': limit.category.name,
                    'exceeded_by': float(abs(limit_remaining))
                })
        
        return {
            'has_budget': True,
            'year': year,
            'month': month,
            'total_budget': float(budget.total_budget),
            'total_spent': float(total_spent),
            'remaining': float(remaining),
            'is_exceeded': remaining < 0,
            'currency_symbol': self.user.get_currency_symbol(),
            'category_limits': category_limits,
            'exceeded_categories': exceeded_categories
        }
