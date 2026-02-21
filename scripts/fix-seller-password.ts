import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../src/users/entities/user.entity';
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
  logging: false,
});

async function fixPassword() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Подключение к базе данных установлено');

    const userRepository = AppDataSource.getRepository(User);

    // Находим пользователя seller_clothing
    const user = await userRepository.findOne({
      where: { username: 'seller_clothing' },
    });

    if (!user) {
      console.log('❌ Пользователь seller_clothing не найден');
      return;
    }

    console.log('📋 Текущий пользователь:');
    console.log('   ID:', user.id);
    console.log('   Username:', user.username);
    console.log('   IsActive:', user.isActive);
    console.log('   ShopId:', user.shopId);

    // Проверяем текущий пароль
    const testPassword = 'seller123';
    const isCurrentPasswordValid = await bcrypt.compare(testPassword, user.password);
    console.log('   Текущий пароль совпадает с seller123:', isCurrentPasswordValid);

    // Обновляем пароль
    const newPasswordHash = await bcrypt.hash('seller123', 10);
    user.password = newPasswordHash;
    user.isActive = true;
    await userRepository.save(user);

    console.log('✅ Пароль обновлен на seller123');
    console.log('✅ Пользователь активирован');

    // Проверяем новый пароль
    const isNewPasswordValid = await bcrypt.compare('seller123', user.password);
    console.log('   Новый пароль проверен:', isNewPasswordValid);

    console.log('\n✅ Готово! Теперь можно войти с:');
    console.log('   Логин: seller_clothing');
    console.log('   Пароль: seller123');
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

fixPassword();
