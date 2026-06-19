"""
Регистрация моделей AI-помощника в Django Admin.
"""

from django.contrib import admin
from .models import ChatMessage


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'short_content', 'created_at']
    list_filter = ['role', 'created_at']
    search_fields = ['user__username', 'content']
    ordering = ['-created_at']
    readonly_fields = ['user', 'role', 'content', 'created_at']
    
    def short_content(self, obj):
        return obj.content[:100] + '...' if len(obj.content) > 100 else obj.content
    short_content.short_description = 'Содержимое'
