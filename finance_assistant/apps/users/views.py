"""
Views для управления пользователями.
"""

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.shortcuts import get_object_or_404

from .models import User
from .serializers import (
    UserRegistrationSerializer,
    UserSerializer,
    UserProfileUpdateSerializer,
    AdminUserUpdateSerializer,
    CustomTokenObtainPairSerializer,
    ChangePasswordSerializer,
)
from .permissions import IsAdmin, IsOwnerOrAdmin


class RegisterView(generics.CreateAPIView):
    """
    Регистрация нового пользователя.
    
    POST /api/users/register/
    
    Доступно всем (без аутентификации).
    
    Поля:
    - email (обязательно)
    - username (обязательно)
    - password (обязательно)
    - password_confirm (обязательно)
    - language (опционально, по умолчанию 'ru')
    - currency (опционально, по умолчанию 'KZT')
    
    ВАЖНО: Роль назначается автоматически на backend!
    - Первый пользователь получает роль ADMIN
    - Все последующие - роль USER
    """
    
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'message': 'Регистрация успешна!',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    """
    Вход пользователя (JWT аутентификация).
    
    POST /api/users/login/
    
    Поля:
    - email
    - password
    
    Возвращает:
    - access (JWT токен)
    - refresh (refresh токен)
    - user (данные пользователя)
    """
    
    serializer_class = CustomTokenObtainPairSerializer


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    Профиль текущего пользователя.
    
    GET /api/users/profile/ - получить профиль
    PATCH /api/users/profile/ - обновить профиль
    
    Требуется аутентификация.
    Роль нельзя изменить через этот endpoint.
    """
    
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserProfileUpdateSerializer
        return UserSerializer
    
    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """
    Смена пароля текущего пользователя.
    
    POST /api/users/change-password/
    
    Поля:
    - old_password
    - new_password
    - new_password_confirm
    """
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        
        return Response({
            'message': 'Пароль успешно изменён.'
        }, status=status.HTTP_200_OK)


# ============================================================================
# ADMIN ENDPOINTS
# ============================================================================

class AdminUserListView(generics.ListAPIView):
    """
    Список всех пользователей (только для ADMIN).
    
    GET /api/users/admin/users/
    """
    
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Управление пользователем (только для ADMIN).
    
    GET /api/users/admin/users/<id>/ - получить данные пользователя
    PATCH /api/users/admin/users/<id>/ - обновить (включая роль)
    DELETE /api/users/admin/users/<id>/ - удалить пользователя
    
    Только ADMIN может менять роли пользователей!
    """
    
    queryset = User.objects.all()
    serializer_class = AdminUserUpdateSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        
        # Нельзя удалить самого себя
        if user == request.user:
            return Response({
                'error': 'Нельзя удалить свой аккаунт.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.delete()
        return Response({
            'message': 'Пользователь удалён.'
        }, status=status.HTTP_204_NO_CONTENT)
