"""
Модели бюджета: месячный бюджет и лимиты по категориям.
"""

from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal


class MonthlyBudget(models.Model):
    """
    Месячный бюджет пользователя.
    Один пользователь - один бюджет на месяц.
    """
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='budgets',
        verbose_name='Пользователь'
    )
    
    year = models.PositiveIntegerField('Год')
    month = models.PositiveIntegerField('Месяц')  # 1-12
    
    total_budget = models.DecimalField(
        'Общий бюджет',
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text='Общая сумма, которую планируете потратить'
    )
    
    created_at = models.DateTimeField('Создано', auto_now_add=True)
    updated_at = models.DateTimeField('Обновлено', auto_now=True)
    
    class Meta:
        verbose_name = 'Месячный бюджет'
        verbose_name_plural = 'Месячные бюджеты'
        ordering = ['-year', '-month']
        # Один бюджет на месяц для пользователя
        unique_together = ['user', 'year', 'month']
    
    def __str__(self):
        return f'{self.user.username} - {self.month}/{self.year}: {self.total_budget}'


class CategoryLimit(models.Model):
    """
    Лимит бюджета по категории.
    Привязан к конкретному месячному бюджету.
    """
    
    budget = models.ForeignKey(
        MonthlyBudget,
        on_delete=models.CASCADE,
        related_name='category_limits',
        verbose_name='Бюджет'
    )
    
    category = models.ForeignKey(
        'finances.Category',
        on_delete=models.CASCADE,
        related_name='budget_limits',
        verbose_name='Категория'
    )
    
    limit_amount = models.DecimalField(
        'Лимит',
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))]
    )
    
    class Meta:
        verbose_name = 'Лимит категории'
        verbose_name_plural = 'Лимиты категорий'
        # Один лимит на категорию в рамках бюджета
        unique_together = ['budget', 'category']
    
    def __str__(self):
        return f'{self.category.name}: {self.limit_amount}'
