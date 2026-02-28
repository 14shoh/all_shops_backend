import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log } from './entities/log.entity';

export type LogType =
  | 'all'
  | 'auth'
  | 'shop'
  | 'user'
  | 'product'
  | 'settings';

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(Log)
    private readonly logRepository: Repository<Log>,
  ) {}

  async log(
    userId: number | null,
    action: string,
    details: string,
    ipAddress?: string,
  ): Promise<Log> {
    const entity = this.logRepository.create({
      userId: userId ?? null,
      action,
      details,
      ipAddress: ipAddress ?? null,
    });

    return this.logRepository.save(entity);
  }

  async findAll(
    type: LogType = 'all',
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    logs: Array<{
      id: number;
      userId: number | null;
      username: string;
      action: string;
      details: string;
      ipAddress?: string;
      timestamp: Date;
    }>;
    totalPages: number;
  }> {
    const qb = this.logRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.createdAt', 'DESC');

    if (type !== 'all') {
      const patterns: Record<Exclude<LogType, 'all'>, string> = {
        auth: 'login',
        shop: '%shop%',
        user: '%user%',
        product: '%product%',
        settings: '%settings%',
      };
      const pattern = patterns[type as Exclude<LogType, 'all'>];
      if (pattern) {
        if (pattern.includes('%')) {
          qb.andWhere('log.action LIKE :pattern', { pattern });
        } else {
          qb.andWhere('log.action = :pattern', { pattern });
        }
      }
    }

    const total = await qb.getCount();
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const skip = (page - 1) * limit;

    const logs = await qb.skip(skip).take(limit).getMany();

    return {
      logs: logs.map((log) => ({
        id: log.id,
        userId: log.userId ?? null,
        username: log.user?.username ?? 'unknown',
        action: log.action,
        details: log.details,
        ipAddress: log.ipAddress ?? undefined,
        timestamp: log.createdAt,
      })),
      totalPages,
    };
  }

  async export(type: LogType = 'all'): Promise<string> {
    const qb = this.logRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.createdAt', 'DESC');

    if (type !== 'all') {
      const patterns: Record<Exclude<LogType, 'all'>, string> = {
        auth: 'login',
        shop: '%shop%',
        user: '%user%',
        product: '%product%',
        settings: '%settings%',
      };
      const pattern = patterns[type as Exclude<LogType, 'all'>];
      if (pattern) {
        if (pattern.includes('%')) {
          qb.andWhere('log.action LIKE :pattern', { pattern });
        } else {
          qb.andWhere('log.action = :pattern', { pattern });
        }
      }
    }

    const logs = await qb.take(5000).getMany();
    const header = 'id,userId,username,action,details,ipAddress,timestamp\n';
    const escapeCsv = (s: string) => `"${s.replace(/"/g, '""')}"`;

    const rows = logs.map((log) => {
      const username = log.user?.username ?? 'unknown';
      return [
        log.id,
        log.userId ?? '',
        escapeCsv(username),
        escapeCsv(log.action),
        escapeCsv(log.details),
        escapeCsv(log.ipAddress ?? ''),
        escapeCsv(log.createdAt.toISOString()),
      ].join(',');
    });

    return header + rows.join('\n');
  }
}
