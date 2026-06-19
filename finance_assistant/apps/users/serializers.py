"""
Сериализаторы для пользователей.
"""

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Сериализатор для регистрации пользователя.
    
    ВАЖНО: 
    - Роль НЕ принимается от клиента
    - Роль назначается автоматически на backend
    - Первый пользователь = ADMIN, остальные = USER
    """
    
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = [
            'email',
            'username',
            'password',
            'password_confirm',
            'language',
            'currency',
        ]
        # Роль исключена из полей - нельзя передать при регистрации!
    
    def validate(self, attrs):
        """Валидация паролей."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Пароли не совпадают.'
            })
        return attrs
    
    def create(self, validated_data):
        """Создание пользователя (роль назначается в UserManager)."""
        validated_data.pop('password_confirm')
        
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
            language=validated_data.get('language', User.Language.RUSSIAN),
            currency=validated_data.get('currency', User.Currency.KZT),
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    """Сериализатор для отображения данных пользователя."""
    
    currency_symbol = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'username',
            'role',
            'language',
            'currency',
            'currency_symbol',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'role', 'created_at', 'updated_at']
    
    def get_currency_symbol(self, obj):
        return obj.get_currency_symbol()


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Сериализатор для обновления профиля пользователя.
    Роль нельзя менять через этот сериализатор.
    """
    
    class Meta:
        model = User
        fields = ['username', 'language', 'currency']


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """
    Сериализатор для администратора.
    Только ADMIN может менять роли пользователей.
    """
    
    class Meta:
        model = User
        fields = ['username', 'language', 'currency', 'role', 'is_active']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Кастомный сериализатор для JWT токена.
    Добавляем дополнительные данные в токен.
    """
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Добавляем кастомные claims в токен
        token['username'] = user.username
        token['email'] = user.email
        token['role'] = user.role
        token['language'] = user.language
        
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Добавляем данные пользователя в ответ
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'username': self.user.username,
            'role': self.user.role,
            'language': self.user.language,
            'currency': self.user.currency,
        }
        
        return data


class ChangePasswordSerializer(serializers.Serializer):
    """Сериализатор для смены пароля."""
    
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password]
    )
    new_password_confirm = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'Новые пароли не совпадают.'
            })
        return attrs
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Неверный текущий пароль.')
        return value
