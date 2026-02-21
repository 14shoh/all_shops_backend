# Настройка базы данных

## Шаг 1: Создание базы данных

### Вариант 1: Через MySQL CLI
```bash
mysql -u root -p < database-setup.sql
```

### Вариант 2: Через MySQL Workbench или другой клиент
Выполните SQL команду:
```sql
CREATE DATABASE IF NOT EXISTS all_shops CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Шаг 2: Настройка переменных окружения

Убедитесь, что файл `.env` содержит правильные настройки:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=all_shops
```

## Шаг 3: Запуск миграций

### Применить миграции (создать таблицы)
```bash
npm run migration:run
```

### Откатить последнюю миграцию
```bash
npm run migration:revert
```

### Сгенерировать новую миграцию (если нужно)
```bash
npm run migration:generate -- src/migrations/MigrationName
```

## Шаг 4: Проверка

После выполнения миграций проверьте, что все таблицы созданы:

```sql
USE all_shops;
SHOW TABLES;
```

Должны быть созданы следующие таблицы:
- shops
- users
- shop_settings
- products
- sales
- sale_items
- expenses
- inventories
- inventory_items

## Важно

⚠️ **В режиме разработки (NODE_ENV=development)** TypeORM может автоматически синхронизировать схему БД.
Для продакшена обязательно используйте миграции и установите `synchronize: false` в конфигурации.
