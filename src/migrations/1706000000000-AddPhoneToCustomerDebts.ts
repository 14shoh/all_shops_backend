import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPhoneToCustomerDebts1706000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('customer_debts');
    if (!table) {
      throw new Error('Table customer_debts does not exist');
    }

    const phoneExists = table.columns.find((c) => c.name === 'phone');
    if (!phoneExists) {
      await queryRunner.addColumn(
        'customer_debts',
        new TableColumn({
          name: 'phone',
          type: 'varchar',
          length: '50',
          isNullable: true,
        }),
      );
      console.log('✅ Column phone added to customer_debts');
    } else {
      console.log('Column phone already exists in customer_debts');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('customer_debts');
    if (!table) return;

    const phoneExists = table.columns.find((c) => c.name === 'phone');
    if (phoneExists) {
      await queryRunner.dropColumn('customer_debts', 'phone');
      console.log('Column phone removed from customer_debts');
    }
  }
}

