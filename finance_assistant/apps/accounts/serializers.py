"""
Сериализаторы для API счёта.
"""

from rest_framework import serializers
from .models import BankAccount, AccountTransaction, ScheduledPayment, AutoCategoryRule


def _localized_category_name(category, request):
    """Локализованное имя категории по языку пользователя."""
    if not category:
        return None
    if request and request.user.is_authenticated:
        return category.get_localized_name(request.user.language)
    return category.name


class AccountTransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()
    direction_display = serializers.CharField(source='get_direction_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)

    class Meta:
        model = AccountTransaction
        fields = [
            'id', 'direction', 'direction_display', 'source', 'source_display',
            'amount', 'category', 'category_name', 'description',
            'date', 'balance_after', 'created_at',
        ]
        read_only_fields = ['balance_after', 'created_at']

    def get_category_name(self, obj):
        return _localized_category_name(obj.category, self.context.get('request'))


class ScheduledPaymentSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()
    kind_display = serializers.CharField(source='get_kind_display', read_only=True)
    paid_this_month = serializers.SerializerMethodField()

    class Meta:
        model = ScheduledPayment
        fields = [
            'id', 'name', 'kind', 'kind_display', 'amount',
            'category', 'category_name', 'day_of_month',
            'is_active', 'last_paid_date', 'paid_this_month', 'created_at',
        ]
        read_only_fields = ['last_paid_date', 'created_at']

    def get_category_name(self, obj):
        return _localized_category_name(obj.category, self.context.get('request'))

    def get_paid_this_month(self, obj):
        return obj.is_paid_this_month()


class AutoCategoryRuleSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()

    class Meta:
        model = AutoCategoryRule
        fields = ['id', 'keyword', 'category', 'category_name', 'created_at']
        read_only_fields = ['created_at']

    def get_category_name(self, obj):
        return _localized_category_name(obj.category, self.context.get('request'))


class BankAccountSerializer(serializers.ModelSerializer):
    reserved_amount = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    available_amount = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = BankAccount
        fields = [
            'id', 'account_number', 'balance',
            'salary_amount', 'salary_day', 'salary_enabled', 'last_salary_date',
            'reserved_amount', 'available_amount',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['account_number', 'balance', 'last_salary_date', 'created_at', 'updated_at']
