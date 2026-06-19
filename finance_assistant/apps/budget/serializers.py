"""
Сериализаторы для бюджета.
"""

from rest_framework import serializers
from datetime import date
from .models import MonthlyBudget, CategoryLimit
from .services import BudgetService


class CategoryLimitSerializer(serializers.ModelSerializer):
    """Сериализатор для лимита категории."""
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)
    spent = serializers.SerializerMethodField()
    remaining = serializers.SerializerMethodField()
    is_exceeded = serializers.SerializerMethodField()
    
    class Meta:
        model = CategoryLimit
        fields = [
            'id',
            'category',
            'category_name',
            'category_icon',
            'limit_amount',
            'spent',
            'remaining',
            'is_exceeded',
        ]
    
    def get_spent(self, obj):
        """Получить потраченную сумму по категории."""
        service = BudgetService(obj.budget.user)
        return float(service.get_category_spent(
            obj.category,
            obj.budget.year,
            obj.budget.month
        ))
    
    def get_remaining(self, obj):
        """Получить остаток по категории."""
        spent = self.get_spent(obj)
        return float(obj.limit_amount) - spent
    
    def get_is_exceeded(self, obj):
        """Проверить, превышен ли лимит."""
        return self.get_remaining(obj) < 0


class CategoryLimitCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания лимита категории."""
    
    class Meta:
        model = CategoryLimit
        fields = ['category', 'limit_amount']


class MonthlyBudgetSerializer(serializers.ModelSerializer):
    """Сериализатор для месячного бюджета."""
    
    category_limits = CategoryLimitSerializer(many=True, read_only=True)
    total_spent = serializers.SerializerMethodField()
    remaining = serializers.SerializerMethodField()
    is_exceeded = serializers.SerializerMethodField()
    currency_symbol = serializers.SerializerMethodField()
    
    class Meta:
        model = MonthlyBudget
        fields = [
            'id',
            'year',
            'month',
            'total_budget',
            'total_spent',
            'remaining',
            'is_exceeded',
            'currency_symbol',
            'category_limits',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_total_spent(self, obj):
        """Получить общую сумму расходов."""
        service = BudgetService(obj.user)
        return float(service.get_total_spent(obj.year, obj.month))
    
    def get_remaining(self, obj):
        """Получить остаток бюджета."""
        spent = self.get_total_spent(obj)
        return float(obj.total_budget) - spent
    
    def get_is_exceeded(self, obj):
        """Проверить, превышен ли бюджет."""
        return self.get_remaining(obj) < 0
    
    def get_currency_symbol(self, obj):
        """Получить символ валюты пользователя."""
        return obj.user.get_currency_symbol()


class MonthlyBudgetCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания месячного бюджета."""
    
    category_limits = CategoryLimitCreateSerializer(many=True, required=False)
    
    class Meta:
        model = MonthlyBudget
        fields = ['year', 'month', 'total_budget', 'category_limits']
    
    def validate(self, attrs):
        """Проверка, что бюджет на этот месяц ещё не создан."""
        user = self.context['request'].user
        year = attrs.get('year')
        month = attrs.get('month')
        
        if MonthlyBudget.objects.filter(user=user, year=year, month=month).exists():
            raise serializers.ValidationError({
                'month': 'Бюджет на этот месяц уже существует.'
            })
        
        return attrs
    
    def create(self, validated_data):
        """Создание бюджета с лимитами категорий."""
        category_limits_data = validated_data.pop('category_limits', [])
        user = self.context['request'].user
        
        budget = MonthlyBudget.objects.create(user=user, **validated_data)
        
        # Создаём лимиты категорий
        for limit_data in category_limits_data:
            CategoryLimit.objects.create(budget=budget, **limit_data)
        
        return budget


class MonthlyBudgetUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для обновления бюджета."""
    
    class Meta:
        model = MonthlyBudget
        fields = ['total_budget']


class BudgetSummarySerializer(serializers.Serializer):
    """Сериализатор для сводки по бюджету."""
    
    year = serializers.IntegerField()
    month = serializers.IntegerField()
    total_budget = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_spent = serializers.DecimalField(max_digits=12, decimal_places=2)
    remaining = serializers.DecimalField(max_digits=12, decimal_places=2)
    is_exceeded = serializers.BooleanField()
    currency_symbol = serializers.CharField()
    category_limits = serializers.ListField()
    exceeded_categories = serializers.ListField()
