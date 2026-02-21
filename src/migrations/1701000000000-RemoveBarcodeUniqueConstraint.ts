import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class RemoveBarcodeUniqueConstraint1701000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Удаляем уникальный индекс для barcode
    const table = await queryRunner.getTable('products');
    if (table) {
      const barcodeIndex = table.indices.find(
        (index) => index.columnNames.includes('barcode') && index.isUnique,
      );
      
      if (barcodeIndex && barcodeIndex.name) {
        await queryRunner.dropIndex('products', barcodeIndex.name);
      }
    }

    // Создаем составной индекс для barcode + shopId + size для быстрого поиска
    // Это позволит иметь одинаковые штрихкоды для разных размеров в одном магазине
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_PRODUCTS_BARCODE_SHOP_SIZE',
        columnNames: ['barcode', 'shopId', 'size'],
        isUnique: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем составной индекс
    await queryRunner.dropIndex('products', 'IDX_PRODUCTS_BARCODE_SHOP_SIZE');

    // Восстанавливаем уникальный индекс для barcode
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_PRODUCTS_BARCODE',
        columnNames: ['barcode'],
        isUnique: true,
      }),
    );
  }
}
