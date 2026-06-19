"""
Сериализаторы для AI-помощника.
"""

from rest_framework import serializers
from .models import ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    """Сериализатор для сообщения чата."""
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'role', 'content', 'created_at']
        read_only_fields = ['id', 'role', 'created_at']


class ChatRequestSerializer(serializers.Serializer):
    """Сериализатор для запроса к AI."""
    
    message = serializers.CharField(
        required=True,
        min_length=1,
        max_length=2000,
        help_text='Сообщение для AI-помощника'
    )


class ChatResponseSerializer(serializers.Serializer):
    """Сериализатор для ответа от AI."""
    
    success = serializers.BooleanField()
    message = serializers.CharField()
    user_message = ChatMessageSerializer(required=False)
    ai_message = ChatMessageSerializer(required=False)
