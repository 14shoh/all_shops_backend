import { Module } from '@nestjs/common';
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
import { User } from './users/entities/user.entity';
import { Shop } from './shops/entities/shop.entity';
import { Product } from './products/entities/product.entity';
import { Sale } from './sales/entities/sale.entity';
import { SaleItem } from './sales/entities/sale-item.entity';
import { Expense } from './expenses/entities/expense.entity';
import { Inventory } from './inventory/entities/inventory.entity';
import { InventoryItem } from './inventory/entities/inventory-item.entity';
import { ShopSettings } from './shop-settings/entities/shop-settings.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
