import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');
      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          const response = await authAPI.getProfile();
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { access, refresh, user: userData } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      toast.success(`Добро пожаловать, ${userData.username}!`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Ошибка входа';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (data) => {
    try {
      await authAPI.register(data);
      toast.success('Регистрация успешна! Теперь войдите в аккаунт.');
      return { success: true };
    } catch (error) {
      const errors = error.response?.data;
      let message = 'Ошибка регистрации';
      if (errors) {
        message = Object.entries(errors).map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`).join('\n');
      }
      toast.error(message);
      return { success: false, error: errors };
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    toast.success('Вы вышли из аккаунта');
  };

  const updateProfile = async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      const updatedUser = { ...user, ...response.data };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Профиль обновлён');
      return { success: true };
    } catch {
      toast.error('Ошибка обновления профиля');
      return { success: false };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, isAdmin: user?.role === 'ADMIN', login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
