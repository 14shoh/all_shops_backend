import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { Shop } from '../shops/entities/shop.entity';
import { ShopSettings } from '../shop-settings/entities/shop-settings.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Shop, ShopSettings])],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
