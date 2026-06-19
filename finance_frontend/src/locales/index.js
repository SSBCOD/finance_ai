import { ru } from './ru';
import { kz } from './kz';

export const locales = { ru, kz };

export const getTranslation = (language) => {
  return locales[language] || locales.ru;
};

// Функция для получения вложенного значения по ключу "a.b.c"
export const t = (translations, key, params = {}) => {
  const keys = key.split('.');
  let value = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }
  
  // Заменяем параметры {param} на значения
  if (typeof value === 'string' && Object.keys(params).length > 0) {
    return Object.entries(params).reduce(
      (str, [paramKey, paramValue]) => str.replace(`{${paramKey}}`, paramValue),
      value
    );
  }
  
  return value;
};
