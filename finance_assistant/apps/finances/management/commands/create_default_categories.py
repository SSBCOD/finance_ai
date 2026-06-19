"""
Команда для создания предустановленных системных категорий.
Запуск: python manage.py create_default_categories
"""

from django.core.management.base import BaseCommand
from apps.finances.models import Category


class Command(BaseCommand):
    help = 'Создаёт предустановленные системные категории расходов и доходов'
    
    def handle(self, *args, **options):
        # Категории расходов
        expense_categories = [
            {'name': 'Продукты', 'name_kz': 'Азық-түлік', 'color': '#22C55E'},
            {'name': 'Транспорт', 'name_kz': 'Көлік', 'color': '#3B82F6'},
            {'name': 'Жильё', 'name_kz': 'Тұрғын үй', 'color': '#8B5CF6'},
            {'name': 'Коммунальные услуги', 'name_kz': 'Коммуналдық қызметтер', 'color': '#F59E0B'},
            {'name': 'Здоровье', 'name_kz': 'Денсаулық', 'color': '#EF4444'},
            {'name': 'Развлечения', 'name_kz': 'Ойын-сауық', 'color': '#EC4899'},
            {'name': 'Одежда', 'name_kz': 'Киім', 'color': '#14B8A6'},
            {'name': 'Образование', 'name_kz': 'Білім', 'color': '#6366F1'},
            {'name': 'Рестораны', 'name_kz': 'Мейрамханалар', 'color': '#F97316'},
            {'name': 'Подписки', 'name_kz': 'Жазылымдар', 'color': '#06B6D4'},
            {'name': 'Подарки', 'name_kz': 'Сыйлықтар', 'color': '#D946EF'},
            {'name': 'Путешествия', 'name_kz': 'Саяхаттар', 'color': '#0EA5E9'},
            {'name': 'Спорт', 'name_kz': 'Спорт', 'color': '#84CC16'},
            {'name': 'Домашние животные', 'name_kz': 'Үй жануарлары', 'color': '#A855F7'},
            {'name': 'Другое', 'name_kz': 'Басқа', 'color': '#6B7280'},
        ]
        
        # Категории доходов
        income_categories = [
            {'name': 'Зарплата', 'name_kz': 'Жалақы', 'color': '#22C55E'},
            {'name': 'Фриланс', 'name_kz': 'Фриланс', 'color': '#3B82F6'},
            {'name': 'Инвестиции', 'name_kz': 'Инвестициялар', 'color': '#8B5CF6'},
            {'name': 'Бизнес', 'name_kz': 'Бизнес', 'color': '#F59E0B'},
            {'name': 'Подарки', 'name_kz': 'Сыйлықтар', 'color': '#EC4899'},
            {'name': 'Аренда', 'name_kz': 'Жалға беру', 'color': '#14B8A6'},
            {'name': 'Продажа', 'name_kz': 'Сату', 'color': '#6366F1'},
            {'name': 'Другое', 'name_kz': 'Басқа', 'color': '#6B7280'},
        ]
        
        created_count = 0
        
        # Создаём категории расходов
        for cat_data in expense_categories:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                type=Category.Type.EXPENSE,
                is_system=True,
                user=None,
                defaults={
                    'name_kz': cat_data['name_kz'],
                    'color': cat_data['color'],
                }
            )
            if created:
                created_count += 1
                self.stdout.write(f"  ✓ Создана категория расходов: {category.name}")
        
        # Создаём категории доходов
        for cat_data in income_categories:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                type=Category.Type.INCOME,
                is_system=True,
                user=None,
                defaults={
                    'name_kz': cat_data['name_kz'],
                    'color': cat_data['color'],
                }
            )
            if created:
                created_count += 1
                self.stdout.write(f"  ✓ Создана категория доходов: {category.name}")
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nГотово! Создано {created_count} новых категорий.'
            )
        )
