"""
Регистрация моделей бюджета в Django Admin.
"""

from django.contrib import admin
from .models import MonthlyBudget, CategoryLimit


class CategoryLimitInline(admin.TabularInline):
    model = CategoryLimit
    extra = 1


@admin.register(MonthlyBudget)
class MonthlyBudgetAdmin(admin.ModelAdmin):
    list_display = ['user', 'year', 'month', 'total_budget', 'created_at']
    list_filter = ['year', 'month']
    search_fields = ['user__username']
    inlines = [CategoryLimitInline]


@admin.register(CategoryLimit)
class CategoryLimitAdmin(admin.ModelAdmin):
    list_display = ['budget', 'category', 'limit_amount']
    list_filter = ['budget__year', 'budget__month']
