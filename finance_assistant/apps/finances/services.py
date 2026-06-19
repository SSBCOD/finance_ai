"""
Сервисный слой для финансовой аналитики.
Вся бизнес-логика и расчёты выполняются здесь.
"""

from decimal import Decimal
from datetime import date
from django.db.models import Sum, Q
from django.db.models.functions import Coalesce
from .models import Income, Expense, Category


class FinanceAnalyticsService:
    """
    Сервис для финансовой аналитики.
    Собирает агрегированные данные для пользователя.
    """
    
    def __init__(self, user):
        self.user = user
    
    def get_current_month_dates(self):
        """Получить даты начала и конца текущего месяца."""
        today = date.today()
        first_day = today.replace(day=1)
        
        # Последний день месяца
        if today.month == 12:
            last_day = today.replace(year=today.year + 1, month=1, day=1)
        else:
            last_day = today.replace(month=today.month + 1, day=1)
        
        return first_day, last_day
    
    def get_month_income(self, year=None, month=None):
        """
        Получить сумму доходов за месяц.
        По умолчанию - текущий месяц.
        """
        if year is None or month is None:
            first_day, last_day = self.get_current_month_dates()
        else:
            first_day = date(year, month, 1)
            if month == 12:
                last_day = date(year + 1, 1, 1)
            else:
                last_day = date(year, month + 1, 1)
        
        result = Income.objects.filter(
            user=self.user,
            date__gte=first_day,
            date__lt=last_day
        ).aggregate(
            total=Coalesce(Sum('amount'), Decimal('0'))
        )
        
        return result['total']
    
    def get_month_expenses(self, year=None, month=None):
        """
        Получить сумму расходов за месяц.
        По умолчанию - текущий месяц.
        """
        if year is None or month is None:
            first_day, last_day = self.get_current_month_dates()
        else:
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
    
    def get_expenses_by_category(self, year=None, month=None):
        """
        Получить расходы, сгруппированные по категориям.
        Возвращает словарь {category_name: amount}.
        """
        if year is None or month is None:
            first_day, last_day = self.get_current_month_dates()
        else:
            first_day = date(year, month, 1)
            if month == 12:
                last_day = date(year + 1, 1, 1)
            else:
                last_day = date(year, month + 1, 1)
        
        expenses = Expense.objects.filter(
            user=self.user,
            date__gte=first_day,
            date__lt=last_day
        ).values(
            'category__name',
            'category__icon'
        ).annotate(
            total=Sum('amount')
        ).order_by('-total')
        
        result = {}
        for item in expenses:
            category_name = item['category__name'] or 'Без категории'
            icon = item['category__icon'] or '💰'
            result[f'{icon} {category_name}'] = float(item['total'])
        
        return result
    
    def get_incomes_by_category(self, year=None, month=None):
        """
        Получить доходы, сгруппированные по категориям.
        """
        if year is None or month is None:
            first_day, last_day = self.get_current_month_dates()
        else:
            first_day = date(year, month, 1)
            if month == 12:
                last_day = date(year + 1, 1, 1)
            else:
                last_day = date(year, month + 1, 1)
        
        incomes = Income.objects.filter(
            user=self.user,
            date__gte=first_day,
            date__lt=last_day
        ).values(
            'category__name',
            'category__icon'
        ).annotate(
            total=Sum('amount')
        ).order_by('-total')
        
        result = {}
        for item in incomes:
            category_name = item['category__name'] or 'Без категории'
            icon = item['category__icon'] or '💰'
            result[f'{icon} {category_name}'] = float(item['total'])
        
        return result
    
    def get_balance(self, year=None, month=None):
        """Получить баланс (доходы - расходы) за месяц."""
        income = self.get_month_income(year, month)
        expenses = self.get_month_expenses(year, month)
        return income - expenses
    
    def get_total_balance(self):
        """Получить общий баланс за всё время."""
        total_income = Income.objects.filter(
            user=self.user
        ).aggregate(
            total=Coalesce(Sum('amount'), Decimal('0'))
        )['total']
        
        total_expenses = Expense.objects.filter(
            user=self.user
        ).aggregate(
            total=Coalesce(Sum('amount'), Decimal('0'))
        )['total']
        
        return total_income - total_expenses
    
    def get_full_analytics(self):
        """
        Получить полную аналитику для текущего месяца.
        Используется для AI-чата и дашборда.
        """
        today = date.today()
        
        return {
            'month': today.strftime('%B %Y'),
            'month_number': today.month,
            'year': today.year,
            'currency': self.user.currency,
            'currency_symbol': self.user.get_currency_symbol(),
            'income': {
                'total': float(self.get_month_income()),
                'by_category': self.get_incomes_by_category(),
            },
            'expenses': {
                'total': float(self.get_month_expenses()),
                'by_category': self.get_expenses_by_category(),
            },
            'balance': {
                'month': float(self.get_balance()),
                'total': float(self.get_total_balance()),
            },
        }
