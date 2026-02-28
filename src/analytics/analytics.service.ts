import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Product } from '../products/entities/product.entity';
import { Shop } from '../shops/entities/shop.entity';
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
    @InjectRepository(Shop)
    private shopRepository: Repository<Shop>,
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
    const salesAgg = await this.saleRepository
      .createQueryBuilder('sale')
      .select('COALESCE(SUM(sale.totalAmount), 0)', 'revenue')
      .addSelect('COUNT(*)', 'salesCount')
      .where('sale.shopId = :shopId', { shopId })
      .andWhere('sale.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne<{ revenue: string; salesCount: string }>();

    const revenue = Number(parseFloat(salesAgg?.revenue ?? '0').toFixed(2));
    const salesCount = parseInt(salesAgg?.salesCount ?? '0', 10);

    // Себестоимость: quantity в кг/л/шт, price за единицу
    const cogsAgg = await this.saleItemRepository
      .createQueryBuilder('saleItem')
      .innerJoin('saleItem.sale', 'sale')
      .innerJoin('saleItem.product', 'product')
      .select(
        'COALESCE(SUM(saleItem.quantity * product.purchasePrice), 0)',
        'costOfGoods',
      )
      .where('sale.shopId = :shopId', { shopId })
      .andWhere('sale.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne<{ costOfGoods: string }>();

    const costOfGoods = Number(
      parseFloat(cogsAgg?.costOfGoods ?? '0').toFixed(2),
    );

    // Получаем расходы
    const expensesAgg = await this.expenseRepository
      .createQueryBuilder('expense')
      .select('COALESCE(SUM(expense.amount), 0)', 'expenses')
      .addSelect('COUNT(*)', 'expensesCount')
      .where('expense.shopId = :shopId', { shopId })
      .andWhere('expense.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne<{ expenses: string; expensesCount: string }>();

    const totalExpenses = Number(
      parseFloat(expensesAgg?.expenses ?? '0').toFixed(2),
    );
    const expensesCount = parseInt(expensesAgg?.expensesCount ?? '0', 10);

    // Чистая прибыль = выручка - себестоимость - расходы
    const netProfit = revenue - costOfGoods - totalExpenses;

    return {
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      revenue,
      costOfGoods,
      expenses: totalExpenses,
      netProfit: Number(netProfit.toFixed(2)),
      salesCount,
      expensesCount,
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

    // Оптимизация: одним запросом на БД, без загрузки всех товаров в память
    // Берем товары магазина, для которых не найдено ни одной продажи за последние N дней.
    const rows = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin(
        SaleItem,
        'saleItem',
        'saleItem.productId = product.id AND saleItem.deletedAt IS NULL',
      )
      .leftJoin(
        Sale,
        'sale',
        `sale.id = saleItem.saleId
         AND sale.shopId = :shopId
         AND sale.createdAt >= :cutoffDate
         AND sale.deletedAt IS NULL`,
        { shopId, cutoffDate },
      )
      .where('product.shopId = :shopId', { shopId })
      .andWhere('product.deletedAt IS NULL')
      .select([
        'product.id AS id',
        'product.name AS name',
        'product.barcode AS barcode',
        'product.category AS category',
        'product.quantity AS quantity',
        'product.purchasePrice AS purchasePrice',
        'product.weight AS weight',
      ])
      .groupBy('product.id')
      .having('COUNT(sale.id) = 0')
      .getRawMany<{
        id: number;
        name: string;
        barcode: string | null;
        category: string | null;
        quantity: number;
        purchasePrice: string;
        weight: string | null;
      }>();

    return rows.map((p) => {
      const purchasePrice = Number(parseFloat(p.purchasePrice ?? '0').toFixed(2));
      const quantity = Number(p.quantity ?? 0);
      const w = p.weight != null ? Number(p.weight) : null;
      const isWeighed = w != null && (Math.abs(w - 1) < 0.1 || Math.abs(w - 2) < 0.1);
      const displayQty = isWeighed ? quantity / 1000 : quantity;
      return {
        id: p.id,
        name: p.name,
        barcode: p.barcode,
        category: p.category,
        quantity,
        weight: p.weight,
        purchasePrice,
        totalValue: Number((purchasePrice * displayQty).toFixed(2)),
      };
    });
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

    const start = startDate ?? new Date(0);
    const end = endDate ?? new Date();

    // Оптимизация: агрегаты считаем в MySQL (не тащим продажи и sale_items в Node.js)
    const totals = await this.saleRepository
      .createQueryBuilder('sale')
      .leftJoin(SaleItem, 'saleItem', 'saleItem.saleId = sale.id AND saleItem.deletedAt IS NULL')
      .select('COUNT(DISTINCT sale.id)', 'totalSales')
      .addSelect('COALESCE(SUM(sale.totalAmount), 0)', 'totalRevenue')
      .addSelect('COALESCE(SUM(saleItem.quantity), 0)', 'totalItems')
      .where('sale.shopId = :shopId', { shopId })
      .andWhere('sale.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('sale.deletedAt IS NULL')
      .getRawOne<{ totalSales: string; totalRevenue: string; totalItems: string }>();

    const totalSales = parseInt(totals?.totalSales ?? '0', 10);
    const totalRevenue = Number(parseFloat(totals?.totalRevenue ?? '0').toFixed(2));
    const totalItems = parseInt(totals?.totalItems ?? '0', 10);

    return {
      totalSales,
      totalRevenue,
      totalItems,
      averageSaleAmount: totalSales > 0
        ? Number((totalRevenue / totalSales).toFixed(2))
        : 0,
    };
  }

  // ─── Admin-only: global analytics for admin panel ────────────────────────

  private getDateRange(period: 'week' | 'month' | 'year') {
    const end = new Date();
    const start = new Date();
    switch (period) {
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setDate(start.getDate() - 7);
    }
    return { start, end };
  }

  async getAdminSalesByPeriod(period: 'week' | 'month' | 'year') {
    const { start, end } = this.getDateRange(period);
    const rows = await this.saleRepository
      .createQueryBuilder('sale')
      .select('DATE(sale.createdAt)', 'date')
      .addSelect('COUNT(sale.id)', 'sales')
      .addSelect('COALESCE(SUM(sale.totalAmount), 0)', 'revenue')
      .where('sale.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('sale.deletedAt IS NULL')
      .groupBy('DATE(sale.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; sales: string; revenue: string }>();

    return rows.map((r) => ({
      date: r.date,
      sales: parseInt(r.sales, 10),
      revenue: Number(parseFloat(r.revenue).toFixed(2)),
    }));
  }

  async getAdminShopsPerformance(period: 'week' | 'month' | 'year') {
    const { start, end } = this.getDateRange(period);
    const shops = await this.shopRepository.find({
      where: { deletedAt: undefined as any },
      select: ['id', 'name'],
    });
    const result: { shopName: string; totalSales: number; revenue: number }[] = [];
    for (const shop of shops) {
      const agg = await this.saleRepository
        .createQueryBuilder('sale')
        .select('COUNT(sale.id)', 'totalSales')
        .addSelect('COALESCE(SUM(sale.totalAmount), 0)', 'revenue')
        .where('sale.shopId = :shopId', { shopId: shop.id })
        .andWhere('sale.createdAt BETWEEN :start AND :end', { start, end })
        .andWhere('sale.deletedAt IS NULL')
        .getRawOne<{ totalSales: string; revenue: string }>();
      result.push({
        shopName: shop.name,
        totalSales: parseInt(agg?.totalSales ?? '0', 10),
        revenue: Number(parseFloat(agg?.revenue ?? '0').toFixed(2)),
      });
    }
    return result.sort((a, b) => b.revenue - a.revenue);
  }

  async getAdminTopProducts(period: 'week' | 'month' | 'year', limit: number = 5) {
    const { start, end } = this.getDateRange(period);
    const rows = await this.saleItemRepository
      .createQueryBuilder('saleItem')
      .innerJoin('saleItem.sale', 'sale')
      .innerJoin('saleItem.product', 'product')
      .where('sale.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('sale.deletedAt IS NULL')
      .select('product.name', 'name')
      .addSelect('SUM(saleItem.quantity)', 'quantity')
      .addSelect('SUM(saleItem.totalPrice)', 'revenue')
      .groupBy('product.id')
      .orderBy('quantity', 'DESC')
      .limit(limit)
      .getRawMany<{ name: string; quantity: string; revenue: string }>();

    return rows.map((r) => ({
      name: r.name,
      quantity: parseInt(r.quantity, 10),
      revenue: Number(parseFloat(r.revenue).toFixed(2)),
    }));
  }
}
