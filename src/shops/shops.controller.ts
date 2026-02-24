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
} from '@nestjs/common';
import { ShopsService } from './shops.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { UpdateShopPhoneDto } from './dto/update-shop-phone.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('shops')
@UseGuards(JwtAuthGuard)
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createShopDto: CreateShopDto, @CurrentUser() user: any) {
    return this.shopsService.create(createShopDto, user?.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.shopsService.findAll();
  }

  @Get('active')
  findActive() {
    return this.shopsService.findActive();
  }

  @Get('dashboard/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getDashboardStats() {
    return this.shopsService.getDashboardStats();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    // Владельцы могут видеть только свой магазин
    if (user.role === UserRole.SHOP_OWNER && user.shopId !== id) {
      throw new ForbiddenException('Нет доступа к этому магазину');
    }
    return this.shopsService.findOne(id);
  }

  // Номер телефона магазина для QR (доступен авторизованным пользователям своего магазина)
  @Get(':id/phone')
  async getShopPhone(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    // seller / shop_owner могут получить только свой магазин; admin_of_app может любой
    if (user.role !== UserRole.ADMIN && user.shopId !== id) {
      throw new ForbiddenException('Нет доступа к телефону этого магазина');
    }
    return this.shopsService.getShopPhone(id);
  }

  @Patch(':id/phone')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SHOP_OWNER, UserRole.ADMIN)
  async updateShopPhone(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShopPhoneDto,
    @CurrentUser() user: any,
  ) {
    // Владелец может менять только свой магазин
    if (user.role === UserRole.SHOP_OWNER && user.shopId !== id) {
      throw new ForbiddenException('Нет доступа к этому магазину');
    }
    return this.shopsService.updateShopPhone(id, dto.phone);
  }

  @Get(':id/statistics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SHOP_OWNER)
  getStatistics(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    // Владельцы могут видеть статистику только своего магазина
    if (user.role === UserRole.SHOP_OWNER && user.shopId !== id) {
      throw new ForbiddenException('Нет доступа к статистике этого магазина');
    }
    return this.shopsService.getShopStatistics(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateShopDto: UpdateShopDto,
    @CurrentUser() user: any,
  ) {
    return this.shopsService.update(id, updateShopDto, user?.id);
  }

  @Patch(':id/block')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  block(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.shopsService.block(id, user?.id);
  }

  @Patch(':id/unblock')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  unblock(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.shopsService.unblock(id, user?.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.shopsService.remove(id, user?.id);
  }
}
