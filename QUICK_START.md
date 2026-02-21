# Быстрый старт

## 1. Установка зависимостей
```bash
npm install
```

## 2. Настройка базы данных

### Создайте базу данных MySQL:
```sql
CREATE DATABASE all_shops_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Настройте .env файл:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=all_shops_db
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=development
```

## 3. Запуск миграций (создание таблиц)
```bash
npm run migration:run
```

## 4. Запуск приложения

### Режим разработки:
```bash
npm run start:dev
```

### Продакшн режим:
```bash
npm run build
npm run start:prod
```

## 5. Проверка работы

Приложение будет доступно по адресу: `http://localhost:3000`

### Тестовый запрос:
```bash
curl http://localhost:3000
```

## Создание первого администратора

После запуска приложения создайте первого администратора через SQL:

```sql
USE all_shops_db;

INSERT INTO users (username, password, role, isActive, createdAt, updatedAt)
VALUES (
  'admin',
  '$2b$10$YourHashedPasswordHere', -- Используйте bcrypt для хеширования пароля
  'admin_of_app',
  true,
  NOW(),
  NOW()
);
```

Или используйте API endpoint `/auth/register` (если уже есть другой админ).

## Полезные команды

- `npm run migration:run` - Применить миграции
- `npm run migration:revert` - Откатить последнюю миграцию
- `npm run migration:generate -- src/migrations/Name` - Создать новую миграцию
- `npm run lint` - Проверить код
- `npm run test` - Запустить тесты
