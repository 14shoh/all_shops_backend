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
  ForbiddenException,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { CustomerDebtsService } from './customer-debts.service';
import { CreateCustomerDebtDto } from './dto/create-customer-debt.dto';
import { UpdateCustomerDebtDto } from './dto/update-customer-debt.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('customer-debts')
@UseGuards(JwtAuthGuard)
export class CustomerDebtsController {
  constructor(private readonly customerDebtsService: CustomerDebtsService) {}

  @Post()
  async create(@Body() createCustomerDebtDto: CreateCustomerDebtDto, @CurrentUser() user: any) {
    try {
      const shopId = createCustomerDebtDto.shopId || user.shopId || user.shop?.id;
      if (!shopId) {
        throw new ForbiddenException('Магазин не назначен');
      }
      
      console.log('📥 POST /customer-debts:', {
        dto: createCustomerDebtDto,
        userId: user.id,
        userShopId: user.shopId,
        resolvedShopId: shopId,
      });
      
      const result = await this.customerDebtsService.create(
        { ...createCustomerDebtDto, shopId },
        user.id,
        user.role,
        user.shopId,
      );
      
      console.log('✅ Результат создания:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Ошибка в контроллере customer-debts:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      // Если это ошибка базы данных, проверяем, существует ли таблица
      if (error.message?.includes('Table') || error.message?.includes('doesn\'t exist')) {
        console.error('⚠️ Возможно, таблица customer_debts не существует. Запустите миграцию: npm run migration:run');
      }
      throw error;
    }
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60)
  findAll(@CurrentUser() user: any) {
    try {
      if (!user) {
        throw new ForbiddenException('Пользователь не авторизован');
      }
      
      const shopId = user.shopId || user.shop?.id;
      if (!shopId) {
        throw new ForbiddenException('Магазин не назначен');
      }
      
      console.log('📥 GET /customer-debts:', {
        userId: user.id,
        shopId: shopId,
        role: user.role,
      });
      
      return this.customerDebtsService.findAll(shopId, user.role, user.shopId);
    } catch (error: any) {
      console.error('❌ Ошибка в GET /customer-debts:', error);
      throw error;
    }
  }

  @Get('total')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60)
  getTotalDebts(@CurrentUser() user?: any) {
    const shopId = user.shopId || user.shop?.id;
    if (!shopId) {
      throw new ForbiddenException('Магазин не назначен');
    }
    
    return this.customerDebtsService.getTotalDebts(shopId, user.role, user.shopId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.customerDebtsService.findOne(id, user.role, user.shopId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDebtDto: UpdateCustomerDebtDto,
    @CurrentUser() user: any,
  ) {
    return this.customerDebtsService.update(
      id,
      updateCustomerDebtDto,
      user.role,
      user.shopId,
    );
  }

  @Post(':id/payment')
  addPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() addPaymentDto: AddPaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.customerDebtsService.addPayment(
      id,
      addPaymentDto.amount,
      user.role,
      user.shopId,
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.customerDebtsService.remove(id, user.role, user.shopId);
  }
}
