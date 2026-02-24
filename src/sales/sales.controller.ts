import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { FindSalesDto } from './dto/find-sales.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  create(@Body() createSaleDto: CreateSaleDto, @CurrentUser() user: any) {
    return this.salesService.create(
      createSaleDto,
      user.id,
      user.role,
      user.shopId,
    );
  }

  @Get()
  findAll(
    @Query() query: FindSalesDto,
    @CurrentUser() user: any,
  ) {
    console.log('📥 Запрос продаж от пользователя:', {
      userId: user.id,
      username: user.username,
      role: user.role,
      shopId: user.shopId,
      sellerId: user.role === UserRole.SELLER ? user.id : undefined,
      scope: query.scope,
      queryPage: query.page,
      queryLimit: query.limit,
    });
    
    return this.salesService.findAll(
      query,
      user.role,
      user.shopId,
      user.role === UserRole.SELLER ? user.id : undefined,
    );
  }

  @Get('daily')
  getDailySales(
    @Query('shopId', ParseIntPipe) shopId: number,
    @Query('date') date?: string,
    @CurrentUser() user?: any,
  ) {
    const saleDate = date ? new Date(date) : new Date();
    return this.salesService.getDailySales(
      shopId,
      saleDate,
      user.role,
      user.shopId,
      user.role === UserRole.SELLER ? user.id : undefined,
    );
  }

  @Get('seller/:sellerId/daily')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER, UserRole.SHOP_OWNER, UserRole.ADMIN)
  getSellerDailyReport(
    @Param('sellerId', ParseIntPipe) sellerId: number,
    @Query('date') date?: string,
    @CurrentUser() user?: any,
  ) {
    const saleDate = date ? new Date(date) : new Date();
    return this.salesService.getSellerDailyReport(
      sellerId,
      saleDate,
      user.role,
      user.shopId,
    );
  }

  @Get('deleted/statistics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SHOP_OWNER, UserRole.ADMIN)
  getDeletedStatistics(
    @Query('shopId', ParseIntPipe) shopId: number,
    @CurrentUser() user: any,
  ) {
    return this.salesService.getDeletedStatistics(
      shopId,
      user.role,
      user.shopId,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.salesService.findOne(
      id,
      user.role,
      user.shopId,
      user.role === UserRole.SELLER ? user.id : undefined,
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER, UserRole.SHOP_OWNER, UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.salesService.remove(
      id,
      user.role,
      user.shopId,
    );
  }
}
