import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPaymentAccountNumber1703000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('shop_settings');
    
    if (!table) {
      throw new Error('Table shop_settings does not exist');
    }

    // Проверяем, существует ли колонка
    const columnExists = table.columns.find(
      (column) => column.name === 'paymentAccountNumber',
    );

    if (!columnExists) {
      await queryRunner.addColumn(
        'shop_settings',
        new TableColumn({
          name: 'paymentAccountNumber',
          type: 'varchar',
          length: '50',
          isNullable: true,
        }),
      );
      console.log('Column paymentAccountNumber added to shop_settings');
    } else {
      console.log('Column paymentAccountNumber already exists in shop_settings');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('shop_settings');
    
    if (table) {
      const columnExists = table.columns.find(
        (column) => column.name === 'paymentAccountNumber',
      );

      if (columnExists) {
        await queryRunner.dropColumn('shop_settings', 'paymentAccountNumber');
        console.log('Column paymentAccountNumber removed from shop_settings');
      }
    }
  }
}
