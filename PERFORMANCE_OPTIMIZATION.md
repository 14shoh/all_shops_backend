# Оптимизация производительности для 100+ магазинов

## Масштаб данных

- **100+ магазинов**
- **Магазины одежды**: ~4000 товаров, 100-200 продаж/день
- **Продуктовые магазины**: ~8000 товаров, 200-400 продаж/день
- **Среднее на магазин**: ~6000 товаров, ~150-300 продаж/день
- **Общий объем**: ~600,000 товаров, ~22,500 продаж/день

## Реализованные оптимизации

### 1. Пагинация
- ✅ Добавлена пагинация для списков товаров (по умолчанию 50 на страницу, макс 500)
- ✅ Добавлена пагинация для списков продаж (по умолчанию 50 на страницу, макс 200)
- ✅ Все запросы возвращают метаданные: `{ data, total, page, limit, totalPages }`

### 2. Database Connection Pool
- ✅ Увеличен connection pool с 30 до **50** (можно увеличить до 100 через `DB_CONNECTION_LIMIT`)
- ✅ Настроен `enableKeepAlive` для переиспользования соединений

### 3. Database Indexes
- ✅ Составные индексы `(shopId, createdAt)` для `sales`, `expenses`, `inventories`
- ✅ Индекс `(shopId, category)` для `products`
- ✅ Индексы на `saleId`, `productId` для `sale_items`
- ✅ Индексы на `shopId`, `role` для `users`

### 4. Query Optimization
- ✅ Аналитика использует DB агрегаты (`SUM`, `COUNT`) вместо загрузки всех строк
- ✅ Оптимизирован запрос непроданных товаров через `LEFT JOIN` с `HAVING COUNT = 0`
- ✅ Использование `QueryBuilder` для сложных запросов

### 4. Caching
- ✅ In-memory кеш для аналитики (TTL: 60 сек, макс 5000 элементов)
- ⚠️ **В production рекомендуется Redis** для распределенного кеширования

## Рекомендации по MySQL для Production

### 1. InnoDB Buffer Pool
Увеличьте размер буферного пула для кеширования данных в памяти:

```ini
# В my.cnf или my.ini
[mysqld]
# Рекомендуется 70-80% от доступной RAM
# Для сервера с 8GB RAM:
innodb_buffer_pool_size = 4G

# Для сервера с 16GB RAM:
innodb_buffer_pool_size = 8G

# Для сервера с 32GB RAM:
innodb_buffer_pool_size = 16G
```

### 2. Connection Settings
```ini
[mysqld]
# Максимальное количество соединений (должно быть больше чем connectionLimit в приложении)
max_connections = 200

# Таймаут для неактивных соединений
wait_timeout = 600
interactive_timeout = 600
```

### 3. Query Cache (MySQL 5.7 и ниже)
```ini
# Для MySQL 5.7 и ниже (в MySQL 8.0 удален)
query_cache_type = 1
query_cache_size = 256M
query_cache_limit = 2M
```

### 4. Logging (только для отладки)
```ini
# Отключите в production для производительности
slow_query_log = 0
general_log = 0
```

### 5. InnoDB Settings
```ini
[mysqld]
# Количество потоков для записи
innodb_write_io_threads = 8
innodb_read_io_threads = 8

# Размер лог-файлов
innodb_log_file_size = 512M
innodb_log_buffer_size = 64M

# Flush метод (для SSD)
innodb_flush_method = O_DIRECT
```

## Рекомендации по Backend для Production

### 1. Environment Variables
Добавьте в `.env`:

```env
# Database
DB_CONNECTION_LIMIT=100  # Увеличьте для пиковых нагрузок

# Cache (если используете Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TTL=60
```

### 2. Redis для Production
Для production с несколькими инстансами backend рекомендуется использовать Redis:

```bash
npm install cache-manager-redis-store redis
```

Затем в `app.module.ts`:

```typescript
import * as redisStore from 'cache-manager-redis-store';

CacheModule.register({
  store: redisStore,
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  ttl: 60,
  max: 10000,
}),
```

### 3. Мониторинг
- Используйте PM2 или аналоги для управления процессами
- Настройте мониторинг CPU, RAM, DB connections
- Логируйте медленные запросы (>1 сек)

### 4. Load Balancing
При использовании нескольких инстансов backend:
- Используйте Nginx или аналоги для балансировки нагрузки
- Настройте sticky sessions если нужно
- Используйте Redis для shared session storage

## Ожидаемая производительность

При правильной настройке MySQL и использовании всех оптимизаций:

- **Список товаров** (50 на страницу): < 100ms
- **Список продаж** (50 на страницу): < 150ms
- **Аналитика** (с кешем): < 50ms
- **Создание продажи**: < 200ms
- **Поиск товара по штрихкоду**: < 50ms

## Мониторинг производительности

### Проверка индексов
```sql
-- Проверить использование индексов
SHOW INDEX FROM sales;
SHOW INDEX FROM products;
SHOW INDEX FROM sale_items;

-- Анализ запросов
EXPLAIN SELECT * FROM sales WHERE shopId = 1 AND createdAt >= '2025-01-01';
```

### Проверка connection pool
```sql
-- Текущие соединения
SHOW PROCESSLIST;

-- Статистика соединений
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Max_used_connections';
```

### Медленные запросы
```sql
-- Включить логирование медленных запросов (>1 сек)
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;

-- Просмотр медленных запросов
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;
```

## Дополнительные оптимизации (при необходимости)

### 1. Партиционирование таблиц
Для очень больших таблиц (миллионы записей) можно использовать партиционирование по датам:

```sql
-- Пример партиционирования sales по месяцам
ALTER TABLE sales PARTITION BY RANGE (YEAR(createdAt) * 100 + MONTH(createdAt)) (
  PARTITION p202501 VALUES LESS THAN (202502),
  PARTITION p202502 VALUES LESS THAN (202503),
  -- ...
);
```

### 2. Архивация старых данных
- Перемещайте продажи старше 1-2 лет в архивную таблицу
- Используйте отдельную БД для аналитики (data warehouse)

### 3. Read Replicas
Для чтения аналитики используйте read replicas MySQL:
- Master для записи (продажи, товары)
- Replica для чтения (аналитика, отчеты)

## Чеклист перед запуском в Production

- [ ] Увеличьте `innodb_buffer_pool_size` в MySQL
- [ ] Настройте `max_connections` в MySQL
- [ ] Установите `DB_CONNECTION_LIMIT=100` в `.env`
- [ ] Настройте Redis для кеширования (опционально, но рекомендуется)
- [ ] Включите мониторинг (PM2, New Relic, DataDog и т.д.)
- [ ] Настройте логирование медленных запросов
- [ ] Протестируйте под нагрузкой (100+ одновременных пользователей)
- [ ] Настройте автоматические бэкапы БД
- [ ] Настройте алерты при превышении лимитов (CPU, RAM, connections)
