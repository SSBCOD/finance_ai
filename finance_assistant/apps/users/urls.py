"""
URL маршруты для приложения users.
"""

from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    # Аутентификация (публичные endpoints)
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    
    # Профиль пользователя (требуется аутентификация)
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    
    # Админ endpoints (только для ADMIN)
    path('admin/users/', views.AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/users/<int:pk>/', views.AdminUserDetailView.as_view(), name='admin-user-detail'),
]
