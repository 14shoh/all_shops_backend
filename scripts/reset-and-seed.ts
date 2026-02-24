import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../src/users/entities/user.entity';
import { Shop, ShopType } from '../src/shops/entities/shop.entity';
import { ShopSettings } from '../src/shop-settings/entities/shop-settings.entity';

config();

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'all_shops',
  entities: [join(__dirname, '..', 'src', '**', '*.entity{.ts,.js}')],
  synchronize: false,
  logging: false,
});

async function resetAndSeed() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Подключение к базе данных установлено!');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    console.log('\n🗑️  Начинаю очистку базы данных...');

    // Отключаем проверку внешних ключей для безопасного удаления
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');

    // Список таблиц в порядке удаления (сначала зависимые таблицы)
    const tables = [
      'sale_items',
      'inventory_items',
      'sales',
      'expenses',
      'inventories',
      'customer_debts',
      'supplier_debts',
      'products',
      'shop_settings',
      'users',
      'shops',
    ];

    for (const table of tables) {
      try {
        const result = await queryRunner.query(`DELETE FROM ${table}`);
        console.log(`   ✓ Очищена таблица: ${table} (удалено записей: ${result.affectedRows || 0})`);
      } catch (error: any) {
        // Если таблица не существует, просто пропускаем
        if (error.code === 'ER_NO_SUCH_TABLE') {
          console.log(`   ⚠ Таблица ${table} не существует, пропускаю...`);
        } else {
          console.error(`   ✗ Ошибка при очистке таблицы ${table}:`, error.message);
        }
      }
    }

    // Сбрасываем AUTO_INCREMENT для всех таблиц
    for (const table of tables) {
      try {
        await queryRunner.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
      } catch (error: any) {
        // Игнорируем ошибки, если таблица не существует
      }
    }

    // Включаем проверку внешних ключей обратно
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');

    await queryRunner.release();

    console.log('✅ База данных очищена!\n');

    // Теперь запускаем seed
    console.log('🌱 Начинаю заполнение тестовыми данными...\n');

    const userRepository = AppDataSource.getRepository(User);
    const shopRepository = AppDataSource.getRepository(Shop);
    const shopSettingsRepository = AppDataSource.getRepository(ShopSettings);

    // Создаем администратора
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = userRepository.create({
      username: 'admin',
      password: adminPassword,
      role: UserRole.ADMIN,
      fullName: 'Администратор',
      isActive: true,
    });
    await userRepository.save(admin);
    console.log('✅ Администратор создан:');
    console.log('   Логин: admin');
    console.log('   Пароль: admin123');

    // Создаем магазин одежды
    const clothingShop = shopRepository.create({
      name: 'Магазин Одежды "Мода"',
      type: ShopType.CLOTHING,
      description: 'Магазин модной одежды',
      address: 'ул. Примерная, д. 1',
      phone: '+7 (999) 123-45-67',
      isActive: true,
    });
    await shopRepository.save(clothingShop);
    console.log('✅ Магазин одежды создан:', clothingShop.name);

    // Настройки для магазина одежды
    const clothingSettings = shopSettingsRepository.create({
      shopId: clothingShop.id,
      enableSizes: true,
      enableWeight: false,
      enableBarcode: true,
      enableCategories: true,
    });
    await shopSettingsRepository.save(clothingSettings);

    // Создаем владельца магазина одежды
    const owner1Password = await bcrypt.hash('owner123', 10);
    const owner1 = userRepository.create({
      username: 'owner_clothing',
      password: owner1Password,
      role: UserRole.SHOP_OWNER,
      fullName: 'Владелец магазина одежды',
      shopId: clothingShop.id,
      isActive: true,
    });
    await userRepository.save(owner1);
    console.log('✅ Владелец создан:');
    console.log('   Логин: owner_clothing');
    console.log('   Пароль: owner123');
    console.log('   Магазин:', clothingShop.name);

    // Создаем продавца для магазина одежды
    const seller1Password = await bcrypt.hash('seller123', 10);
    const seller1 = userRepository.create({
      username: 'seller_clothing',
      password: seller1Password,
      role: UserRole.SELLER,
      fullName: 'Продавец магазина одежды',
      shopId: clothingShop.id,
      isActive: true,
    });
    await userRepository.save(seller1);
    console.log('✅ Продавец создан:');
    console.log('   Логин: seller_clothing');
    console.log('   Пароль: seller123');
    console.log('   Магазин:', clothingShop.name);

    // Создаем продуктовый магазин
    const groceryShop = shopRepository.create({
      name: 'Продуктовый магазин "Свежесть"',
      type: ShopType.GROCERY,
      description: 'Продуктовый магазин',
      address: 'ул. Примерная, д. 2',
      phone: '+7 (999) 123-45-68',
      isActive: true,
    });
    await shopRepository.save(groceryShop);
    console.log('✅ Продуктовый магазин создан:', groceryShop.name);

    // Настройки для продуктового магазина
    const grocerySettings = shopSettingsRepository.create({
      shopId: groceryShop.id,
      enableSizes: false,
      enableWeight: true,
      enableBarcode: true,
      enableCategories: true,
    });
    await shopSettingsRepository.save(grocerySettings);

    // Создаем владельца продуктового магазина
    const owner2Password = await bcrypt.hash('owner123', 10);
    const owner2 = userRepository.create({
      username: 'owner_grocery',
      password: owner2Password,
      role: UserRole.SHOP_OWNER,
      fullName: 'Владелец продуктового магазина',
      shopId: groceryShop.id,
      isActive: true,
    });
    await userRepository.save(owner2);
    console.log('✅ Владелец создан:');
    console.log('   Логин: owner_grocery');
    console.log('   Пароль: owner123');
    console.log('   Магазин:', groceryShop.name);

    // Создаем продавца для продуктового магазина
    const seller2Password = await bcrypt.hash('seller123', 10);
    const seller2 = userRepository.create({
      username: 'seller_grocery',
      password: seller2Password,
      role: UserRole.SELLER,
      fullName: 'Продавец продуктового магазина',
      shopId: groceryShop.id,
      isActive: true,
    });
    await userRepository.save(seller2);
    console.log('✅ Продавец создан:');
    console.log('   Логин: seller_grocery');
    console.log('   Пароль: seller123');
    console.log('   Магазин:', groceryShop.name);

    // Создаем обычный магазин
    const generalShop = shopRepository.create({
      name: 'Универсальный магазин',
      type: ShopType.GENERAL,
      description: 'Универсальный магазин',
      address: 'ул. Примерная, д. 3',
      phone: '+7 (999) 123-45-69',
      isActive: true,
    });
    await shopRepository.save(generalShop);
    console.log('✅ Универсальный магазин создан:', generalShop.name);

    // Настройки для универсального магазина
    const generalSettings = shopSettingsRepository.create({
      shopId: generalShop.id,
      enableSizes: true,
      enableWeight: true,
      enableBarcode: true,
      enableCategories: true,
    });
    await shopSettingsRepository.save(generalSettings);

    // Создаем продавца для универсального магазина
    const seller3Password = await bcrypt.hash('seller123', 10);
    const seller3 = userRepository.create({
      username: 'seller_general',
      password: seller3Password,
      role: UserRole.SELLER,
      fullName: 'Продавец универсального магазина',
      shopId: generalShop.id,
      isActive: true,
    });
    await userRepository.save(seller3);
    console.log('✅ Продавец создан:');
    console.log('   Логин: seller_general');
    console.log('   Пароль: seller123');
    console.log('   Магазин:', generalShop.name);

    console.log('\n✅ Тестовые данные успешно созданы!');
    console.log('\n📋 Сводка учетных записей:');
    console.log('\n👤 Администратор:');
    console.log('   Логин: admin');
    console.log('   Пароль: admin123');
    console.log('\n👔 Магазин одежды:');
    console.log('   Владелец: owner_clothing / owner123');
    console.log('   Продавец: seller_clothing / seller123');
    console.log('\n🛒 Продуктовый магазин:');
    console.log('   Владелец: owner_grocery / owner123');
    console.log('   Продавец: seller_grocery / seller123');
    console.log('\n🏪 Универсальный магазин:');
    console.log('   Продавец: seller_general / seller123');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Ошибка при выполнении скрипта:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

resetAndSeed();
