-- Простой скрипт для добавления полей paidAmount и remainingAmount
-- Используйте этот скрипт, если миграция не работает

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

-- Проверка результата
DESCRIBE customer_debts;
