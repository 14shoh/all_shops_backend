import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplierDebtsService } from './supplier-debts.service';
import { SupplierDebtsController } from './supplier-debts.controller';
import { SupplierDebt } from './entities/supplier-debt.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SupplierDebt])],
  controllers: [SupplierDebtsController],
  providers: [SupplierDebtsService],
  exports: [SupplierDebtsService],
})
export class SupplierDebtsModule {}
