import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { ShopsModule } from './shops/shops.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { ExpensesModule } from './expenses/expenses.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { InventoryModule } from './inventory/inventory.module';
import { ShopSettingsModule } from './shop-settings/shop-settings.module';
import { CustomerDebtsModule } from './customer-debts/customer-debts.module';
import { SupplierDebtsModule } from './supplier-debts/supplier-debts.module';
import { LogsModule } from './logs/logs.module';
import { CategoriesModule } from './categories/categories.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { User } from './users/entities/user.entity';
import { Shop } from './shops/entities/shop.entity';
import { Product } from './products/entities/product.entity';
import { Sale } from './sales/entities/sale.entity';
import { SaleItem } from './sales/entities/sale-item.entity';
import { Expense } from './expenses/entities/expense.entity';
import { Inventory } from './inventory/entities/inventory.entity';
import { InventoryItem } from './inventory/entities/inventory-item.entity';
import { ShopSettings } from './shop-settings/entities/shop-settings.entity';
import { CustomerDebt } from './customer-debts/entities/customer-debt.entity';
import { SupplierDebt } from './supplier-debts/entities/supplier-debt.entity';
import { Log } from './logs/entities/log.entity';
import { Category } from './categories/entities/category.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    // In-memory cache for expensive GET analytics endpoints.
    // Для 100+ магазинов с большим объемом данных увеличиваем размер кеша.
    // В production рекомендуется заменить на Redis-store (чтобы кэш был shared между инстансами).
    CacheModule.register({
      isGlobal: true,
      ttl: 60_000, // 60 секунд (увеличено для стабильности при больших объемах)
      max: 5000, // Увеличено с 1000 до 5000 для поддержки большего количества магазинов
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        configService.get('database')!,
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      User,
      Shop,
      Product,
      Sale,
      SaleItem,
      Expense,
      Inventory,
      InventoryItem,
      ShopSettings,
      CustomerDebt,
      SupplierDebt,
      Log,
      Category,
    ]),
    AuthModule,
    ShopsModule,
    UsersModule,
    ProductsModule,
    SalesModule,
    WarehouseModule,
    ExpensesModule,
    AnalyticsModule,
    InventoryModule,
    ShopSettingsModule,
    CustomerDebtsModule,
    SupplierDebtsModule,
    LogsModule,
    CategoriesModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
