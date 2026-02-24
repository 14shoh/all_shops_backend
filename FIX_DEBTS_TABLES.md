# Исправление таблиц долгов

## Проблема
В таблице `customer_debts` отсутствуют поля `paidAmount` и `remainingAmount`, необходимые для отслеживания оплат.

## Решение

### Вариант 1: Через миграцию (рекомендуется)
```bash
cd backend_nestjs
npm run migration:run
```

### Вариант 2: Вручную через SQL
```bash
mysql -u root -p all_shops < scripts/add-payment-fields-to-customer-debts.sql
```

Или выполните SQL скрипт вручную через MySQL Workbench.

## Что делает миграция

1. Добавляет поле `paidAmount` (DECIMAL(10,2), по умолчанию 0) - сколько оплачено
2. Добавляет поле `remainingAmount` (DECIMAL(10,2), по умолчанию 0) - сколько осталось
3. Обновляет существующие записи: `remainingAmount = amount - paidAmount`

## Проверка

После выполнения миграции проверьте структуру таблицы:
```sql
DESCRIBE customer_debts;
```

Должны быть видны поля:
- `amount` - общая сумма долга
- `paidAmount` - оплаченная сумма
- `remainingAmount` - остаток долга

## Важно

- После миграции все существующие долги будут иметь `paidAmount = 0` и `remainingAmount = amount`
- Новые долги автоматически создаются с правильными значениями
- При оплате обновляются `paidAmount` и `remainingAmount`
