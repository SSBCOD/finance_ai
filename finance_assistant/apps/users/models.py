"""
Модели пользователей.
Custom User Model с поддержкой ролей (ADMIN/USER), языков (ru/kz) и валюты.
"""

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    """
    Кастомный менеджер для модели User.
    Первый зарегистрированный пользователь автоматически становится ADMIN.
    """
    
    def create_user(self, email, username, password=None, **extra_fields):
        """Создание обычного пользователя."""
        if not email:
            raise ValueError('Email обязателен')
        if not username:
            raise ValueError('Username обязателен')
        
        email = self.normalize_email(email)
        
        # Определяем роль: первый пользователь = ADMIN, остальные = USER
        if not self.model.objects.exists():
            extra_fields['role'] = User.Role.ADMIN
        else:
            extra_fields['role'] = User.Role.USER
        
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, username, password=None, **extra_fields):
        """Создание суперпользователя (для Django Admin)."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.ADMIN)
        
        return self.create_user(email, username, password, **extra_fields)


class User(AbstractUser):
    """
    Кастомная модель пользователя.
    
    Особенности:
    - Роли: ADMIN и USER
    - Язык: русский (ru) или казахский (kz)
    - Валюта пользователя
    - Email как обязательное поле
    """
    
    class Role(models.TextChoices):
        """Роли пользователей."""
        ADMIN = 'ADMIN', 'Администратор'
        USER = 'USER', 'Пользователь'
    
    class Language(models.TextChoices):
        """Поддерживаемые языки."""
        RUSSIAN = 'ru', 'Русский'
        KAZAKH = 'kz', 'Қазақша'
    
    class Currency(models.TextChoices):
        """Поддерживаемые валюты."""
        KZT = 'KZT', 'Тенге (₸)'
        RUB = 'RUB', 'Рубль (₽)'
        USD = 'USD', 'Доллар ($)'
        EUR = 'EUR', 'Евро (€)'
    
    # Поля модели
    email = models.EmailField(
        'Email адрес',
        unique=True,
        error_messages={
            'unique': 'Пользователь с таким email уже существует.',
        }
    )
    
    role = models.CharField(
        'Роль',
        max_length=10,
        choices=Role.choices,
        default=Role.USER,
        help_text='Роль назначается автоматически на backend'
    )
    
    language = models.CharField(
        'Язык',
        max_length=2,
        choices=Language.choices,
        default=Language.RUSSIAN,
        help_text='Язык интерфейса и AI-ответов'
    )
    
    currency = models.CharField(
        'Валюта',
        max_length=3,
        choices=Currency.choices,
        default=Currency.KZT,
        help_text='Валюта для финансов'
    )
    
    created_at = models.DateTimeField('Дата регистрации', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.username} ({self.email})'
    
    @property
    def is_admin(self):
        """Проверка, является ли пользователь администратором."""
        return self.role == self.Role.ADMIN
    
    def get_language_display_name(self):
        """Получить название языка."""
        return dict(self.Language.choices).get(self.language, self.language)
    
    def get_currency_symbol(self):
        """Получить символ валюты."""
        symbols = {
            'KZT': '₸',
            'RUB': '₽',
            'USD': '$',
            'EUR': '€',
        }
        return symbols.get(self.currency, self.currency)
