import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerDebtsService } from './customer-debts.service';
import { CustomerDebtsController } from './customer-debts.controller';
import { CustomerDebt } from './entities/customer-debt.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerDebt])],
  controllers: [CustomerDebtsController],
  providers: [CustomerDebtsService],
  exports: [CustomerDebtsService],
})
export class CustomerDebtsModule {}
