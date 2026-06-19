import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ru } from '../locales/ru';
import { kz } from '../locales/kz';
import api from '../services/api';

const locales = { ru, kz };

const LanguageContext = createContext(null);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    const stored = localStorage.getItem('app_language');
    if (stored && locales[stored]) return stored;
    
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData.language && locales[userData.language]) {
          return userData.language;
        }
      } catch (e) {}
    }
    return 'ru';
  });

  const translations = locales[language] || locales.ru;

  const t = useCallback((key, params = {}) => {
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }
    
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      return Object.entries(params).reduce(
        (str, [paramKey, paramValue]) => str.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), paramValue),
        value
      );
    }
    
    return value;
  }, [translations]);

  // Смена языка - также обновляет профиль на сервере
  const changeLanguage = useCallback(async (newLang) => {
    if (!locales[newLang]) return;
    
    setLanguageState(newLang);
    localStorage.setItem('app_language', newLang);
    
    // Обновляем профиль на сервере если пользователь авторизован
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        await api.patch('/users/profile/', { language: newLang });
        // Обновляем user в localStorage
        const user = localStorage.getItem('user');
        if (user) {
          const userData = JSON.parse(user);
          userData.language = newLang;
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } catch (e) {
        console.error('Failed to update language on server:', e);
      }
    }
  }, []);

  // Синхронизация при изменении user
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        const storedLang = localStorage.getItem('app_language');
        // Приоритет: localStorage > user.language
        if (storedLang && locales[storedLang]) {
          if (userData.language !== storedLang) {
            setLanguageState(storedLang);
          }
        } else if (userData.language && locales[userData.language]) {
          setLanguageState(userData.language);
        }
      } catch (e) {}
    }
  }, []);

  const value = {
    language,
    setLanguage: changeLanguage,
    t,
    translations,
    availableLanguages: [
      { code: 'ru', name: 'Русский', flag: '🇷🇺' },
      { code: 'kz', name: 'Қазақша', flag: '🇰🇿' },
    ],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
