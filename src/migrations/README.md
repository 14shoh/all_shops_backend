# Миграции базы данных

Для работы с миграциями используйте следующие команды:

## Генерация новой миграции
```bash
npm run migration:generate -- src/migrations/MigrationName
```

## Применение миграций
```bash
npm run migration:run
```

## Откат последней миграции
```bash
npm run migration:revert
```

## Важно
Перед запуском миграций убедитесь, что:
1. База данных MySQL создана
2. Файл `.env` настроен с правильными параметрами подключения
3. Переменная `NODE_ENV` не установлена в `development` (иначе TypeORM будет использовать synchronize)
