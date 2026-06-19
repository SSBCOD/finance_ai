import { format, parseISO, isValid } from 'date-fns';
import { ru } from 'date-fns/locale';

export const formatMoney = (amount, currency = 'KZT') => {
  const symbols = { KZT: '₸', RUB: '₽', USD: '$', EUR: '€' };
  const num = Number(amount);
  if (isNaN(num)) return '0';
  const formatted = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num);
  const symbol = symbols[currency] || currency;
  return currency === 'USD' || currency === 'EUR' ? `${symbol}${formatted}` : `${formatted} ${symbol}`;
};

export const formatDate = (date, formatStr = 'dd MMMM yyyy') => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isValid(dateObj) ? format(dateObj, formatStr, { locale: ru }) : '';
};

export const formatRelativeDate = (date) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '';
  const now = new Date();
  const diff = now - dateObj;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Сегодня';
  if (days === 1) return 'Вчера';
  if (days < 7) return `${days} дн. назад`;
  return format(dateObj, 'dd.MM.yyyy', { locale: ru });
};

export const getBalanceColor = (value) => {
  if (value > 0) return 'text-income-400';
  if (value < 0) return 'text-expense-400';
  return 'text-dark-400';
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Доброе утро';
  if (hour >= 12 && hour < 17) return 'Добрый день';
  if (hour >= 17 && hour < 22) return 'Добрый вечер';
  return 'Доброй ночи';
};

export const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

export const getCurrentMonthYear = () => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear(), monthName: monthNames[now.getMonth()] };
};
