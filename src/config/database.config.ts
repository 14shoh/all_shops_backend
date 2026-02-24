import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'all_shops',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    // synchronize отключен, используем миграции для управления схемой БД
    // Это предотвращает конфликты между миграциями и автоматической синхронизацией
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    migrationsRun: false,
    // MySQL connection pool (mysql2)
    // Для 100+ магазинов с 4000-8000 товаров и 100-400 продаж/день на магазин
    // Рекомендуется пул 50-100 соединений для пиковых нагрузок
    extra: {
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '50', 10),
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    },
  }),
);
