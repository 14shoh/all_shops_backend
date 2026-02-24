import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { SupplierDebt } from './entities/supplier-debt.entity';
import { CreateSupplierDebtDto } from './dto/create-supplier-debt.dto';
import { UpdateSupplierDebtDto } from './dto/update-supplier-debt.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class SupplierDebtsService {
  constructor(
    @InjectRepository(SupplierDebt)
    private supplierDebtRepository: Repository<SupplierDebt>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(
    createSupplierDebtDto: CreateSupplierDebtDto,
    userId: number,
    userRole: UserRole,
    userShopId?: number,
  ): Promise<SupplierDebt> {
    try {
      // Проверка прав доступа
      if (userRole === UserRole.SELLER && userShopId !== createSupplierDebtDto.shopId) {
        throw new ForbiddenException('Нет доступа к добавлению долгов для этого магазина');
      }

      console.log('📝 Создание долга фирме:', {
        supplierName: createSupplierDebtDto.supplierName,
        totalDebt: createSupplierDebtDto.totalDebt,
        shopId: createSupplierDebtDto.shopId,
        userId,
      });

      const paidAmount = createSupplierDebtDto.paidAmount || 0;
      const remainingAmount = Number(createSupplierDebtDto.totalDebt) - paidAmount;

      const supplierDebt = this.supplierDebtRepository.create({
        ...createSupplierDebtDto,
        paidAmount,
        remainingAmount,
        userId,
      });

      const saved = await this.supplierDebtRepository.save(supplierDebt);
      console.log('✅ Долг фирме сохранен:', {
        id: saved.id,
        supplierName: saved.supplierName,
        totalDebt: saved.totalDebt,
        paidAmount: saved.paidAmount,
        remainingAmount: saved.remainingAmount,
        shopId: saved.shopId,
        userId: saved.userId,
      });
      
      // Инвалидируем кеш
      await this.cacheManager.del(`supplier_debts_shop_${createSupplierDebtDto.shopId}`);
      await this.cacheManager.del(`supplier_debts_summary_shop_${createSupplierDebtDto.shopId}`);

      return saved;
    } catch (error) {
      console.error('❌ Ошибка создания долга фирме:', error);
      throw error;
    }
  }

  async findAll(
    shopId: number,
    userRole?: UserRole,
    userShopId?: number,
  ): Promise<SupplierDebt[]> {
    // Проверка прав доступа
    if (userRole === UserRole.SELLER && userShopId !== shopId) {
      throw new ForbiddenException('Нет доступа к долгам этого магазина');
    }

    const cacheKey = `supplier_debts_shop_${shopId}`;
    const cached = await this.cacheManager.get<SupplierDebt[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const debts = await this.supplierDebtRepository.find({
      where: { shopId },
      relations: ['user', 'shop'],
      order: { createdAt: 'DESC' },
    });

    // Кешируем на 60 секунд
    await this.cacheManager.set(cacheKey, debts, 60000);

    return debts;
  }

  async findOne(
    id: number,
    userRole: UserRole,
    userShopId?: number,
  ): Promise<SupplierDebt> {
    const supplierDebt = await this.supplierDebtRepository.findOne({
      where: { id },
      relations: ['user', 'shop'],
    });

    if (!supplierDebt) {
      throw new NotFoundException(`Долг фирме с ID ${id} не найден`);
    }

    // Проверка прав доступа
    if (userRole === UserRole.SELLER && supplierDebt.shopId !== userShopId) {
      throw new ForbiddenException('Нет доступа к этому долгу');
    }

    return supplierDebt;
  }

  async update(
    id: number,
    updateSupplierDebtDto: UpdateSupplierDebtDto,
    userRole: UserRole,
    userShopId?: number,
  ): Promise<SupplierDebt> {
    const supplierDebt = await this.findOne(id, userRole, userShopId);

    // Проверка прав доступа
    if (userRole === UserRole.SELLER && supplierDebt.shopId !== userShopId) {
      throw new ForbiddenException('Нет доступа к редактированию этого долга');
    }

    Object.assign(supplierDebt, updateSupplierDebtDto);
    
    // Пересчитываем remainingAmount если изменился totalDebt или paidAmount
    if (updateSupplierDebtDto.totalDebt !== undefined || updateSupplierDebtDto.paidAmount !== undefined) {
      const totalDebt = Number(updateSupplierDebtDto.totalDebt ?? supplierDebt.totalDebt);
      const paidAmount = Number(updateSupplierDebtDto.paidAmount ?? supplierDebt.paidAmount);
      supplierDebt.remainingAmount = totalDebt - paidAmount;
    }

    const updated = await this.supplierDebtRepository.save(supplierDebt);

    // Инвалидируем кеш
    await this.cacheManager.del(`supplier_debts_shop_${supplierDebt.shopId}`);
    await this.cacheManager.del(`supplier_debts_summary_shop_${supplierDebt.shopId}`);

    return updated;
  }

  async addPayment(
    id: number,
    addPaymentDto: AddPaymentDto,
    userRole: UserRole,
    userShopId?: number,
  ): Promise<SupplierDebt> {
    const supplierDebt = await this.findOne(id, userRole, userShopId);

    // Проверка прав доступа
    if (userRole === UserRole.SELLER && supplierDebt.shopId !== userShopId) {
      throw new ForbiddenException('Нет доступа к добавлению платежа для этого долга');
    }

    const newPaidAmount = Number(supplierDebt.paidAmount) + Number(addPaymentDto.amount);
    const totalDebt = Number(supplierDebt.totalDebt);

    if (newPaidAmount > totalDebt) {
      throw new BadRequestException('Сумма платежа не может превышать общий долг');
    }

    supplierDebt.paidAmount = newPaidAmount;
    supplierDebt.remainingAmount = totalDebt - newPaidAmount;

    const updated = await this.supplierDebtRepository.save(supplierDebt);

    // Инвалидируем кеш
    await this.cacheManager.del(`supplier_debts_shop_${supplierDebt.shopId}`);
    await this.cacheManager.del(`supplier_debts_summary_shop_${supplierDebt.shopId}`);

    return updated;
  }

  async remove(
    id: number,
    userRole: UserRole,
    userShopId?: number,
  ): Promise<void> {
    const supplierDebt = await this.findOne(id, userRole, userShopId);

    // Проверка прав доступа
    if (userRole === UserRole.SELLER && supplierDebt.shopId !== userShopId) {
      throw new ForbiddenException('Нет доступа к удалению этого долга');
    }

    await this.supplierDebtRepository.softDelete(id);

    // Инвалидируем кеш
    await this.cacheManager.del(`supplier_debts_shop_${supplierDebt.shopId}`);
    await this.cacheManager.del(`supplier_debts_summary_shop_${supplierDebt.shopId}`);
  }

  async getSummary(
    shopId: number,
    userRole?: UserRole,
    userShopId?: number,
  ): Promise<{
    totalDebt: number;
    totalPaid: number;
    totalRemaining: number;
  }> {
    // Проверка прав доступа
    if (userRole === UserRole.SELLER && userShopId !== shopId) {
      throw new ForbiddenException('Нет доступа к долгам этого магазина');
    }

    const cacheKey = `supplier_debts_summary_shop_${shopId}`;
    const cached = await this.cacheManager.get<{
      totalDebt: number;
      totalPaid: number;
      totalRemaining: number;
    }>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const debts = await this.supplierDebtRepository.find({
      where: { shopId },
    });

    const summary = debts.reduce(
      (acc, debt) => {
        acc.totalDebt += Number(debt.totalDebt);
        acc.totalPaid += Number(debt.paidAmount);
        acc.totalRemaining += Number(debt.remainingAmount);
        return acc;
      },
      { totalDebt: 0, totalPaid: 0, totalRemaining: 0 },
    );

    // Кешируем на 60 секунд
    await this.cacheManager.set(cacheKey, summary, 60000);

    return summary;
  }
}
