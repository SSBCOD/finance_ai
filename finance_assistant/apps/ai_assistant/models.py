"""
Модели для AI-помощника.
История сообщений чата.
"""

from django.db import models
from django.conf import settings


class ChatMessage(models.Model):
    """
    Модель сообщения в чате с AI.
    Сохраняем историю для возможного анализа.
    """
    
    class Role(models.TextChoices):
        USER = 'user', 'Пользователь'
        ASSISTANT = 'assistant', 'AI Помощник'
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_messages',
        verbose_name='Пользователь'
    )
    
    role = models.CharField(
        'Роль',
        max_length=10,
        choices=Role.choices
    )
    
    content = models.TextField('Содержимое')
    
    created_at = models.DateTimeField('Создано', auto_now_add=True)
    
    class Meta:
        verbose_name = 'Сообщение чата'
        verbose_name_plural = 'Сообщения чата'
        ordering = ['created_at']
    
    def __str__(self):
        return f'{self.user.username} - {self.role}: {self.content[:50]}...'
