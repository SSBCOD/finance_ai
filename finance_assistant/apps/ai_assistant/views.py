"""
Views для AI-помощника.
"""

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import ChatMessage
from .serializers import (
    ChatMessageSerializer,
    ChatRequestSerializer,
    ChatResponseSerializer,
)
from .services import AIAssistantService


class ChatView(APIView):
    """
    Чат с AI-помощником.
    
    POST /api/ai/chat/
    
    Body:
    {
        "message": "Текст сообщения пользователя"
    }
    
    Логика:
    1. Принимаем сообщение пользователя
    2. Определяем язык пользователя
    3. Собираем агрегированные финансовые данные
    4. Формируем промпт с указанием языка
    5. Отправляем запрос в Groq API
    6. Сохраняем сообщения в историю
    7. Возвращаем ответ AI
    
    ВАЖНО:
    - AI НЕ изменяет данные в БД
    - AI только анализирует предоставленный текст
    """
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Валидация входящего сообщения
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user_message_text = serializer.validated_data['message']
        
        # Сохраняем сообщение пользователя
        user_chat_message = ChatMessage.objects.create(
            user=request.user,
            role=ChatMessage.Role.USER,
            content=user_message_text
        )
        
        # Получаем ответ от AI
        ai_service = AIAssistantService(request.user)
        result = ai_service.chat(user_message_text)
        
        response_data = {
            'success': result['success'],
            'message': result['message'],
            'user_message': ChatMessageSerializer(user_chat_message).data,
        }
        
        # Если успешно, сохраняем ответ AI
        if result['success']:
            ai_chat_message = ChatMessage.objects.create(
                user=request.user,
                role=ChatMessage.Role.ASSISTANT,
                content=result['message']
            )
            response_data['ai_message'] = ChatMessageSerializer(ai_chat_message).data
        
        return Response(
            response_data,
            status=status.HTTP_200_OK if result['success'] else status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class ChatHistoryView(generics.ListAPIView):
    """
    История сообщений чата.
    
    GET /api/ai/history/
    GET /api/ai/history/?limit=50
    
    Возвращает последние N сообщений пользователя с AI.
    """
    
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        limit = self.request.query_params.get('limit', 100)
        try:
            limit = min(int(limit), 500)  # Максимум 500 сообщений
        except ValueError:
            limit = 100
        
        return ChatMessage.objects.filter(
            user=self.request.user
        ).order_by('-created_at')[:limit]


class ClearChatHistoryView(APIView):
    """
    Очистка истории чата.
    
    DELETE /api/ai/history/clear/
    """
    
    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        deleted_count, _ = ChatMessage.objects.filter(
            user=request.user
        ).delete()
        
        return Response({
            'message': f'Удалено {deleted_count} сообщений.'
        }, status=status.HTTP_200_OK)
