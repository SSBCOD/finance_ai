"""
Права доступа (permissions) для приложения users.
"""

from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """
    Разрешение только для администраторов.
    Проверяет роль пользователя (role == 'ADMIN').
    """
    
    message = 'Доступ только для администраторов.'
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'ADMIN'
        )


class IsAdminOrReadOnly(BasePermission):
    """
    Администраторы имеют полный доступ.
    Остальные пользователи - только чтение.
    """
    
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return request.user and request.user.is_authenticated
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'ADMIN'
        )


class IsOwner(BasePermission):
    """
    Разрешение только для владельца объекта.
    Объект должен иметь поле 'user'.
    """
    
    message = 'Вы можете управлять только своими данными.'
    
    def has_object_permission(self, request, view, obj):
        # Администратор имеет доступ ко всем объектам
        if request.user.role == 'ADMIN':
            return True
        
        # Проверяем, что объект принадлежит пользователю
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # Если объект - это сам пользователь
        return obj == request.user


class IsOwnerOrAdmin(BasePermission):
    """
    Разрешение для владельца объекта или администратора.
    """
    
    message = 'Вы можете управлять только своими данными.'
    
    def has_object_permission(self, request, view, obj):
        # Администратор имеет доступ ко всем объектам
        if request.user.role == 'ADMIN':
            return True
        
        # Проверяем владельца
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        return obj == request.user
