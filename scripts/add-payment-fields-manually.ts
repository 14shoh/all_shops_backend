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
  synchronize: false,
  logging: true,
});

async function addPaymentFields() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Подключение к базе данных установлено');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    // Проверяем существование полей
    const table = await queryRunner.getTable('customer_debts');
    if (!table) {
      throw new Error('Таблица customer_debts не существует');
    }

    const paidAmountExists = table.columns.find((col) => col.name === 'paidAmount');
    const remainingAmountExists = table.columns.find((col) => col.name === 'remainingAmount');

    console.log('\n📊 Текущее состояние:');
    console.log(`   paidAmount существует: ${paidAmountExists ? '✅' : '❌'}`);
    console.log(`   remainingAmount существует: ${remainingAmountExists ? '✅' : '❌'}`);

    if (!paidAmountExists) {
      console.log('\n➕ Добавление поля paidAmount...');
      await queryRunner.query(`
        ALTER TABLE customer_debts 
        ADD COLUMN paidAmount DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER amount
      `);
      console.log('✅ Поле paidAmount добавлено');
    }

    if (!remainingAmountExists) {
      console.log('\n➕ Добавление поля remainingAmount...');
      await queryRunner.query(`
        ALTER TABLE customer_debts 
        ADD COLUMN remainingAmount DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER paidAmount
      `);
      console.log('✅ Поле remainingAmount добавлено');
    }

    // Обновляем существующие записи
    console.log('\n🔄 Обновление существующих записей...');
    const updateResult = await queryRunner.query(`
      UPDATE customer_debts 
      SET remainingAmount = amount - COALESCE(paidAmount, 0)
      WHERE remainingAmount IS NULL OR remainingAmount = 0
    `);
    console.log(`✅ Обновлено записей: ${updateResult.affectedRows || 0}`);

    // Проверяем результат
    console.log('\n📋 Финальная структура таблицы:');
    const finalTable = await queryRunner.getTable('customer_debts');
    const columns = finalTable?.columns.map((col) => col.name) || [];
    console.log('   Колонки:', columns.join(', '));

    await queryRunner.release();
    await AppDataSource.destroy();
    
    console.log('\n✅ Готово! Поля успешно добавлены.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Ошибка:', error);
    process.exit(1);
  }
}

addPaymentFields();
