import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateDebtsTables1704000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Проверяем, существует ли таблица customer_debts
    const customerDebtsTable = await queryRunner.getTable('customer_debts');
    if (customerDebtsTable) {
      console.log('Table customer_debts already exists, skipping creation');
    } else {
      // Создаем таблицу customer_debts (долги клиентов)
      await queryRunner.createTable(
        new Table({
          name: 'customer_debts',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'customerName',
              type: 'varchar',
              length: '255',
            },
            {
              name: 'amount',
              type: 'decimal',
              precision: 10,
              scale: 2,
            },
            {
              name: 'description',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'debtDate',
              type: 'date',
            },
            {
              name: 'shopId',
              type: 'int',
            },
            {
              name: 'userId',
              type: 'int',
            },
            {
              name: 'createdAt',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updatedAt',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
              onUpdate: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'deletedAt',
              type: 'timestamp',
              isNullable: true,
            },
          ],
        }),
        true,
      );

      // Создаем индексы для customer_debts
      await queryRunner.createIndex(
        'customer_debts',
        new TableIndex({
          name: 'IDX_CUSTOMER_DEBTS_SHOP_ID',
          columnNames: ['shopId'],
        }),
      );

      await queryRunner.createIndex(
        'customer_debts',
        new TableIndex({
          name: 'IDX_CUSTOMER_DEBTS_USER_ID',
          columnNames: ['userId'],
        }),
      );

      await queryRunner.createIndex(
        'customer_debts',
        new TableIndex({
          name: 'IDX_CUSTOMER_DEBTS_DATE',
          columnNames: ['debtDate'],
        }),
      );

      // Создаем внешние ключи для customer_debts
      await queryRunner.createForeignKey(
        'customer_debts',
        new TableForeignKey({
          columnNames: ['shopId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'shops',
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'customer_debts',
        new TableForeignKey({
          columnNames: ['userId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        }),
      );
      console.log('✅ Table customer_debts created');
    }

    // Проверяем, существует ли таблица supplier_debts
    const supplierDebtsTable = await queryRunner.getTable('supplier_debts');
    if (supplierDebtsTable) {
      console.log('Table supplier_debts already exists, skipping creation');
    } else {
      // Создаем таблицу supplier_debts (долги фирмам)
      await queryRunner.createTable(
        new Table({
          name: 'supplier_debts',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'supplierName',
              type: 'varchar',
              length: '255',
            },
            {
              name: 'totalDebt',
              type: 'decimal',
              precision: 10,
              scale: 2,
            },
            {
              name: 'paidAmount',
              type: 'decimal',
              precision: 10,
              scale: 2,
              default: 0,
            },
            {
              name: 'remainingAmount',
              type: 'decimal',
              precision: 10,
              scale: 2,
              default: 0,
            },
            {
              name: 'shopId',
              type: 'int',
            },
            {
              name: 'userId',
              type: 'int',
            },
            {
              name: 'createdAt',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updatedAt',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
              onUpdate: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'deletedAt',
              type: 'timestamp',
              isNullable: true,
            },
          ],
        }),
        true,
      );

      // Создаем индексы для supplier_debts
      await queryRunner.createIndex(
        'supplier_debts',
        new TableIndex({
          name: 'IDX_SUPPLIER_DEBTS_SHOP_ID',
          columnNames: ['shopId'],
        }),
      );

      await queryRunner.createIndex(
        'supplier_debts',
        new TableIndex({
          name: 'IDX_SUPPLIER_DEBTS_USER_ID',
          columnNames: ['userId'],
        }),
      );

      // Создаем внешние ключи для supplier_debts
      await queryRunner.createForeignKey(
        'supplier_debts',
        new TableForeignKey({
          columnNames: ['shopId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'shops',
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'supplier_debts',
        new TableForeignKey({
          columnNames: ['userId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        }),
      );
      console.log('✅ Table supplier_debts created');
    }

    console.log('✅ Migration CreateDebtsTables completed');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем внешние ключи
    const customerDebtsTable = await queryRunner.getTable('customer_debts');
    if (customerDebtsTable) {
      const foreignKeys = customerDebtsTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('customer_debts', fk);
      }
    }

    const supplierDebtsTable = await queryRunner.getTable('supplier_debts');
    if (supplierDebtsTable) {
      const foreignKeys = supplierDebtsTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('supplier_debts', fk);
      }
    }

    // Удаляем таблицы
    await queryRunner.dropTable('customer_debts');
    await queryRunner.dropTable('supplier_debts');
    console.log('✅ Tables customer_debts and supplier_debts dropped');
  }
}
