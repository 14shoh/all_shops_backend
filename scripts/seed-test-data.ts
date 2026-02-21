import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../src/users/entities/user.entity';
import { Shop, ShopType } from '../src/shops/entities/shop.entity';
import { ShopSettings } from '../src/shop-settings/entities/shop-settings.entity';
import { config } from 'dotenv';
import { join } from 'path';

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
  logging: true,
});

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('Data Source has been initialized!');

    const userRepository = AppDataSource.getRepository(User);
    const shopRepository = AppDataSource.getRepository(Shop);
    const shopSettingsRepository = AppDataSource.getRepository(ShopSettings);

    // Создаем администратора
    const adminPassword = await bcrypt.hash('admin123', 10);
    let admin = await userRepository.findOne({ where: { username: 'admin' } });
    if (!admin) {
      admin = userRepository.create({
        username: 'admin',
        password: adminPassword,
        role: UserRole.ADMIN,
        fullName: 'Администратор',
        isActive: true,
      });
      admin = await userRepository.save(admin);
      console.log('✅ Администратор создан:');
      console.log('   Логин: admin');
      console.log('   Пароль: admin123');
    } else {
      console.log('ℹ️  Администратор уже существует');
    }

    // Создаем магазин одежды
    let clothingShop = await shopRepository.findOne({
      where: { name: 'Магазин Одежды "Мода"' },
    });
    if (!clothingShop) {
      clothingShop = shopRepository.create({
        name: 'Магазин Одежды "Мода"',
        type: ShopType.CLOTHING,
        description: 'Магазин модной одежды',
        address: 'ул. Примерная, д. 1',
        phone: '+7 (999) 123-45-67',
        isActive: true,
      });
      clothingShop = await shopRepository.save(clothingShop);
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
    }

    // Создаем продуктовый магазин
    let groceryShop = await shopRepository.findOne({
      where: { name: 'Продуктовый магазин "Свежесть"' },
    });
    if (!groceryShop) {
      groceryShop = shopRepository.create({
        name: 'Продуктовый магазин "Свежесть"',
        type: ShopType.GROCERY,
        description: 'Продуктовый магазин',
        address: 'ул. Примерная, д. 2',
        phone: '+7 (999) 123-45-68',
        isActive: true,
      });
      groceryShop = await shopRepository.save(groceryShop);
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
    }

    // Создаем обычный магазин
    let generalShop = await shopRepository.findOne({
      where: { name: 'Универсальный магазин' },
    });
    if (!generalShop) {
      generalShop = shopRepository.create({
        name: 'Универсальный магазин',
        type: ShopType.GENERAL,
        description: 'Универсальный магазин',
        address: 'ул. Примерная, д. 3',
        phone: '+7 (999) 123-45-69',
        isActive: true,
      });
      generalShop = await shopRepository.save(generalShop);
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
    }

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

    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seed();
