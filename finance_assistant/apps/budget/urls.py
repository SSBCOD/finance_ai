"""
URL маршруты для бюджета.
"""

from django.urls import path
from . import views

app_name = 'budget'

urlpatterns = [
    # Бюджеты
    path('', views.MonthlyBudgetListView.as_view(), name='budget-list'),
    path('create/', views.MonthlyBudgetCreateView.as_view(), name='budget-create'),
    path('current/', views.CurrentBudgetView.as_view(), name='budget-current'),
    path('summary/', views.BudgetSummaryView.as_view(), name='budget-summary'),
    path('<int:pk>/', views.MonthlyBudgetDetailView.as_view(), name='budget-detail'),
    
    # Лимиты категорий
    path('<int:budget_id>/limits/', views.CategoryLimitCreateView.as_view(), name='limit-create'),
    path('limits/<int:pk>/', views.CategoryLimitDetailView.as_view(), name='limit-detail'),
]
