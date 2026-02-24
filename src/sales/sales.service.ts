import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Product } from '../products/entities/product.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { FindSalesDto } from './dto/find-sales.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private saleItemRepository: Repository<SaleItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(
    createSaleDto: CreateSaleDto,
    sellerId: number,
    userRole: UserRole,
    userShopId?: number,
  ): Promise<Sale> {
    // Проверка прав доступа
    if (userRole === UserRole.SELLER && userShopId !== createSaleDto.shopId) {
      throw new ForbiddenException('Нет доступа к продажам в этом магазине');
    }

    if (createSaleDto.items.length === 0) {
      throw new BadRequestException('Чек должен содержать хотя бы один товар');
    }

    let totalAmount = 0;
    const saleItems: SaleItem[] = [];

    // Валидация и подготовка товаров
    for (const item of createSaleDto.items) {
      const product = await this.productRepository.findOne({
        where: { id: item.productId },
      });

      if (!product) {
        throw new NotFoundException(
          `Товар с ID ${item.productId} не найден`,
        );
      }

      // Проверка, что товар принадлежит магазину
      if (product.shopId !== createSaleDto.shopId) {
        throw new BadRequestException(
          `Товар с ID ${item.productId} не принадлежит этому магазину`,
        );
      }

      // Проверка наличия товара на складе
      if (product.quantity < item.quantity) {
        throw new BadRequestException(
          `Недостаточно товара "${product.name}" на складе. Доступно: ${product.quantity}, требуется: ${item.quantity}`,
        );
      }

      const itemTotal = item.totalPrice ?? (item.salePrice * item.quantity);
      totalAmount += itemTotal;

      const saleItem = this.saleItemRepository.create({
        productId: item.productId,
        quantity: item.quantity,
        salePrice: item.salePrice,
        totalPrice: itemTotal,
      });

      saleItems.push(saleItem);

      // Уменьшаем количество товара на складе
      product.quantity -= item.quantity;
      await this.productRepository.save(product);
    }

    // Создаем продажу
    const newSale = this.saleRepository.create({
      shopId: createSaleDto.shopId,
      sellerId: sellerId,
      totalAmount: totalAmount,
      items: saleItems,
    });

    const savedSale = await this.saleRepository.save(newSale);

    // Загружаем полную информацию о продаже
    const saleWithRelations = await this.saleRepository.findOne({
      where: { id: savedSale.id },
      relations: ['seller', 'shop', 'items', 'items.product'],
    });

    if (!saleWithRelations) {
      throw new NotFoundException(`Продажа с ID ${savedSale.id} не найдена`);
    }

    return saleWithRelations;
  }

  async findAll(
    findSalesDto: FindSalesDto,
    userRole: UserRole,
    userShopId?: number,
    sellerId?: number,
  ): Promise<{ data: Sale[]; total: number; page: number; limit: number; totalPages: number }> {
    const where: any = {};

    // Продавцы по умолчанию видят только свои продажи.
    // Но если scope=shop — показываем продажи всего магазина (в пределах userShopId).
    if (userRole === UserRole.SELLER) {
      if (findSalesDto.scope === 'shop') {
        if (!userShopId) {
          throw new ForbiddenException('Магазин не назначен');
        }
        where.shopId = userShopId;
      } else {
        if (!sellerId) {
          throw new ForbiddenException('ID продавца не найден');
        }
        where.sellerId = sellerId;
      }
    } else if (findSalesDto.shopId) {
      where.shopId = findSalesDto.shopId;
    } else if (userRole === UserRole.SHOP_OWNER && userShopId) {
      where.shopId = userShopId;
    }

    const page = findSalesDto.page || 1;
    const limit = findSalesDto.limit || 50;
    const skip = (page - 1) * limit;

    let queryBuilder = this.saleRepository.createQueryBuilder('sale')
      .leftJoinAndSelect('sale.seller', 'seller')
      .leftJoinAndSelect('sale.shop', 'shop')
      .leftJoinAndSelect('sale.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .where(where)
      .andWhere('sale.deletedAt IS NULL'); // Явная фильтрация удаленных записей

    // Фильтр по датам
    if (findSalesDto.startDate && findSalesDto.endDate) {
      queryBuilder = queryBuilder.andWhere('sale.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(findSalesDto.startDate),
        endDate: new Date(findSalesDto.endDate),
      });
    } else if (findSalesDto.startDate) {
      queryBuilder = queryBuilder.andWhere('sale.createdAt >= :startDate', {
        startDate: new Date(findSalesDto.startDate),
      });
    }

    // Подсчет общего количества
    const total = await queryBuilder.getCount();

    // Получение данных с пагинацией
    const sales = await queryBuilder
      .orderBy('sale.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    console.log(`✅ Найдено продаж: ${sales.length} из ${total} (страница ${page}, лимит ${limit})`);
    if (sales.length > 0) {
      console.log('📦 Первая продажа:', {
        id: sales[0].id,
        totalAmount: sales[0].totalAmount,
        sellerId: sales[0].sellerId,
        shopId: sales[0].shopId,
        createdAt: sales[0].createdAt,
      });
      if (sales.length > 1) {
        console.log('📦 Последняя продажа:', {
          id: sales[sales.length - 1].id,
          totalAmount: sales[sales.length - 1].totalAmount,
          sellerId: sales[sales.length - 1].sellerId,
          shopId: sales[sales.length - 1].shopId,
        });
      }
    } else {
      console.log('⚠️ Продажи не найдены! Проверьте фильтры:', where);
    }

    return {
      data: sales,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(
    id: number,
    userRole: UserRole,
    userShopId?: number,
    sellerId?: number,
  ): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { id },
      relations: ['seller', 'shop', 'items', 'items.product'],
    });

    if (!sale) {
      throw new NotFoundException(`Продажа с ID ${id} не найдена`);
    }

    // Проверка прав доступа
    if (userRole === UserRole.SELLER && sale.sellerId !== sellerId) {
      throw new ForbiddenException('Нет доступа к этой продаже');
    }

    if (
      userRole === UserRole.SHOP_OWNER &&
      sale.shopId !== userShopId
    ) {
      throw new ForbiddenException('Нет доступа к этой продаже');
    }

    return sale;
  }

  async getDailySales(
    shopId: number,
    date: Date,
    userRole: UserRole,
    userShopId?: number,
    sellerId?: number,
  ) {
    // Проверка прав доступа
    if (userRole === UserRole.SELLER && userShopId !== shopId) {
      throw new ForbiddenException('Нет доступа к продажам этого магазина');
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const where: any = {
      shopId,
      createdAt: Between(startOfDay, endOfDay),
    };

    // Продавцы видят только свои продажи
    if (userRole === UserRole.SELLER && sellerId) {
      where.sellerId = sellerId;
    }

    const sales = await this.saleRepository.find({
      where,
      relations: ['items', 'items.product'],
    });

    const totalAmount = sales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount),
      0,
    );

    const items = sales.flatMap((sale) =>
      sale.items.map((item) => ({
        ...item,
        saleId: sale.id,
        saleDate: sale.createdAt,
      })),
    );

    return {
      date: date.toISOString().split('T')[0],
      totalSales: sales.length,
      totalAmount: Number(totalAmount.toFixed(2)),
      items,
    };
  }

  async getSellerDailyReport(
    sellerId: number,
    date: Date,
    userRole: UserRole,
    userShopId?: number,
  ) {
    // Проверка прав доступа
    if (userRole === UserRole.SELLER && sellerId !== userShopId) {
      throw new ForbiddenException('Нет доступа к отчету другого продавца');
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await this.saleRepository.find({
      where: {
        sellerId,
        createdAt: Between(startOfDay, endOfDay),
      },
      relations: ['shop', 'items', 'items.product'],
    });

    const totalAmount = sales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount),
      0,
    );

    return {
      sellerId,
      date: date.toISOString().split('T')[0],
      totalSales: sales.length,
      totalAmount: Number(totalAmount.toFixed(2)),
      sales,
    };
  }

  async remove(
    id: number,
    userRole: UserRole,
    userShopId?: number,
  ): Promise<{ message: string }> {
    const sale = await this.saleRepository.findOne({
      where: { id },
      relations: ['items', 'items.product'],
    });

    if (!sale) {
      throw new NotFoundException(`Продажа с ID ${id} не найдена`);
    }

    // Проверка прав доступа
    if (userRole === UserRole.SELLER && sale.shopId !== userShopId) {
      throw new ForbiddenException('Нет доступа к этой продаже');
    } else if (userRole === UserRole.SHOP_OWNER && sale.shopId !== userShopId) {
      throw new ForbiddenException('Нет доступа к этой продаже');
    }

    // Возвращаем товары на склад
    for (const item of sale.items) {
      const product = await this.productRepository.findOne({
        where: { id: item.productId },
      });
      if (product) {
        product.quantity += item.quantity;
        await this.productRepository.save(product);
      }
    }

    // Soft delete
    await this.saleRepository.softRemove(sale);

    return { message: 'Продажа успешно удалена' };
  }

  async getDeletedStatistics(
    shopId: number,
    userRole: UserRole,
    userShopId?: number,
  ): Promise<{
    totalDeleted: number;
    totalAmount: number;
    deletedToday: number;
    amountToday: number;
    recentDeleted: any[];
  }> {
    // Проверка прав доступа
    if (userRole === UserRole.SHOP_OWNER && shopId !== userShopId) {
      throw new ForbiddenException('Нет доступа к статистике этого магазина');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Получаем все удалённые продажи
    const deletedSales = await this.saleRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.seller', 'seller')
      .where('sale.shopId = :shopId', { shopId })
      .andWhere('sale.deletedAt IS NOT NULL')
      .withDeleted()
      .orderBy('sale.deletedAt', 'DESC')
      .limit(50)
      .getMany();

    const totalDeleted = deletedSales.length;
    const totalAmount = deletedSales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);

    const deletedToday = deletedSales.filter(
      (sale) => sale.deletedAt && new Date(sale.deletedAt) >= today,
    ).length;

    const amountToday = deletedSales
      .filter((sale) => sale.deletedAt && new Date(sale.deletedAt) >= today)
      .reduce((sum, sale) => sum + Number(sale.totalAmount), 0);

    const recentDeleted = deletedSales.slice(0, 20).map((sale) => ({
      id: sale.id,
      totalAmount: sale.totalAmount,
      createdAt: sale.createdAt,
      deletedAt: sale.deletedAt,
      seller: {
        id: sale.seller?.id,
        username: sale.seller?.username,
      },
      deleter: null,
    }));

    return {
      totalDeleted,
      totalAmount,
      deletedToday,
      amountToday,
      recentDeleted,
    };
  }
}
