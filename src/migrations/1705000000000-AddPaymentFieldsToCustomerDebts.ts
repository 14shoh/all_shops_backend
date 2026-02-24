import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPaymentFieldsToCustomerDebts1705000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('customer_debts');
    
    if (!table) {
      throw new Error('Table customer_debts does not exist');
    }

    // Проверяем, существует ли колонка paidAmount
    const paidAmountExists = table.columns.find(
      (column) => column.name === 'paidAmount',
    );

    if (!paidAmountExists) {
      await queryRunner.addColumn(
        'customer_debts',
        new TableColumn({
          name: 'paidAmount',
          type: 'decimal',
          precision: 10,
          scale: 2,
          default: 0,
          isNullable: false,
        }),
      );
      console.log('✅ Column paidAmount added to customer_debts');
    } else {
      console.log('Column paidAmount already exists in customer_debts');
    }

    // Проверяем, существует ли колонка remainingAmount
    const remainingAmountExists = table.columns.find(
      (column) => column.name === 'remainingAmount',
    );

    if (!remainingAmountExists) {
      await queryRunner.addColumn(
        'customer_debts',
        new TableColumn({
          name: 'remainingAmount',
          type: 'decimal',
          precision: 10,
          scale: 2,
          default: 0,
          isNullable: false,
        }),
      );
      console.log('✅ Column remainingAmount added to customer_debts');
    } else {
      console.log('Column remainingAmount already exists in customer_debts');
    }

    // Обновляем существующие записи: remainingAmount = amount - paidAmount
    await queryRunner.query(`
      UPDATE customer_debts 
      SET remainingAmount = amount - COALESCE(paidAmount, 0)
      WHERE remainingAmount IS NULL OR remainingAmount = 0
    `);
    console.log('✅ Updated existing customer_debts records');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('customer_debts');
    
    if (table) {
      const paidAmountExists = table.columns.find(
        (column) => column.name === 'paidAmount',
      );

      if (paidAmountExists) {
        await queryRunner.dropColumn('customer_debts', 'paidAmount');
        console.log('Column paidAmount removed from customer_debts');
      }

      const remainingAmountExists = table.columns.find(
        (column) => column.name === 'remainingAmount',
      );

      if (remainingAmountExists) {
        await queryRunner.dropColumn('customer_debts', 'remainingAmount');
        console.log('Column remainingAmount removed from customer_debts');
      }
    }
  }
}
