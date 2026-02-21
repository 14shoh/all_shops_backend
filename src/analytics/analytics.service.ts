import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Product } from '../products/entities/product.entity';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private saleItemRepository: Repository<SaleItem>,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async getFinancialAnalytics(
    shopId: number,
    period: 'day' | 'month' | 'year',
    userRole: UserRole,
    userShopId?: number,
  ) {
    // Проверка прав доступа
    if (userRole === UserRole.SELLER && userShopId !== shopId) {
      throw new ForbiddenException('Нет доступа к аналитике этого магазина');
    }

    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (period) {
      case 'day':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
    }

    // Получаем доходы (продажи)
    const sales = await this.saleRepository.find({
      where: {
        shopId,
        createdAt: Between(startDate, endDate),
      },
    });

    const revenue = sales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount),
      0,
    );

    // Получаем расходы
    const expenses = await this.expenseRepository.find({
      where: {
        shopId,
        createdAt: Between(startDate, endDate),
      },
    });

    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0,
    );

    // Чистая прибыль
    const netProfit = revenue - totalExpenses;

    return {
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      revenue: Number(revenue.toFixed(2)),
      expenses: Number(totalExpenses.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      salesCount: sales.length,
      expensesCount: expenses.length,
    };
  }

  async getTopSellingProducts(
    shopId: number,
    limit: number = 10,
    userRole: UserRole,
    userShopId?: number,
  ) {
    // Проверка прав доступа
    if (userRole === UserRole.SELLER && userShopId !== shopId) {
      throw new ForbiddenException('Нет доступа к аналитике этого магазина');
    }

    const saleItems = await this.saleItemRepository
      .createQueryBuilder('saleItem')
      .innerJoin('saleItem.sale', 'sale')
      .innerJoin('saleItem.product', 'product')
      .where('sale.shopId = :shopId', { shopId })
      .select('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('product.barcode', 'barcode')
      .addSelect('SUM(saleItem.quantity)', 'totalQuantity')
      .addSelect('SUM(saleItem.totalPrice)', 'totalRevenue')
      .addSelect('COUNT(saleItem.id)', 'salesCount')
      .groupBy('product.id')
      .orderBy('totalQuantity', 'DESC')
      .limit(limit)
      .getRawMany();

    return saleItems.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      barcode: item.barcode,
      totalQuantity: parseInt(item.totalQuantity, 10),
      totalRevenue: Number(parseFloat(item.totalRevenue).toFixed(2)),
      salesCount: parseInt(item.salesCount, 10),
    }));
  }

  async getUnsoldProducts(
    shopId: number,
    days: number = 30,
    userRole: UserRole,
    userShopId?: number,
  ) {
    // Проверка прав доступа
    if (userRole === UserRole.SELLER && userShopId !== shopId) {
      throw new ForbiddenException('Нет доступа к аналитике этого магазина');
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Получаем все товары магазина
    const allProducts = await this.productRepository.find({
      where: { shopId },
    });

    // Получаем товары, которые были проданы за последние N дней
    const soldProducts = await this.saleItemRepository
      .createQueryBuilder('saleItem')
      .innerJoin('saleItem.sale', 'sale')
      .where('sale.shopId = :shopId', { shopId })
      .andWhere('sale.createdAt >= :cutoffDate', { cutoffDate })
      .select('DISTINCT saleItem.productId', 'productId')
      .getRawMany();

    const soldProductIds = soldProducts.map((p) => p.productId);

    // Находим товары, которые не продавались
    const unsoldProducts = allProducts.filter(
      (product) => !soldProductIds.includes(product.id),
    );

    return unsoldProducts.map((product) => ({
      id: product.id,
      name: product.name,
      barcode: product.barcode,
      category: product.category,
      quantity: product.quantity,
      purchasePrice: product.purchasePrice,
      totalValue: Number((product.purchasePrice * product.quantity).toFixed(2)),
    }));
  }

  async getSalesAnalytics(
    shopId: number,
    startDate?: Date,
    endDate?: Date,
    userRole?: UserRole,
    userShopId?: number,
  ) {
    // Проверка прав доступа
    if (userRole === UserRole.SELLER && userShopId !== shopId) {
      throw new ForbiddenException('Нет доступа к аналитике этого магазина');
    }

    const where: any = { shopId };

    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    } else if (startDate) {
      where.createdAt = Between(startDate, new Date());
    }

    const sales = await this.saleRepository.find({
      where,
      relations: ['items', 'items.product'],
    });

    const totalRevenue = sales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount),
      0,
    );

    const totalItems = sales.reduce(
      (sum, sale) => sum + sale.items.reduce((s, item) => s + item.quantity, 0),
      0,
    );

    return {
      totalSales: sales.length,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalItems,
      averageSaleAmount: sales.length > 0
        ? Number((totalRevenue / sales.length).toFixed(2))
        : 0,
    };
  }
}
