"""
URL маршруты приложения accounts.
"""

from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'scheduled', views.ScheduledPaymentViewSet, basename='scheduled')
router.register(r'rules', views.AutoCategoryRuleViewSet, basename='rules')

urlpatterns = [
    path('account/', views.account_view, name='account'),
    path('transactions/', views.transactions_view, name='account-transactions'),
    path('topup/', views.topup_view, name='account-topup'),
    path('pay/', views.pay_view, name='account-pay'),
    path('analytics/', views.analytics_view, name='account-analytics'),
    path('limits-status/', views.limits_status_view, name='account-limits-status'),
    path('fast-forward/', views.fast_forward_view, name='account-fast-forward'),
]

urlpatterns += router.urls
