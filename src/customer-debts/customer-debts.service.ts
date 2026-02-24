import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { CustomerDebt } from './entities/customer-debt.entity';
import { CreateCustomerDebtDto } from './dto/create-customer-debt.dto';
import { UpdateCustomerDebtDto } from './dto/update-customer-debt.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class CustomerDebtsService {
  constructor(
    @InjectRepository(CustomerDebt)
    private customerDebtRepository: Repository<CustomerDebt>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(
    createCustomerDebtDto: CreateCustomerDebtDto,
    userId: number,
    userRole: UserRole,
    userShopId?: number,
  ): Promise<CustomerDebt> {
    try {
      // Проверка прав доступа
      if (userRole === UserRole.SELLER && userShopId !== createCustomerDebtDto.shopId) {
        throw new ForbiddenException('Нет доступа к добавлению долгов для этого магазина');
      }

      // Не разрешаем создавать 2 клиента с одним именем (в рамках магазина)
      // (требование проекта; сравнение делаем case-insensitive)
      const existing = await this.customerDebtRepository
        .createQueryBuilder('d')
        .where('d.shopId = :shopId', { shopId: createCustomerDebtDto.shopId })
        .andWhere('LOWER(d.customerName) = LOWER(:name)', {
          name: createCustomerDebtDto.customerName.trim(),
        })
        .andWhere('d.deletedAt IS NULL')
        .getOne();

      if (existing) {
        throw new ConflictException('Клиент с таким именем уже существует');
      }

      console.log('📝 Создание долга клиента:', {
        customerName: createCustomerDebtDto.customerName,
        amount: createCustomerDebtDto.amount,
        shopId: createCustomerDebtDto.shopId,
        userId,
      });

    const amount = Number(createCustomerDebtDto.amount);
    const paidAmount = 0;
    const remainingAmount = amount;

    const customerDebt = this.customerDebtRepository.create({
      ...createCustomerDebtDto,
      debtDate: new Date(createCustomerDebtDto.debtDate),
      paidAmount,
      remainingAmount,
      userId,
    });

      const saved = await this.customerDebtRepository.save(customerDebt);
      console.log('✅ Долг клиента сохранен:', {
        id: saved.id,
        customerName: saved.customerName,
        amount: saved.amount,
        shopId: saved.shopId,
        userId: saved.userId,
      });
      
      // Инвалидируем кеш
      await this.cacheManager.del(`customer_debts_shop_${createCustomerDebtDto.shopId}`);
      await this.cacheManager.del(`customer_debts_total_shop_${createCustomerDebtDto.shopId}`);

      return saved;
    } catch (error) {
      console.error('❌ Ошибка создания долга клиента:', error);
      throw error;
    }
  }

  async findAll(
    shopId: number,
    userRole?: UserRole,
    userShopId?: number,
  ): Promise<CustomerDebt[]> {
    // Проверка прав доступа
    if (userRole === UserRole.SELLER && userShopId !== shopId) {
      throw new ForbiddenException('Нет доступа к долгам этого магазина');
    }

    const cacheKey = `customer_debts_shop_${shopId}`;
    const cached = await this.cacheManager.get<CustomerDebt[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const debts = await this.customerDebtRepository.find({
      where: { shopId },
      relations: ['user', 'shop'],
      order: { debtDate: 'DESC', createdAt: 'DESC' },
    });

    // Убеждаемся, что у всех долгов есть paidAmount и remainingAmount
    for (const debt of debts) {
      if (debt.paidAmount === undefined || debt.paidAmount === null) {
        debt.paidAmount = 0;
      }
      if (debt.remainingAmount === undefined || debt.remainingAmount === null) {
        const totalAmount = Number(debt.amount);
        const paid = Number(debt.paidAmount || 0);
        debt.remainingAmount = totalAmount - paid;
        // Сохраняем обновленные значения
        await this.customerDebtRepository.save(debt);
      }
    }

    // Кешируем на 60 секунд
    await this.cacheManager.set(cacheKey, debts, 60000);

    return debts;
  }

  async findOne(
    id: number,
    userRole: UserRole,
    userShopId?: number,
  ): Promise<CustomerDebt> {
    const customerDebt = await this.customerDebtRepository.findOne({
      where: { id },
      relations: ['user', 'shop'],
    });

    if (!customerDebt) {
      throw new NotFoundException(`Долг клиента с ID ${id} не найден`);
    }

    // Проверка прав доступа
    if (userRole === UserRole.SELLER && customerDebt.shopId !== userShopId) {
      throw new ForbiddenException('Нет доступа к этому долгу');
    }

    return customerDebt;
  }

  async update(
    id: number,
    updateCustomerDebtDto: UpdateCustomerDebtDto,
    userRole: UserRole,
    userShopId?: number,
  ): Promise<CustomerDebt> {
    const customerDebt = await this.findOne(id, userRole, userShopId);

    // Проверка прав доступа
    if (userRole === UserRole.SELLER && customerDebt.shopId !== userShopId) {
      throw new ForbiddenException('Нет доступа к редактированию этого долга');
    }

    if (updateCustomerDebtDto.debtDate) {
      (customerDebt as any).debtDate = new Date(updateCustomerDebtDto.debtDate as string);
    }

    Object.assign(customerDebt, updateCustomerDebtDto);
    const updated = await this.customerDebtRepository.save(customerDebt);

    // Инвалидируем кеш
    await this.cacheManager.del(`customer_debts_shop_${customerDebt.shopId}`);
    await this.cacheManager.del(`customer_debts_total_shop_${customerDebt.shopId}`);

    return updated;
  }

  async addPayment(
    id: number,
    amount: number,
    userRole: UserRole,
    userShopId?: number,
  ): Promise<CustomerDebt> {
    const customerDebt = await this.findOne(id, userRole, userShopId);

    // Проверка прав доступа
    if (userRole === UserRole.SELLER && customerDebt.shopId !== userShopId) {
      throw new ForbiddenException('Нет доступа к добавлению платежа для этого долга');
    }

    const totalAmount = Number(customerDebt.amount);
    const currentPaidAmount = Number(customerDebt.paidAmount || 0);
    const paymentAmount = Number(amount);
    const newPaidAmount = currentPaidAmount + paymentAmount;

    if (newPaidAmount > totalAmount) {
      throw new BadRequestException('Сумма платежа не может превышать общий долг');
    }

    // Обновляем оплаченную сумму и остаток
    customerDebt.paidAmount = newPaidAmount;
    customerDebt.remainingAmount = totalAmount - newPaidAmount;

    const updated = await this.customerDebtRepository.save(customerDebt);

    // Инвалидируем кеш
    await this.cacheManager.del(`customer_debts_shop_${customerDebt.shopId}`);
    await this.cacheManager.del(`customer_debts_total_shop_${customerDebt.shopId}`);

    return updated;
  }

  async remove(
    id: number,
    userRole: UserRole,
    userShopId?: number,
  ): Promise<void> {
    const customerDebt = await this.findOne(id, userRole, userShopId);

    // Проверка прав доступа
    if (userRole === UserRole.SELLER && customerDebt.shopId !== userShopId) {
      throw new ForbiddenException('Нет доступа к удалению этого долга');
    }

    await this.customerDebtRepository.softDelete(id);

    // Инвалидируем кеш
    await this.cacheManager.del(`customer_debts_shop_${customerDebt.shopId}`);
    await this.cacheManager.del(`customer_debts_total_shop_${customerDebt.shopId}`);
  }

  async getTotalDebts(
    shopId: number,
    userRole?: UserRole,
    userShopId?: number,
  ): Promise<number> {
    // Проверка прав доступа
    if (userRole === UserRole.SELLER && userShopId !== shopId) {
      throw new ForbiddenException('Нет доступа к долгам этого магазина');
    }

    const cacheKey = `customer_debts_total_shop_${shopId}`;
    const cached = await this.cacheManager.get<number>(cacheKey);
    
    if (cached !== undefined && cached !== null) {
      return cached;
    }

    const debts = await this.customerDebtRepository.find({
      where: { shopId },
    });

    // Считаем только неоплаченные долги (remainingAmount > 0)
    const total = debts.reduce((sum, debt) => {
      let remaining: number;
      if (debt.remainingAmount !== undefined && debt.remainingAmount !== null) {
        remaining = Number(debt.remainingAmount);
      } else {
        // Для старых записей без remainingAmount вычисляем его
        const totalAmount = Number(debt.amount);
        const paid = Number(debt.paidAmount || 0);
        remaining = totalAmount - paid;
      }
      // Учитываем только неоплаченные долги
      return remaining > 0 ? sum + remaining : sum;
    }, 0);

    // Кешируем на 60 секунд
    await this.cacheManager.set(cacheKey, total, 60000);

    return total;
  }
}
