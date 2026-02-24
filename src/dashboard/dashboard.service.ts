import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log } from '../logs/entities/log.entity';
import { Sale } from '../sales/entities/sale.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Log)
    private logRepository: Repository<Log>,
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
  ) {}

  async getRecentActivity(limit: number = 10) {
    const logs = await this.logRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.createdAt', 'DESC')
      .take(limit)
      .getMany();

    return logs.map((log) => ({
      id: log.id,
      type: log.action.split('_')[0] ?? 'action',
      message: log.details,
      timestamp: log.createdAt,
    }));
  }

  async getSalesChart(period: 'week' | 'month' | 'year') {
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

    const rows = await this.saleRepository
      .createQueryBuilder('sale')
      .select('DATE(sale.createdAt)', 'date')
      .addSelect('COUNT(sale.id)', 'value')
      .where('sale.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('sale.deletedAt IS NULL')
      .groupBy('DATE(sale.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; value: string }>();

    return rows.map((r) => ({
      date: r.date,
      value: parseInt(r.value, 10),
    }));
  }
}
