import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

config();

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'all_shops',
  entities: [path.join(__dirname, '../src', '**', '*.entity.ts')],
  migrations: [path.join(__dirname, '../src', 'migrations', '*.ts')],
  synchronize: false,
  logging: true,
});

AppDataSource.initialize()
  .then(async () => {
    console.log('Data Source has been initialized!');
    
    // Проверяем, существует ли первая миграция в таблице migrations
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
      const result = await queryRunner.query(
        `SELECT * FROM migrations WHERE name = 'CreateInitialTables1700000000000'`
      );
      
      if (result.length === 0) {
        // Помечаем первую миграцию как выполненную
        await queryRunner.query(
          `INSERT INTO migrations (timestamp, name) VALUES (1700000000000, 'CreateInitialTables1700000000000')`
        );
        console.log('✅ Первая миграция помечена как выполненная');
      } else {
        console.log('ℹ️ Первая миграция уже помечена как выполненная');
      }
      
      // Теперь выполняем только вторую миграцию
      console.log('Запуск миграции RemoveBarcodeUniqueConstraint...');
      const migrations = await AppDataSource.runMigrations();
      
      if (migrations.length > 0) {
        console.log(`✅ Successfully ran ${migrations.length} migration(s):`);
        migrations.forEach((migration) => {
          console.log(`  - ${migration.name}`);
        });
      } else {
        console.log('ℹ️ No migrations to run. All migrations are already executed.');
      }
    } finally {
      await queryRunner.release();
    }
    
    await AppDataSource.destroy();
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during migration:', error);
    process.exit(1);
  });
