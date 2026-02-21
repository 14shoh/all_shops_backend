-- Проверка данных в базе данных

-- 1. Проверка пользователей и их shopId
SELECT 
    id, 
    username, 
    role, 
    shopId, 
    isActive 
FROM users 
WHERE role = 'seller' OR role = 'shop_owner';

-- 2. Проверка магазинов
SELECT 
    id, 
    name, 
    type 
FROM shops;

-- 3. Проверка товаров и их shopId
SELECT 
    id, 
    name, 
    shopId, 
    quantity, 
    purchasePrice 
FROM products 
ORDER BY shopId;

-- 4. Проверка соответствия товаров магазинам
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.shopId,
    s.id as shop_id,
    s.name as shop_name
FROM products p
LEFT JOIN shops s ON p.shopId = s.id
ORDER BY p.shopId;

-- 5. Проверка пользователей без shopId
SELECT 
    id, 
    username, 
    role, 
    shopId 
FROM users 
WHERE (role = 'seller' OR role = 'shop_owner') 
  AND shopId IS NULL;
