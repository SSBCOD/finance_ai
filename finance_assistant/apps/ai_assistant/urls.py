"""
URL маршруты для AI-помощника.
"""

from django.urls import path
from . import views

app_name = 'ai_assistant'

urlpatterns = [
    # Чат с AI
    path('chat/', views.ChatView.as_view(), name='chat'),
    
    # История чата
    path('history/', views.ChatHistoryView.as_view(), name='history'),
    path('history/clear/', views.ClearChatHistoryView.as_view(), name='history-clear'),
]
