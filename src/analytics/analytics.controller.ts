import {
  Controller,
  Get,
  UseGuards,
  ParseIntPipe,
  Query,
  ForbiddenException,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('financial')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30_000)
  @UseGuards(RolesGuard)
  @Roles(UserRole.SHOP_OWNER, UserRole.ADMIN)
  getFinancialAnalytics(
    @Query('period') period: 'day' | 'month' | 'year' = 'day',
    @CurrentUser() user: any,
  ) {
    // Используем shopId из токена для владельцев и продавцов
    const shopId = user.shopId || user.shop?.id;
    if (!shopId) {
      throw new ForbiddenException('Магазин не назначен');
    }
    
    return this.analyticsService.getFinancialAnalytics(
      shopId,
      period,
      user.role,
      user.shopId,
    );
  }

  @Get('top-products')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30_000)
  @UseGuards(RolesGuard)
  @Roles(UserRole.SHOP_OWNER, UserRole.ADMIN)
  getTopSellingProducts(
    @Query('limit') limit?: string,
    @CurrentUser() user?: any,
  ) {
    // Используем shopId из токена для владельцев и продавцов
    const shopId = user.shopId || user.shop?.id;
    if (!shopId) {
      throw new ForbiddenException('Магазин не назначен');
    }
    
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return this.analyticsService.getTopSellingProducts(
      shopId,
      limitNumber,
      user.role,
      user.shopId,
    );
  }

  @Get('unsold-products')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60_000)
  @UseGuards(RolesGuard)
  @Roles(UserRole.SHOP_OWNER, UserRole.ADMIN)
  getUnsoldProducts(
    @Query('days') days?: string,
    @CurrentUser() user?: any,
  ) {
    // Используем shopId из токена для владельцев и продавцов
    const shopId = user.shopId || user.shop?.id;
    if (!shopId) {
      throw new ForbiddenException('Магазин не назначен');
    }
    
    const daysNumber = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getUnsoldProducts(
      shopId,
      daysNumber,
      user.role,
      user.shopId,
    );
  }

  @Get('sales')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30_000)
  @UseGuards(RolesGuard)
  @Roles(UserRole.SHOP_OWNER, UserRole.ADMIN)
  getSalesAnalytics(
    @Query('shopId', ParseIntPipe) shopId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.analyticsService.getSalesAnalytics(
      shopId,
      start,
      end,
      user.role,
      user.shopId,
    );
  }

  // ─── Admin panel: global analytics (admin_of_app only) ───────────────────
  @Get('admin/sales')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30_000)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getAdminSales(@Query('period') period: 'week' | 'month' | 'year' = 'week') {
    return this.analyticsService.getAdminSalesByPeriod(period);
  }

  @Get('admin/shops')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30_000)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getAdminShops(@Query('period') period: 'week' | 'month' | 'year' = 'week') {
    return this.analyticsService.getAdminShopsPerformance(period);
  }

  @Get('admin/top-products')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30_000)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getAdminTopProducts(
    @Query('period') period: 'week' | 'month' | 'year' = 'week',
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 5;
    return this.analyticsService.getAdminTopProducts(period, limitNum);
  }
}
