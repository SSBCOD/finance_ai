"""
Сервис для работы с AI (Groq API).
Ключевая часть проекта - формирование промпта и отправка запроса.

ВАЖНО:
- AI НЕ имеет прямого доступа к базе данных
- AI получает только агрегированные данные в виде текста
- AI только анализирует и отвечает, не изменяет данные
"""

import requests
import logging
from django.conf import settings
from datetime import date

from apps.finances.services import FinanceAnalyticsService
from apps.budget.services import BudgetService

logger = logging.getLogger(__name__)


class AIAssistantService:
    """
    Сервис для взаимодействия с AI (Groq API).
    """
    
    def __init__(self, user):
        self.user = user
        self.api_key = settings.GROQ_API_KEY
        self.api_url = settings.GROQ_API_URL
        self.model = settings.GROQ_MODEL
    
    def _get_language_instruction(self):
        """
        Получить инструкцию по языку ответа.
        Явно указываем AI на каком языке отвечать.
        """
        if self.user.language == 'kz':
            return "Қазақ тілінде жауап бер. Барлық жауаптарыңды қазақ тілінде жаз."
        return "Отвечай на русском языке. Все ответы должны быть на русском."
    
    def _get_system_prompt(self):
        """
        Формирование системного промпта для AI.
        Включает роль, ограничения и контекст.
        """
        language_instruction = self._get_language_instruction()
        currency_symbol = self.user.get_currency_symbol()
        currency_name = {
            'KZT': 'тенге',
            'RUB': 'рублей', 
            'USD': 'долларов',
            'EUR': 'евро'
        }.get(self.user.currency, self.user.currency)
        
        return f"""Ты - AI-помощник по управлению ЛИЧНЫМИ ФИНАНСАМИ.
{language_instruction}

ТВОЯ РОЛЬ:
- Помогать пользователю анализировать его финансы
- Давать советы по оптимизации расходов
- Отвечать на вопросы о бюджете и тратах
- Помогать планировать финансовое будущее

СТРОГИЕ ОГРАНИЧЕНИЯ - ОЧЕНЬ ВАЖНО:
1. Ты отвечаешь ТОЛЬКО на вопросы о личных финансах, бюджете, расходах, доходах, сбережениях и инвестициях.
2. Если пользователь спрашивает о чём-то НЕ связанном с финансами (политика, войны, новости, погода, рецепты, и т.д.), вежливо откажи и напомни, что ты финансовый помощник.
3. Ты НЕ можешь изменять данные пользователя - только анализировать.
4. НЕ используй markdown-форматирование (**, *, #, и т.д.) - пиши обычным текстом.
5. НЕ используй списки с маркерами - пиши связными предложениями и абзацами.

ВАЛЮТА - КРИТИЧЕСКИ ВАЖНО:
- Валюта пользователя: {currency_symbol} ({currency_name})
- ВСЕГДА используй символ {currency_symbol} при указании сумм
- Пример правильного формата: 100 000 {currency_symbol} или 100,000 {currency_symbol}
- НИКОГДА не используй $ или другие символы валют, только {currency_symbol}

СТИЛЬ ОБЩЕНИЯ:
- Будь дружелюбным и профессиональным
- Используй конкретные цифры из данных пользователя с правильной валютой ({currency_symbol})
- Давай практичные советы
- Пиши простым текстом без форматирования
- Если вопрос не о финансах, вежливо скажи: "Я специализируюсь только на финансовых вопросах. Могу помочь с анализом ваших доходов, расходов или бюджета."
"""
    
    def _gather_financial_context(self):
        """
        Сбор финансового контекста пользователя.
        Агрегированные данные, которые передаются AI.
        """
        # Получаем аналитику по финансам
        finance_service = FinanceAnalyticsService(self.user)
        analytics = finance_service.get_full_analytics()
        
        # Получаем данные по бюджету
        budget_service = BudgetService(self.user)
        budget_summary = budget_service.get_budget_summary()
        
        today = date.today()
        currency = self.user.get_currency_symbol()
        
        def format_money(amount):
            """Форматирование суммы с правильной валютой"""
            return f"{amount:,.2f} {currency}".replace(",", " ")
        
        # Формируем текстовый контекст
        context_parts = [
            f"ФИНАНСОВЫЕ ДАННЫЕ ПОЛЬЗОВАТЕЛЯ",
            f"Дата: {today.strftime('%d.%m.%Y')}",
            f"Валюта: {currency}",
            "",
            f"ДОХОДЫ ЗА ТЕКУЩИЙ МЕСЯЦ",
            f"Общая сумма доходов: {format_money(analytics['income']['total'])}",
        ]
        
        # Доходы по категориям
        if analytics['income']['by_category']:
            context_parts.append("Доходы по категориям:")
            for cat, amount in analytics['income']['by_category'].items():
                # Убираем эмодзи из названия категории
                clean_cat = ''.join(c for c in cat if c.isalnum() or c.isspace()).strip()
                context_parts.append(f"  {clean_cat}: {format_money(amount)}")
        
        context_parts.extend([
            "",
            f"РАСХОДЫ ЗА ТЕКУЩИЙ МЕСЯЦ",
            f"Общая сумма расходов: {format_money(analytics['expenses']['total'])}",
        ])
        
        # Расходы по категориям
        if analytics['expenses']['by_category']:
            context_parts.append("Расходы по категориям:")
            for cat, amount in analytics['expenses']['by_category'].items():
                clean_cat = ''.join(c for c in cat if c.isalnum() or c.isspace()).strip()
                context_parts.append(f"  {clean_cat}: {format_money(amount)}")
        
        context_parts.extend([
            "",
            f"БАЛАНС",
            f"Баланс за месяц: {format_money(analytics['balance']['month'])}",
            f"Общий баланс: {format_money(analytics['balance']['total'])}",
        ])
        
        # Информация о бюджете
        context_parts.append("")
        context_parts.append("БЮДЖЕТ")
        
        if budget_summary.get('has_budget'):
            context_parts.extend([
                f"Установленный бюджет: {format_money(budget_summary['total_budget'])}",
                f"Потрачено: {format_money(budget_summary['total_spent'])}",
                f"Остаток бюджета: {format_money(budget_summary['remaining'])}",
            ])
            
            if budget_summary['is_exceeded']:
                context_parts.append("ВНИМАНИЕ: Бюджет превышен!")
            
            # Лимиты по категориям
            if budget_summary.get('category_limits'):
                context_parts.append("Лимиты по категориям:")
                for limit in budget_summary['category_limits']:
                    clean_cat = ''.join(c for c in limit['category'] if c.isalnum() or c.isspace()).strip()
                    status = "превышен" if limit['is_exceeded'] else "в норме"
                    context_parts.append(
                        f"  {clean_cat}: лимит {format_money(limit['limit'])}, "
                        f"потрачено {format_money(limit['spent'])}, статус: {status}"
                    )
        else:
            context_parts.append("Бюджет на текущий месяц не установлен.")
        
        return "\n".join(context_parts)
    
    def _build_messages(self, user_message, include_context=True):
        """
        Формирование списка сообщений для API.
        """
        messages = [
            {"role": "system", "content": self._get_system_prompt()}
        ]
        
        # Добавляем финансовый контекст
        if include_context:
            context = self._gather_financial_context()
            messages.append({
                "role": "system",
                "content": f"Вот текущие финансовые данные пользователя:\n\n{context}"
            })
        
        # Добавляем сообщение пользователя
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        return messages
    
    def chat(self, user_message):
        """
        Отправка сообщения в AI и получение ответа.
        
        Args:
            user_message: Сообщение от пользователя
            
        Returns:
            dict: {
                'success': bool,
                'message': str (ответ AI или сообщение об ошибке),
                'error': str (опционально, детали ошибки)
            }
        """
        if not self.api_key:
            return {
                'success': False,
                'message': 'API ключ Groq не настроен. Обратитесь к администратору.',
                'error': 'GROQ_API_KEY not configured'
            }
        
        try:
            messages = self._build_messages(user_message)
            
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'model': self.model,
                'messages': messages,
                'max_tokens': 2048,
                'temperature': 0.7
            }
            
            logger.info(f"Sending request to Groq API for user {self.user.id}")
            
            response = requests.post(
                self.api_url,
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                ai_message = data['choices'][0]['message']['content']
                
                logger.info(f"Received response from Groq API for user {self.user.id}")
                
                return {
                    'success': True,
                    'message': ai_message
                }
            else:
                error_detail = response.json().get('error', {}).get('message', response.text)
                logger.error(f"Groq API error: {response.status_code} - {error_detail}")
                
                return {
                    'success': False,
                    'message': 'Произошла ошибка при обращении к AI. Попробуйте позже.',
                    'error': f'API error: {response.status_code} - {error_detail}'
                }
                
        except requests.exceptions.Timeout:
            logger.error("Groq API timeout")
            return {
                'success': False,
                'message': 'AI не ответил вовремя. Попробуйте ещё раз.',
                'error': 'Request timeout'
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"Groq API request error: {str(e)}")
            return {
                'success': False,
                'message': 'Ошибка соединения с AI. Проверьте интернет-соединение.',
                'error': str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error in AI service: {str(e)}")
            return {
                'success': False,
                'message': 'Произошла неожиданная ошибка.',
                'error': str(e)
            }
