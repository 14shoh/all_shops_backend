import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateCategoriesTable1708000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'categories',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'icon',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'color',
            type: 'varchar',
            length: '20',
            default: "'#6366f1'",
          },
          {
            name: 'parentId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deletedAt',
            type: 'datetime',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'categories',
      new TableForeignKey({
        columnNames: ['parentId'],
        referencedTableName: 'categories',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('categories');
    const fk = table?.foreignKeys.find((k) => k.columnNames.indexOf('parentId') !== -1);
    if (fk) await queryRunner.dropForeignKey('categories', fk);
    await queryRunner.dropTable('categories', true);
  }
}
