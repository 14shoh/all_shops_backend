import {
  Controller,
  Get,
  UseGuards,
  ParseIntPipe,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('warehouse')
@UseGuards(JwtAuthGuard)
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get('status')
  getWarehouseStatus(
    @CurrentUser() user: any,
  ) {
    // Используем shopId из токена для владельцев и продавцов
    const shopId = user.shopId || user.shop?.id;
    if (!shopId) {
      throw new ForbiddenException('Магазин не назначен');
    }
    
    return this.warehouseService.getWarehouseStatus(
      shopId,
      user.role,
      user.shopId,
    );
  }

  @Get('category')
  getProductsByCategory(
    @Query('shopId', ParseIntPipe) shopId: number,
    @Query('category') category: string,
    @CurrentUser() user: any,
  ) {
    return this.warehouseService.getProductsByCategory(
      shopId,
      category,
      user.role,
      user.shopId,
    );
  }

  @Get('low-stock')
  getLowStockItems(
    @Query('shopId', ParseIntPipe) shopId: number,
    @Query('threshold') threshold?: string,
    @CurrentUser() user?: any,
  ) {
    const thresholdNumber = threshold ? parseInt(threshold, 10) : 10;
    return this.warehouseService.getLowStockItems(
      shopId,
      thresholdNumber,
      user.role,
      user.shopId,
    );
  }

  @Get('out-of-stock')
  getOutOfStockItems(
    @Query('shopId', ParseIntPipe) shopId: number,
    @CurrentUser() user: any,
  ) {
    return this.warehouseService.getOutOfStockItems(
      shopId,
      user.role,
      user.shopId,
    );
  }
}
