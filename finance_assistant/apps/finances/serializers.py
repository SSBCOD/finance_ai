"""
Сериализаторы для финансов.
"""

from rest_framework import serializers
from .models import Category, Income, Expense


class CategorySerializer(serializers.ModelSerializer):
    """Сериализатор для категорий."""
    
    name = serializers.SerializerMethodField()
    is_editable = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = [
            'id',
            'name',
            'type',
            'color',
            'is_system',
            'is_editable',
            'created_at',
        ]
        read_only_fields = ['id', 'is_system', 'created_at']
    
    def get_name(self, obj):
        """Получить название на языке пользователя."""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return obj.get_localized_name(request.user.language)
        if request:
            lang = request.headers.get('Accept-Language', 'ru')[:2]
            return obj.get_localized_name(lang)
        return obj.name
    
    def get_is_editable(self, obj):
        """Проверить, может ли пользователь редактировать категорию."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        if request.user.role == 'ADMIN':
            return True
        return obj.user == request.user and not obj.is_system


class CategoryCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания категории."""
    
    class Meta:
        model = Category
        fields = ['name', 'name_kz', 'type', 'color']
    
    def create(self, validated_data):
        """Создание категории с привязкой к пользователю."""
        user = self.context['request'].user
        validated_data['user'] = user
        validated_data['is_system'] = False
        validated_data['icon'] = ''  # Без иконки
        return super().create(validated_data)


class IncomeSerializer(serializers.ModelSerializer):
    """Сериализатор для доходов."""
    
    category_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Income
        fields = [
            'id',
            'amount',
            'category',
            'category_name',
            'date',
            'comment',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_category_name(self, obj):
        """Получить локализованное название категории."""
        if not obj.category:
            return None
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return obj.category.get_localized_name(request.user.language)
        return obj.category.name
    
    def validate_category(self, value):
        """Проверка, что категория - доход."""
        if value and value.type != Category.Type.INCOME:
            raise serializers.ValidationError('Категория должна быть типа "Доход".')
        return value
    
    def create(self, validated_data):
        """Создание дохода с привязкой к пользователю."""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ExpenseSerializer(serializers.ModelSerializer):
    """Сериализатор для расходов."""
    
    category_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Expense
        fields = [
            'id',
            'amount',
            'category',
            'category_name',
            'date',
            'comment',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_category_name(self, obj):
        """Получить локализованное название категории."""
        if not obj.category:
            return None
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return obj.category.get_localized_name(request.user.language)
        return obj.category.name
    
    def validate_category(self, value):
        """Проверка, что категория - расход."""
        if value and value.type != Category.Type.EXPENSE:
            raise serializers.ValidationError('Категория должна быть типа "Расход".')
        return value
    
    def create(self, validated_data):
        """Создание расхода с привязкой к пользователю."""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
