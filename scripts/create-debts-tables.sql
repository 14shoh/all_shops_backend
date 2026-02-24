-- Скрипт для создания таблиц долгов вручную
-- Используйте этот скрипт, если миграция не работает

USE all_shops;

-- Проверка существования таблицы customer_debts
SELECT COUNT(*) as table_exists 
FROM information_schema.tables 
WHERE table_schema = 'all_shops' 
  AND table_name = 'customer_debts';

-- Создание таблицы customer_debts (если не существует)
CREATE TABLE IF NOT EXISTS `customer_debts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customerName` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text,
  `debtDate` date NOT NULL,
  `shopId` int NOT NULL,
  `userId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_CUSTOMER_DEBTS_SHOP_ID` (`shopId`),
  KEY `IDX_CUSTOMER_DEBTS_USER_ID` (`userId`),
  KEY `IDX_CUSTOMER_DEBTS_DATE` (`debtDate`),
  CONSTRAINT `FK_customer_debts_shop` FOREIGN KEY (`shopId`) REFERENCES `shops` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_customer_debts_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Проверка существования таблицы supplier_debts
SELECT COUNT(*) as table_exists 
FROM information_schema.tables 
WHERE table_schema = 'all_shops' 
  AND table_name = 'supplier_debts';

-- Создание таблицы supplier_debts (если не существует)
CREATE TABLE IF NOT EXISTS `supplier_debts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `supplierName` varchar(255) NOT NULL,
  `totalDebt` decimal(10,2) NOT NULL,
  `paidAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `remainingAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `shopId` int NOT NULL,
  `userId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_SUPPLIER_DEBTS_SHOP_ID` (`shopId`),
  KEY `IDX_SUPPLIER_DEBTS_USER_ID` (`userId`),
  CONSTRAINT `FK_supplier_debts_shop` FOREIGN KEY (`shopId`) REFERENCES `shops` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_supplier_debts_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Проверка созданных таблиц
SHOW TABLES LIKE '%debt%';
