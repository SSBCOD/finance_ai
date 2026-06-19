"""
URL маршруты для финансов.
"""

from django.urls import path
from . import views

app_name = 'finances'

urlpatterns = [
    # Категории
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('categories/create/', views.CategoryCreateView.as_view(), name='category-create'),
    path('categories/<int:pk>/', views.CategoryDetailView.as_view(), name='category-detail'),
    
    # Доходы
    path('incomes/', views.IncomeListCreateView.as_view(), name='income-list'),
    path('incomes/<int:pk>/', views.IncomeDetailView.as_view(), name='income-detail'),
    
    # Расходы
    path('expenses/', views.ExpenseListCreateView.as_view(), name='expense-list'),
    path('expenses/<int:pk>/', views.ExpenseDetailView.as_view(), name='expense-detail'),
    
    # Аналитика
    path('analytics/', views.AnalyticsView.as_view(), name='analytics'),
]
