from django.contrib import admin
from .models import BankAccount, AccountTransaction, ScheduledPayment, AutoCategoryRule


@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    list_display = ['user', 'account_number', 'balance', 'salary_amount', 'salary_day', 'salary_enabled']
    search_fields = ['user__username', 'user__email', 'account_number']


@admin.register(AccountTransaction)
class AccountTransactionAdmin(admin.ModelAdmin):
    list_display = ['account', 'direction', 'source', 'amount', 'category', 'date', 'balance_after']
    list_filter = ['direction', 'source', 'date']
    search_fields = ['description']


@admin.register(ScheduledPayment)
class ScheduledPaymentAdmin(admin.ModelAdmin):
    list_display = ['name', 'account', 'kind', 'amount', 'day_of_month', 'is_active', 'last_paid_date']
    list_filter = ['kind', 'is_active']


@admin.register(AutoCategoryRule)
class AutoCategoryRuleAdmin(admin.ModelAdmin):
    list_display = ['keyword', 'category', 'account']
    search_fields = ['keyword']
