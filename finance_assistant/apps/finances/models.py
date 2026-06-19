"""
Модели финансов: категории, доходы и расходы.
"""

from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal


class Category(models.Model):
    """
    Модель категории расходов/доходов.
    
    Категории могут быть:
    - Системные (is_system=True) - доступны всем, создаются автоматически
    - Пользовательские (is_system=False) - принадлежат конкретному пользователю
    """
    
    class Type(models.TextChoices):
        """Тип категории."""
        INCOME = 'income', 'Доход'
        EXPENSE = 'expense', 'Расход'
    
    name = models.CharField('Название', max_length=100)
    name_kz = models.CharField('Название (каз)', max_length=100, blank=True)
    type = models.CharField('Тип', max_length=10, choices=Type.choices)
    icon = models.CharField('Иконка', max_length=50, blank=True, default='')
    color = models.CharField('Цвет', max_length=7, blank=True, default='#3B82F6')
    
    # Системные категории доступны всем
    is_system = models.BooleanField('Системная', default=False)
    
    # Пользовательские категории принадлежат конкретному пользователю
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='categories',
        null=True,
        blank=True,
        verbose_name='Владелец'
    )
    
    created_at = models.DateTimeField('Создано', auto_now_add=True)
    
    class Meta:
        verbose_name = 'Категория'
        verbose_name_plural = 'Категории'
        ordering = ['type', 'name']
        # Уникальность: системные категории уникальны по имени+типу,
        # пользовательские - по имени+типу+пользователю
        constraints = [
            models.UniqueConstraint(
                fields=['name', 'type', 'user'],
                name='unique_user_category'
            ),
        ]
    
    def __str__(self):
        return f'{self.name} ({self.get_type_display()})'
    
    def get_localized_name(self, language='ru'):
        """Получить название на нужном языке."""
        if language == 'kz' and self.name_kz:
            return self.name_kz
        return self.name


class Income(models.Model):
    """
    Модель дохода.
    """
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='incomes',
        verbose_name='Пользователь'
    )
    
    amount = models.DecimalField(
        'Сумма',
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='incomes',
        verbose_name='Категория',
        limit_choices_to={'type': Category.Type.INCOME}
    )
    
    date = models.DateField('Дата')
    comment = models.TextField('Комментарий', blank=True)
    
    created_at = models.DateTimeField('Создано', auto_now_add=True)
    updated_at = models.DateTimeField('Обновлено', auto_now=True)
    
    class Meta:
        verbose_name = 'Доход'
        verbose_name_plural = 'Доходы'
        ordering = ['-date', '-created_at']
    
    def __str__(self):
        return f'{self.amount} - {self.category} ({self.date})'


class Expense(models.Model):
    """
    Модель расхода.
    """
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='expenses',
        verbose_name='Пользователь'
    )
    
    amount = models.DecimalField(
        'Сумма',
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='expenses',
        verbose_name='Категория',
        limit_choices_to={'type': Category.Type.EXPENSE}
    )
    
    date = models.DateField('Дата')
    comment = models.TextField('Комментарий', blank=True)
    
    created_at = models.DateTimeField('Создано', auto_now_add=True)
    updated_at = models.DateTimeField('Обновлено', auto_now=True)
    
    class Meta:
        verbose_name = 'Расход'
        verbose_name_plural = 'Расходы'
        ordering = ['-date', '-created_at']
    
    def __str__(self):
        return f'{self.amount} - {self.category} ({self.date})'
