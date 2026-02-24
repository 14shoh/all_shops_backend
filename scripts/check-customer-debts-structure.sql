-- Проверка структуры таблицы customer_debts
USE all_shops;

-- Показать все колонки таблицы
DESCRIBE customer_debts;

-- Проверить наличие полей paidAmount и remainingAmount
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'all_shops'
  AND TABLE_NAME = 'customer_debts'
  AND COLUMN_NAME IN ('paidAmount', 'remainingAmount');

-- Показать пример данных
SELECT 
    id,
    customerName,
    amount,
    paidAmount,
    remainingAmount,
    createdAt
FROM customer_debts
LIMIT 5;
