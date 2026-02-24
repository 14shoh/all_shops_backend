import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ShopSettingsService } from './shop-settings.service';
import { UpdateShopSettingsDto } from './dto/update-shop-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('shop-settings')
@UseGuards(JwtAuthGuard)
export class ShopSettingsController {
  constructor(private readonly shopSettingsService: ShopSettingsService) {}

  @Get(':shopId')
  getSettings(
    @Param('shopId', ParseIntPipe) shopId: number,
    @CurrentUser() user: any,
  ) {
    return this.shopSettingsService.getSettings(shopId, user.role);
  }

  @Patch(':shopId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SHOP_OWNER, UserRole.ADMIN)
  updateSettings(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Body() updateShopSettingsDto: UpdateShopSettingsDto,
    @CurrentUser() user: any,
  ) {
    return this.shopSettingsService.updateSettings(
      shopId,
      updateShopSettingsDto,
      user.role,
    );
  }

  @Get(':shopId/payment-account')
  getPaymentAccount(
    @Param('shopId', ParseIntPipe) shopId: number,
    @CurrentUser() user: any,
  ) {
    // Разрешаем доступ для всех авторизованных пользователей (seller и admin)
    return this.shopSettingsService.getPaymentAccount(shopId);
  }
}
