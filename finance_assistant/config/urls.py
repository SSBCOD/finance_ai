"""
URL configuration для проекта AI Finance Assistant.
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/users/', include('apps.users.urls')),
    path('api/finances/', include('apps.finances.urls')),
    path('api/budget/', include('apps.budget.urls')),
    path('api/ai/', include('apps.ai_assistant.urls')),
    path('api/accounts/', include('apps.accounts.urls')),
    
    # JWT Token refresh
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
