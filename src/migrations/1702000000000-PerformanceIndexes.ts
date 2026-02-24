import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class PerformanceIndexes1702000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Helper function to check if index exists
    const indexExists = async (tableName: string, indexName: string): Promise<boolean> => {
      const result = await queryRunner.query(
        `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.STATISTICS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = ? 
         AND INDEX_NAME = ?`,
        [tableName, indexName],
      );
      return result[0].count > 0;
    };

    // Composite indexes for common filtering patterns
    if (!(await indexExists('sales', 'IDX_SALES_SHOP_CREATED_AT'))) {
      await queryRunner.createIndex(
        'sales',
        new TableIndex({
          name: 'IDX_SALES_SHOP_CREATED_AT',
          columnNames: ['shopId', 'createdAt'],
        }),
      );
    }

    if (!(await indexExists('expenses', 'IDX_EXPENSES_SHOP_CREATED_AT'))) {
      await queryRunner.createIndex(
        'expenses',
        new TableIndex({
          name: 'IDX_EXPENSES_SHOP_CREATED_AT',
          columnNames: ['shopId', 'createdAt'],
        }),
      );
    }

    if (!(await indexExists('inventories', 'IDX_INVENTORIES_SHOP_CREATED_AT'))) {
      await queryRunner.createIndex(
        'inventories',
        new TableIndex({
          name: 'IDX_INVENTORIES_SHOP_CREATED_AT',
          columnNames: ['shopId', 'createdAt'],
        }),
      );
    }

    if (!(await indexExists('products', 'IDX_PRODUCTS_SHOP_CATEGORY'))) {
      await queryRunner.createIndex(
        'products',
        new TableIndex({
          name: 'IDX_PRODUCTS_SHOP_CATEGORY',
          columnNames: ['shopId', 'category'],
        }),
      );
    }

    // Fast joins for analytics and listing
    if (!(await indexExists('sale_items', 'IDX_SALE_ITEMS_SALE_ID'))) {
      await queryRunner.createIndex(
        'sale_items',
        new TableIndex({
          name: 'IDX_SALE_ITEMS_SALE_ID',
          columnNames: ['saleId'],
        }),
      );
    }

    if (!(await indexExists('sale_items', 'IDX_SALE_ITEMS_PRODUCT_ID'))) {
      await queryRunner.createIndex(
        'sale_items',
        new TableIndex({
          name: 'IDX_SALE_ITEMS_PRODUCT_ID',
          columnNames: ['productId'],
        }),
      );
    }

    if (!(await indexExists('inventory_items', 'IDX_INVENTORY_ITEMS_INVENTORY_ID'))) {
      await queryRunner.createIndex(
        'inventory_items',
        new TableIndex({
          name: 'IDX_INVENTORY_ITEMS_INVENTORY_ID',
          columnNames: ['inventoryId'],
        }),
      );
    }

    if (!(await indexExists('users', 'IDX_USERS_SHOP_ID'))) {
      await queryRunner.createIndex(
        'users',
        new TableIndex({
          name: 'IDX_USERS_SHOP_ID',
          columnNames: ['shopId'],
        }),
      );
    }

    if (!(await indexExists('users', 'IDX_USERS_ROLE'))) {
      await queryRunner.createIndex(
        'users',
        new TableIndex({
          name: 'IDX_USERS_ROLE',
          columnNames: ['role'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('users', 'IDX_USERS_ROLE');
    await queryRunner.dropIndex('users', 'IDX_USERS_SHOP_ID');
    await queryRunner.dropIndex('inventory_items', 'IDX_INVENTORY_ITEMS_INVENTORY_ID');
    await queryRunner.dropIndex('sale_items', 'IDX_SALE_ITEMS_PRODUCT_ID');
    await queryRunner.dropIndex('sale_items', 'IDX_SALE_ITEMS_SALE_ID');
    await queryRunner.dropIndex('products', 'IDX_PRODUCTS_SHOP_CATEGORY');
    await queryRunner.dropIndex('inventories', 'IDX_INVENTORIES_SHOP_CREATED_AT');
    await queryRunner.dropIndex('expenses', 'IDX_EXPENSES_SHOP_CREATED_AT');
    await queryRunner.dropIndex('sales', 'IDX_SALES_SHOP_CREATED_AT');
  }
}

