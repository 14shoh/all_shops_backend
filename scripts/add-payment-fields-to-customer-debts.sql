-- Скрипт для добавления полей paidAmount и remainingAmount в таблицу customer_debts
-- Используйте этот скрипт, если миграция не работает

USE all_shops;

-- Проверка существования колонки paidAmount
SELECT COUNT(*) as column_exists 
FROM information_schema.columns 
WHERE table_schema = 'all_shops' 
  AND table_name = 'customer_debts' 
  AND column_name = 'paidAmount';

-- Добавление колонки paidAmount (если не существует)
SET @dbname = DATABASE();
SET @tablename = 'customer_debts';
SET @columnname = 'paidAmount';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER amount')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Добавление колонки remainingAmount (если не существует)
SET @columnname = 'remainingAmount';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER paidAmount')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Обновление существующих записей: remainingAmount = amount - paidAmount
UPDATE `customer_debts` 
SET `remainingAmount` = `amount` - COALESCE(`paidAmount`, 0)
WHERE `remainingAmount` IS NULL OR `remainingAmount` = 0;

-- Проверка структуры таблицы
DESCRIBE customer_debts;
