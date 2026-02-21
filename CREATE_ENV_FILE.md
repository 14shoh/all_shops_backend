# Создание файла .env

Файл `.env` необходим для настройки подключения к базе данных и других параметров приложения.

## Инструкция

### Вариант 1: Скопировать из примера

1. Откройте терминал в папке `backend_nestjs`
2. Выполните команду:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Windows (CMD):**
```cmd
copy .env.example .env
```

**Linux/Mac:**
```bash
cp .env.example .env
```

### Вариант 2: Создать вручную

1. Создайте файл `.env` в папке `backend_nestjs`
2. Скопируйте содержимое из `.env.example`
3. Отредактируйте значения под вашу конфигурацию:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=ваш_пароль_MySQL
DB_DATABASE=all_shops

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production-min-32-characters
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3000
NODE_ENV=development
```

## Важно

- Если у вас нет пароля для MySQL, оставьте `DB_PASSWORD=` пустым
- Для продакшена обязательно измените `JWT_SECRET` на сложный случайный ключ (минимум 32 символа)
- Файл `.env` не должен попадать в git (он уже в .gitignore)

## Проверка

После создания файла `.env` проверьте подключение:

```bash
npm run start:dev
```

Если все настроено правильно, приложение запустится без ошибок подключения к БД.
