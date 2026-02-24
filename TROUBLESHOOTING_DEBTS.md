# Решение проблем с сохранением долгов

## Проблема: Данные не сохраняются в таблицы долгов

### Шаг 1: Проверьте, существуют ли таблицы

Выполните в MySQL:
```sql
USE all_shops;
SHOW TABLES LIKE '%debt%';
```

Если таблиц нет, перейдите к Шагу 2.

### Шаг 2: Создайте таблицы

**Вариант A: Через миграцию**
```bash
cd backend_nestjs
npm run migration:run
```

**Вариант B: Вручную через SQL**
```bash
mysql -u root -p all_shops < scripts/create-debts-tables.sql
```

### Шаг 3: Проверьте логи backend

При попытке создать долг, в консоли backend должны появиться:
- `📥 POST /customer-debts:` или `📥 POST /supplier-debts:`
- `📝 Создание долга...`
- `✅ Долг сохранен:`

Если видите ошибки:
- `Table 'all_shops.customer_debts' doesn't exist` - таблица не создана
- `Cannot add or update a child row: a foreign key constraint fails` - проблема с shopId или userId

### Шаг 4: Проверьте данные в базе

```sql
SELECT * FROM customer_debts ORDER BY createdAt DESC LIMIT 10;
SELECT * FROM supplier_debts ORDER BY createdAt DESC LIMIT 10;
```

### Шаг 5: Проверьте права доступа

Убедитесь, что пользователь БД имеет права на:
- CREATE TABLE
- INSERT
- SELECT
- UPDATE
- DELETE

## Частые ошибки

### Ошибка: "Table doesn't exist"
**Решение:** Создайте таблицы через миграцию или SQL скрипт

### Ошибка: "Foreign key constraint fails"
**Решение:** Убедитесь, что:
- `shopId` существует в таблице `shops`
- `userId` существует в таблице `users`

### Ошибка: "Validation failed"
**Решение:** Проверьте формат данных:
- `debtDate` должен быть в формате `YYYY-MM-DD`
- `amount` и `totalDebt` должны быть числами
- Все обязательные поля должны быть заполнены

## Тестирование API

### Создать долг клиента:
```bash
POST http://localhost:3000/customer-debts
Authorization: Bearer <token>
Content-Type: application/json

{
  "customerName": "Иван Иванов",
  "amount": 150.50,
  "description": "За товары",
  "debtDate": "2026-01-24",
  "shopId": 1
}
```

### Создать долг фирме:
```bash
POST http://localhost:3000/supplier-debts
Authorization: Bearer <token>
Content-Type: application/json

{
  "supplierName": "ООО Поставщик",
  "totalDebt": 5000.00,
  "paidAmount": 1000.00,
  "shopId": 1
}
```
