"""
Регистрация моделей финансов в Django Admin.
"""

from django.contrib import admin
from .models import Category, Income, Expense


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'icon', 'is_system', 'user', 'created_at']
    list_filter = ['type', 'is_system']
    search_fields = ['name', 'name_kz']
    ordering = ['type', 'name']


@admin.register(Income)
class IncomeAdmin(admin.ModelAdmin):
    list_display = ['user', 'amount', 'category', 'date', 'created_at']
    list_filter = ['category', 'date']
    search_fields = ['user__username', 'comment']
    ordering = ['-date']
    date_hierarchy = 'date'


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['user', 'amount', 'category', 'date', 'created_at']
    list_filter = ['category', 'date']
    search_fields = ['user__username', 'comment']
    ordering = ['-date']
    date_hierarchy = 'date'
