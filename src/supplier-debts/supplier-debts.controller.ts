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
import { SupplierDebtsService } from './supplier-debts.service';
import { CreateSupplierDebtDto } from './dto/create-supplier-debt.dto';
import { UpdateSupplierDebtDto } from './dto/update-supplier-debt.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('supplier-debts')
@UseGuards(JwtAuthGuard)
export class SupplierDebtsController {
  constructor(private readonly supplierDebtsService: SupplierDebtsService) {}

  @Post()
  async create(@Body() createSupplierDebtDto: CreateSupplierDebtDto, @CurrentUser() user: any) {
    try {
      const shopId = createSupplierDebtDto.shopId || user.shopId || user.shop?.id;
      if (!shopId) {
        throw new ForbiddenException('Магазин не назначен');
      }
      
      console.log('📥 POST /supplier-debts:', {
        dto: createSupplierDebtDto,
        userId: user.id,
        userShopId: user.shopId,
        resolvedShopId: shopId,
      });
      
      const result = await this.supplierDebtsService.create(
        { ...createSupplierDebtDto, shopId },
        user.id,
        user.role,
        user.shopId,
      );
      
      console.log('✅ Результат создания:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Ошибка в контроллере supplier-debts:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      // Если это ошибка базы данных, проверяем, существует ли таблица
      if (error.message?.includes('Table') || error.message?.includes('doesn\'t exist')) {
        console.error('⚠️ Возможно, таблица supplier_debts не существует. Запустите миграцию: npm run migration:run');
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
      
      console.log('📥 GET /supplier-debts:', {
        userId: user.id,
        shopId: shopId,
        role: user.role,
      });
      
      return this.supplierDebtsService.findAll(shopId, user.role, user.shopId);
    } catch (error: any) {
      console.error('❌ Ошибка в GET /supplier-debts:', error);
      throw error;
    }
  }

  @Get('summary')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60)
  getSummary(@CurrentUser() user?: any) {
    const shopId = user.shopId || user.shop?.id;
    if (!shopId) {
      throw new ForbiddenException('Магазин не назначен');
    }
    
    return this.supplierDebtsService.getSummary(shopId, user.role, user.shopId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.supplierDebtsService.findOne(id, user.role, user.shopId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSupplierDebtDto: UpdateSupplierDebtDto,
    @CurrentUser() user: any,
  ) {
    return this.supplierDebtsService.update(
      id,
      updateSupplierDebtDto,
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
    return this.supplierDebtsService.addPayment(
      id,
      addPaymentDto,
      user.role,
      user.shopId,
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.supplierDebtsService.remove(id, user.role, user.shopId);
  }
}
