import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { Shop } from '../shops/entities/shop.entity';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Shop)
    private shopRepository: Repository<Shop>,
  ) {}

  async getWarehouseStatus(
    shopId: number,
    userRole: UserRole,
    userShopId?: number,
  ) {
    // Проверка прав доступа
    if (userRole === UserRole.SELLER && userShopId !== shopId) {
      throw new ForbiddenException('Нет доступа к складу этого магазина');
    }

    const shop = await this.shopRepository.findOne({
      where: { id: shopId },
    });

    if (!shop) {
      throw new NotFoundException(`Магазин с ID ${shopId} не найден`);
    }

    const products = await this.productRepository.find({
      where: { shopId },
    });

    const totalProducts = products.length;
    const totalQuantity = products.reduce(
      (sum, product) => sum + product.quantity,
      0,
    );
    const totalValue = products.reduce(
      (sum, product) => sum + product.purchasePrice * product.quantity,
      0,
    );

    // Группировка по категориям
    const categories = products.reduce((acc, product) => {
      const category = product.category || 'Без категории';
      if (!acc[category]) {
        acc[category] = {
          category,
          count: 0,
          quantity: 0,
          value: 0,
        };
      }
      acc[category].count += 1;
      acc[category].quantity += product.quantity;
      acc[category].value += product.purchasePrice * product.quantity;
      return acc;
    }, {} as Record<string, { category: string; count: number; quantity: number; value: number }>);

    return {
      shopId,
      shopName: shop.name,
      totalProducts,
      totalQuantity,
      totalValue: Number(totalValue.toFixed(2)),
      categories: Object.values(categories).map((cat) => ({
        ...cat,
        value: Number(cat.value.toFixed(2)),
      })),
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        quantity: p.quantity,
        purchasePrice: p.purchasePrice,
        totalValue: Number((p.purchasePrice * p.quantity).toFixed(2)),
      })),
    };
  }

  async getProductsByCategory(
    shopId: number,
    category: string,
    userRole: UserRole,
    userShopId?: number,
  ) {
    // Проверка прав доступа
    if (userRole === UserRole.SELLER && userShopId !== shopId) {
      throw new ForbiddenException('Нет доступа к товарам этого магазина');
    }

    return this.productRepository.find({
      where: {
        shopId,
        category,
      },
      order: { name: 'ASC' },
    });
  }

  async getLowStockItems(
    shopId: number,
    threshold: number = 10,
    userRole: UserRole,
    userShopId?: number,
  ) {
    // Проверка прав доступа
    if (userRole === UserRole.SELLER && userShopId !== shopId) {
      throw new ForbiddenException('Нет доступа к товарам этого магазина');
    }

    const products = await this.productRepository
      .createQueryBuilder('product')
      .where('product.shopId = :shopId', { shopId })
      .andWhere('product.quantity <= :threshold', { threshold })
      .orderBy('product.quantity', 'ASC')
      .getMany();

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      quantity: p.quantity,
      purchasePrice: p.purchasePrice,
      barcode: p.barcode,
    }));
  }

  async getOutOfStockItems(
    shopId: number,
    userRole: UserRole,
    userShopId?: number,
  ) {
    return this.getLowStockItems(shopId, 0, userRole, userShopId);
  }
}
