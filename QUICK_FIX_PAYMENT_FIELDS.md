# Быстрое исправление: добавление полей оплаты

## Проблема
В таблице `customer_debts` отсутствуют поля `paidAmount` и `remainingAmount`.

## Быстрое решение

Выполните SQL скрипт напрямую в MySQL:

```sql
USE all_shops;

-- Добавление колонки paidAmount
ALTER TABLE `customer_debts` 
ADD COLUMN `paidAmount` DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER `amount`;

-- Добавление колонки remainingAmount
ALTER TABLE `customer_debts` 
ADD COLUMN `remainingAmount` DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER `paidAmount`;

-- Обновление существующих записей
UPDATE `customer_debts` 
SET `remainingAmount` = `amount` - COALESCE(`paidAmount`, 0);
```

Или через командную строку:
```bash
mysql -u root -p all_shops < scripts/add-payment-fields-simple.sql
```

## Проверка

После выполнения проверьте структуру:
```sql
DESCRIBE customer_debts;
```

Должны быть видны поля:
- `amount` - общая сумма долга
- `paidAmount` - оплаченная сумма (новое поле)
- `remainingAmount` - остаток долга (новое поле)
