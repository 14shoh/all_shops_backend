# API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
Все защищенные endpoints требуют JWT токен в заголовке:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### POST /auth/login
Авторизация пользователя

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "access_token": "string",
  "user": {
    "id": 1,
    "username": "string",
    "role": "seller|shop_owner|admin_of_app",
    "shopId": 1
  }
}
```

### POST /auth/register
Регистрация нового пользователя (только для админа)

---

## Shops Endpoints

### GET /shops
Получить список всех магазинов (только админ)

### GET /shops/active
Получить список активных магазинов

### GET /shops/:id
Получить информацию о магазине

### GET /shops/:id/statistics
Получить статистику магазина

### POST /shops
Создать магазин (только админ)

### PATCH /shops/:id
Обновить магазин (только админ)

### PATCH /shops/:id/block
Заблокировать магазин (только админ)

### PATCH /shops/:id/unblock
Разблокировать магазин (только админ)

### DELETE /shops/:id
Удалить магазин (только админ)

---

## Users Endpoints

### GET /users
Получить список пользователей (только админ)

### GET /users/shop/:shopId
Получить пользователей магазина

### GET /users/:id
Получить пользователя

### POST /users
Создать пользователя (только админ)

### PATCH /users/:id
Обновить пользователя (только админ)

### PATCH /users/:id/block
Заблокировать пользователя (только админ)

### PATCH /users/:id/unblock
Разблокировать пользователя (только админ)

### PATCH /users/:id/regenerate-credentials
Регенерировать логин/пароль (только админ)

### DELETE /users/:id
Удалить пользователя (только админ)

---

## Products Endpoints

### GET /products
Получить список товаров

**Query params:**
- `shopId` - ID магазина
- `category` - категория товара
- `search` - поиск по названию или штрихкоду

### GET /products/:id
Получить товар

### GET /products/barcode/:barcode
Найти товар по штрихкоду

**Query params:**
- `shopId` - ID магазина

### GET /products/categories
Получить список категорий

**Query params:**
- `shopId` - ID магазина

### GET /products/low-stock
Получить товары с низким остатком

**Query params:**
- `shopId` - ID магазина
- `threshold` - порог (по умолчанию 10)

### POST /products
Создать товар

**Request:**
```json
{
  "name": "string",
  "barcode": "string",
  "category": "string",
  "purchasePrice": 100.50,
  "quantity": 10,
  "size": "M",
  "weight": 1.5,
  "shopId": 1
}
```

### PATCH /products/:id
Обновить товар

### PATCH /products/:id/quantity
Обновить количество товара

### DELETE /products/:id
Удалить товар

---

## Sales Endpoints

### POST /sales
Создать продажу

**Request:**
```json
{
  "shopId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "salePrice": 150.00
    }
  ]
}
```

### GET /sales
Получить список продаж

**Query params:**
- `shopId` - ID магазина
- `startDate` - начальная дата
- `endDate` - конечная дата

### GET /sales/:id
Получить продажу

### GET /sales/daily
Получить продажи за день

**Query params:**
- `shopId` - ID магазина
- `date` - дата (YYYY-MM-DD)

### GET /sales/seller/:sellerId/daily
Получить дневной отчет продавца

**Query params:**
- `date` - дата (YYYY-MM-DD)

---

## Warehouse Endpoints

### GET /warehouse/status
Получить статус склада

**Query params:**
- `shopId` - ID магазина

### GET /warehouse/category
Получить товары по категории

**Query params:**
- `shopId` - ID магазина
- `category` - категория

### GET /warehouse/low-stock
Получить товары с низким остатком

**Query params:**
- `shopId` - ID магазина
- `threshold` - порог

### GET /warehouse/out-of-stock
Получить товары без остатка

**Query params:**
- `shopId` - ID магазина

---

## Expenses Endpoints

### POST /expenses
Создать расход

**Request:**
```json
{
  "amount": 500.00,
  "description": "string",
  "category": "string",
  "shopId": 1
}
```

### GET /expenses
Получить список расходов

**Query params:**
- `shopId` - ID магазина
- `startDate` - начальная дата
- `endDate` - конечная дата

### GET /expenses/total
Получить общую сумму расходов

### GET /expenses/:id
Получить расход

### PATCH /expenses/:id
Обновить расход

### DELETE /expenses/:id
Удалить расход

---

## Analytics Endpoints

### GET /analytics/financial
Получить финансовую аналитику (владелец/админ)

**Query params:**
- `shopId` - ID магазина
- `period` - период: day|month|year

### GET /analytics/top-products
Получить топ продаваемых товаров (владелец/админ)

**Query params:**
- `shopId` - ID магазина
- `limit` - количество (по умолчанию 10)

### GET /analytics/unsold-products
Получить непродаваемые товары (владелец/админ)

**Query params:**
- `shopId` - ID магазина
- `days` - количество дней (по умолчанию 30)

### GET /analytics/sales
Получить аналитику продаж (владелец/админ)

**Query params:**
- `shopId` - ID магазина
- `startDate` - начальная дата
- `endDate` - конечная дата

---

## Inventory Endpoints

### POST /inventory
Создать инвентаризацию (владелец/админ)

**Request:**
```json
{
  "shopId": 1,
  "notes": "string",
  "items": [
    {
      "productId": 1,
      "expectedQuantity": 10,
      "actualQuantity": 8
    }
  ]
}
```

### GET /inventory
Получить список инвентаризаций

**Query params:**
- `shopId` - ID магазина

### GET /inventory/:id
Получить инвентаризацию

### GET /inventory/:id/report
Получить отчет по инвентаризации (владелец/админ)

### PATCH /inventory/:id/complete
Завершить инвентаризацию (владелец/админ)

---

## Shop Settings Endpoints

### GET /shop-settings/:shopId
Получить настройки магазина

### PATCH /shop-settings/:shopId
Обновить настройки магазина (только админ)

**Request:**
```json
{
  "enableSizes": true,
  "enableWeight": true,
  "enableBarcode": true,
  "enableCategories": true
}
```

---

## Roles

- **seller** - Продавец
- **shop_owner** - Владелец магазина
- **admin_of_app** - Администратор

## Error Responses

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```
