import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
  ) {}

  async create(
    createExpenseDto: CreateExpenseDto,
    userId: number,
    userRole: UserRole,
    userShopId?: number,
  ): Promise<Expense> {
    // Проверка прав доступа
    if (userRole === UserRole.SELLER && userShopId !== createExpenseDto.shopId) {
      throw new ForbiddenException('Нет доступа к добавлению расходов для этого магазина');
    }

    const expense = this.expenseRepository.create({
      ...createExpenseDto,
      userId,
    });

    return this.expenseRepository.save(expense);
  }

  async findAll(
    shopId: number,
    startDate?: Date,
    endDate?: Date,
    userRole?: UserRole,
    userShopId?: number,
  ): Promise<Expense[]> {
    // Проверка прав доступа
    if (userRole === UserRole.SELLER && userShopId !== shopId) {
      throw new ForbiddenException('Нет доступа к расходам этого магазина');
    }

    const where: any = { shopId };

    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    } else if (startDate) {
      where.createdAt = Between(startDate, new Date());
    }

    return this.expenseRepository.find({
      where,
      relations: ['user', 'shop'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(
    id: number,
    userRole: UserRole,
    userShopId?: number,
  ): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id },
      relations: ['user', 'shop'],
    });

    if (!expense) {
      throw new NotFoundException(`Расход с ID ${id} не найден`);
    }

    // Проверка прав доступа
    if (userRole === UserRole.SELLER && expense.shopId !== userShopId) {
      throw new ForbiddenException('Нет доступа к этому расходу');
    }

    return expense;
  }

  async update(
    id: number,
    updateExpenseDto: UpdateExpenseDto,
    userRole: UserRole,
    userShopId?: number,
  ): Promise<Expense> {
    const expense = await this.findOne(id, userRole, userShopId);

    // Проверка прав доступа
    if (userRole === UserRole.SELLER && expense.shopId !== userShopId) {
      throw new ForbiddenException('Нет доступа к редактированию этого расхода');
    }

    Object.assign(expense, updateExpenseDto);
    return this.expenseRepository.save(expense);
  }

  async remove(
    id: number,
    userRole: UserRole,
    userShopId?: number,
  ): Promise<void> {
    const expense = await this.findOne(id, userRole, userShopId);

    // Проверка прав доступа
    if (userRole === UserRole.SELLER && expense.shopId !== userShopId) {
      throw new ForbiddenException('Нет доступа к удалению этого расхода');
    }

    await this.expenseRepository.softDelete(id);
  }

  async getTotalExpenses(
    shopId: number,
    startDate?: Date,
    endDate?: Date,
    userRole?: UserRole,
    userShopId?: number,
  ): Promise<number> {
    // Проверка прав доступа
    if (userRole === UserRole.SELLER && userShopId !== shopId) {
      throw new ForbiddenException('Нет доступа к расходам этого магазина');
    }

    const where: any = { shopId };

    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    } else if (startDate) {
      where.createdAt = Between(startDate, new Date());
    }

    const expenses = await this.expenseRepository.find({ where });
    return expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  }
}
