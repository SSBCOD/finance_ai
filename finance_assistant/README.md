# AI Finance Assistant - Backend

AI-помощник для управления личными финансами. Дипломный проект.

## 🚀 Технологии

- **Python 3.x**
- **Django 4.2**
- **Django REST Framework**
- **JWT аутентификация** (Simple JWT)
- **SQLite** (по умолчанию) / PostgreSQL
- **Groq API** (AI-чат с LLaMA)

## 📁 Структура проекта

```
finance_assistant/
├── config/                  # Конфигурация Django
│   ├── settings.py         # Настройки проекта
│   ├── urls.py             # Главный роутер
│   └── wsgi.py
├── apps/
│   ├── users/              # Пользователи и аутентификация
│   │   ├── models.py       # Custom User Model с ролями
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── permissions.py  # IsAdmin, IsOwner, etc.
│   │   └── urls.py
│   ├── finances/           # Доходы, расходы, категории
│   │   ├── models.py       # Category, Income, Expense
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── services.py     # Аналитика и расчёты
│   │   └── urls.py
│   ├── budget/             # Бюджет и лимиты
│   │   ├── models.py       # MonthlyBudget, CategoryLimit
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── services.py     # Расчёт остатка бюджета
│   │   └── urls.py
│   └── ai_assistant/       # AI-чат (Groq API)
│       ├── models.py       # ChatMessage
│       ├── services.py     # Интеграция с Groq API
│       ├── views.py
│       └── urls.py
├── manage.py
├── requirements.txt
└── .env.example
```

## 🌍 Мультиязычность

Поддерживаются 2 языка:
- **Русский (ru)** - по умолчанию
- **Казахский (kz)**

Язык выбирается при регистрации и сохраняется в профиле пользователя.
AI-помощник отвечает строго на языке пользователя.

## 👤 Роли пользователей

| Роль | Описание |
|------|----------|
| **ADMIN** | Полный доступ ко всем данным |
| **USER** | Доступ только к своим данным |

**Важно:**
- Первый зарегистрированный пользователь автоматически получает роль `ADMIN`
- Все последующие пользователи получают роль `USER`
- Роль **нельзя** передать при регистрации
- Менять роли может только `ADMIN`

## 🔧 Установка и запуск

### 1. Клонирование и настройка окружения

```bash
# Клонируйте проект
cd finance_assistant

# Создайте виртуальное окружение
python -m venv venv

# Активируйте окружение
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Установите зависимости
pip install -r requirements.txt
```

### 2. Настройка переменных окружения

```bash
# Скопируйте пример файла
cp .env.example .env

# Отредактируйте .env
# Обязательно укажите:
# - SECRET_KEY (для production)
# - GROQ_API_KEY (получите на https://console.groq.com)
```

### 3. Применение миграций и создание категорий

```bash
# Создайте миграции
python manage.py makemigrations

# Примените миграции
python manage.py migrate

# Создайте предустановленные категории
python manage.py create_default_categories
```

### 4. Запуск сервера

```bash
python manage.py runserver
```

Сервер будет доступен по адресу: `http://localhost:8000`

## 📚 API Endpoints

### Аутентификация

| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/api/users/register/` | Регистрация |
| POST | `/api/users/login/` | Вход (JWT) |
| POST | `/api/token/refresh/` | Обновление токена |
| GET | `/api/users/profile/` | Профиль пользователя |
| PATCH | `/api/users/profile/` | Обновление профиля |
| POST | `/api/users/change-password/` | Смена пароля |

### Категории

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/finances/categories/` | Список категорий |
| POST | `/api/finances/categories/create/` | Создать категорию |
| GET/PATCH/DELETE | `/api/finances/categories/<id>/` | Управление категорией |

### Доходы

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/finances/incomes/` | Список доходов |
| POST | `/api/finances/incomes/` | Создать доход |
| GET/PATCH/DELETE | `/api/finances/incomes/<id>/` | Управление доходом |

### Расходы

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/finances/expenses/` | Список расходов |
| POST | `/api/finances/expenses/` | Создать расход |
| GET/PATCH/DELETE | `/api/finances/expenses/<id>/` | Управление расходом |

### Аналитика

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/finances/analytics/` | Финансовая аналитика |

### Бюджет

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/budget/` | Список бюджетов |
| POST | `/api/budget/create/` | Создать бюджет |
| GET | `/api/budget/current/` | Текущий бюджет |
| GET | `/api/budget/summary/` | Сводка по бюджету |
| GET/PATCH/DELETE | `/api/budget/<id>/` | Управление бюджетом |
| POST | `/api/budget/<id>/limits/` | Добавить лимит категории |

### 🤖 AI-чат

| Метод | URL | Описание |
|-------|-----|----------|
| **POST** | **`/api/ai/chat/`** | **Чат с AI-помощником** |
| GET | `/api/ai/history/` | История сообщений |
| DELETE | `/api/ai/history/clear/` | Очистить историю |

## 🧪 Примеры запросов

### Регистрация

```bash
curl -X POST http://localhost:8000/api/users/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "testuser",
    "password": "securepass123",
    "password_confirm": "securepass123",
    "language": "ru",
    "currency": "KZT"
  }'
```

### Вход

```bash
curl -X POST http://localhost:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepass123"
  }'
```

### Добавление расхода

```bash
curl -X POST http://localhost:8000/api/finances/expenses/ \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "15000.00",
    "category": 1,
    "date": "2024-01-15",
    "comment": "Продукты на неделю"
  }'
```

### Чат с AI

```bash
curl -X POST http://localhost:8000/api/ai/chat/ \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -H "Accept-Language: ru" \
  -d '{
    "message": "Как оптимизировать мои расходы?"
  }'
```

## 🔐 Настройка Groq API

1. Зарегистрируйтесь на [Groq Console](https://console.groq.com)
2. Создайте API ключ
3. Добавьте ключ в `.env`:

```
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx
GROQ_MODEL=llama-3.3-70b-versatile
```

### Как работает AI-чат

1. Пользователь отправляет сообщение
2. Backend собирает агрегированные финансовые данные:
   - Доходы за месяц
   - Расходы за месяц (по категориям)
   - Бюджет и остаток
3. Формируется промпт с явным указанием языка
4. Запрос отправляется в Groq API
5. Ответ возвращается пользователю

**Важно:**
- AI **не имеет** прямого доступа к базе данных
- AI **только анализирует** переданные данные
- AI **не может** изменять данные пользователя

## 📝 Лицензия

MIT License

## 👨‍💻 Автор

Дипломный проект
