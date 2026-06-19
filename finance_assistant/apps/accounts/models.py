"""
Модели имитации банковского счёта.

Содержит:
- BankAccount: виртуальный счёт пользователя (баланс, настройки зарплаты)
- AccountTransaction: операции по счёту (пополнения и списания)
- ScheduledPayment: запланированные платежи (подписки - авто, прочее - вручную)
- AutoCategoryRule: правила автоопределения категории при оплате
"""

from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


class BankAccount(models.Model):
    """
    Виртуальный банковский счёт пользователя (имитация).
    Один пользователь — один счёт.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bank_account',
        verbose_name='Пользователь'
    )

    account_number = models.CharField('Номер счёта', max_length=20, blank=True)

    balance = models.DecimalField(
        'Баланс',
        max_digits=14,
        decimal_places=2,
        default=Decimal('0.00')
    )

    # --- Настройки зарплаты (автопополнение) ---
    salary_amount = models.DecimalField(
        'Сумма зарплаты',
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0'))]
    )

    # 0 = последний день месяца, 1-28 = конкретное число
    salary_day = models.PositiveSmallIntegerField(
        'День зарплаты',
        default=0,
        validators=[MaxValueValidator(28)],
        help_text='0 = последний день месяца, 1-28 = конкретное число'
    )

    salary_enabled = models.BooleanField('Зарплата включена', default=True)

    # Дата последнего начисления зарплаты (чтобы не дублировать)
    last_salary_date = models.DateField('Последнее начисление ЗП', null=True, blank=True)

    created_at = models.DateTimeField('Создано', auto_now_add=True)
    updated_at = models.DateTimeField('Обновлено', auto_now=True)

    class Meta:
        verbose_name = 'Банковский счёт'
        verbose_name_plural = 'Банковские счета'

    def __str__(self):
        return f'Счёт {self.user.username}: {self.balance}'

    @property
    def reserved_amount(self):
        """Сумма, зарезервированная под активные запланированные платежи (ещё не списанные в этом месяце)."""
        from django.utils import timezone
        today = timezone.now().date()
        total = Decimal('0.00')
        for sp in self.scheduled_payments.filter(is_active=True):
            # Резервируем если платёж этого месяца ещё не был проведён
            if sp.last_paid_date is None or (
                sp.last_paid_date.year != today.year or sp.last_paid_date.month != today.month
            ):
                total += sp.amount
        return total

    @property
    def available_amount(self):
        """Доступно к свободной трате = баланс минус зарезервированное."""
        return self.balance - self.reserved_amount


class AccountTransaction(models.Model):
    """
    Операция по счёту: пополнение или списание.
    Это «движение денег» — отражается на балансе.
    """

    class Direction(models.TextChoices):
        IN = 'in', 'Пополнение'
        OUT = 'out', 'Списание'

    class Source(models.TextChoices):
        SALARY = 'salary', 'Зарплата'
        MANUAL_TOPUP = 'manual_topup', 'Ручное пополнение'
        PAYMENT = 'payment', 'Оплата'
        SCHEDULED = 'scheduled', 'Запланированный платёж'

    account = models.ForeignKey(
        BankAccount,
        on_delete=models.CASCADE,
        related_name='transactions',
        verbose_name='Счёт'
    )

    direction = models.CharField('Направление', max_length=3, choices=Direction.choices)
    source = models.CharField('Источник', max_length=15, choices=Source.choices)

    amount = models.DecimalField(
        'Сумма',
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )

    # Категория (для списаний-оплат)
    category = models.ForeignKey(
        'finances.Category',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='account_transactions',
        verbose_name='Категория'
    )

    description = models.CharField('Описание', max_length=255, blank=True)
    date = models.DateField('Дата')

    # Баланс после операции (для построения графика динамики)
    balance_after = models.DecimalField(
        'Баланс после',
        max_digits=14,
        decimal_places=2,
        default=Decimal('0.00')
    )

    created_at = models.DateTimeField('Создано', auto_now_add=True)

    class Meta:
        verbose_name = 'Операция по счёту'
        verbose_name_plural = 'Операции по счёту'
        ordering = ['-date', '-created_at']

    def __str__(self):
        sign = '+' if self.direction == self.Direction.IN else '-'
        return f'{sign}{self.amount} ({self.get_source_display()})'


class ScheduledPayment(models.Model):
    """
    Запланированный платёж (тип А из ТЗ).

    Два режима:
    - subscription: списывается АВТОМАТИЧЕСКИ в свою дату
    - manual: пользователь подтверждает оплату вручную (квартира, ком. услуги)
    """

    class Kind(models.TextChoices):
        SUBSCRIPTION = 'subscription', 'Подписка (авто)'
        MANUAL = 'manual', 'Ручной платёж'

    account = models.ForeignKey(
        BankAccount,
        on_delete=models.CASCADE,
        related_name='scheduled_payments',
        verbose_name='Счёт'
    )

    name = models.CharField('Название', max_length=120)
    kind = models.CharField('Тип', max_length=15, choices=Kind.choices, default=Kind.MANUAL)

    amount = models.DecimalField(
        'Сумма',
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )

    category = models.ForeignKey(
        'finances.Category',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='scheduled_payments',
        verbose_name='Категория'
    )

    # День списания: 0 = последний день месяца, 1-28 = конкретное число
    day_of_month = models.PositiveSmallIntegerField(
        'День списания',
        default=1,
        validators=[MaxValueValidator(28)],
        help_text='0 = последний день месяца, 1-28 = конкретное число'
    )

    is_active = models.BooleanField('Активен', default=True)

    # Дата последнего фактического списания (чтобы не дублировать в месяц)
    last_paid_date = models.DateField('Последнее списание', null=True, blank=True)

    created_at = models.DateTimeField('Создано', auto_now_add=True)
    updated_at = models.DateTimeField('Обновлено', auto_now=True)

    class Meta:
        verbose_name = 'Запланированный платёж'
        verbose_name_plural = 'Запланированные платежи'
        ordering = ['day_of_month', 'name']

    def __str__(self):
        return f'{self.name}: {self.amount} ({self.get_kind_display()})'

    def is_paid_this_month(self, ref_date=None):
        """Был ли платёж проведён в месяце ref_date."""
        from django.utils import timezone
        ref_date = ref_date or timezone.now().date()
        if self.last_paid_date is None:
            return False
        return (
            self.last_paid_date.year == ref_date.year
            and self.last_paid_date.month == ref_date.month
        )


class AutoCategoryRule(models.Model):
    """
    Правило автоопределения категории при оплате.
    Если описание оплаты содержит ключевое слово — подставляется категория.
    """

    account = models.ForeignKey(
        BankAccount,
        on_delete=models.CASCADE,
        related_name='category_rules',
        verbose_name='Счёт'
    )

    keyword = models.CharField('Ключевое слово', max_length=100)

    category = models.ForeignKey(
        'finances.Category',
        on_delete=models.CASCADE,
        related_name='auto_rules',
        verbose_name='Категория'
    )

    created_at = models.DateTimeField('Создано', auto_now_add=True)

    class Meta:
        verbose_name = 'Правило автокатегории'
        verbose_name_plural = 'Правила автокатегорий'
        ordering = ['keyword']

    def __str__(self):
        return f'"{self.keyword}" → {self.category.name}'
