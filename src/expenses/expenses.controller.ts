import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(@Body() createExpenseDto: CreateExpenseDto, @CurrentUser() user: any) {
    // Автоматически добавляем shopId из токена, если не указан
    const shopId = createExpenseDto.shopId || user.shopId || user.shop?.id;
    if (!shopId) {
      throw new ForbiddenException('Магазин не назначен');
    }
    
    return this.expensesService.create(
      { ...createExpenseDto, shopId },
      user.id,
      user.role,
      user.shopId,
    );
  }

  @Get()
  findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any,
  ) {
    // Используем shopId из токена для владельцев и продавцов
    const shopId = user.shopId || user.shop?.id;
    if (!shopId) {
      throw new ForbiddenException('Магазин не назначен');
    }
    
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.expensesService.findAll(
      shopId,
      start,
      end,
      user.role,
      user.shopId,
    );
  }

  @Get('total')
  getTotalExpenses(
    @Query('shopId', ParseIntPipe) shopId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.expensesService.getTotalExpenses(
      shopId,
      start,
      end,
      user.role,
      user.shopId,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.expensesService.findOne(id, user.role, user.shopId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @CurrentUser() user: any,
  ) {
    return this.expensesService.update(
      id,
      updateExpenseDto,
      user.role,
      user.shopId,
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.expensesService.remove(id, user.role, user.shopId);
  }
}
