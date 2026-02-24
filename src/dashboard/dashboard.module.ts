import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Log } from '../logs/entities/log.entity';
import { Sale } from '../sales/entities/sale.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Log, Sale])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
