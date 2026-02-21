import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  Patch,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SHOP_OWNER, UserRole.ADMIN)
  create(@Body() createInventoryDto: CreateInventoryDto, @CurrentUser() user: any) {
    // Автоматически добавляем shopId из токена, если не указан
    const shopId = createInventoryDto.shopId || user.shopId || user.shop?.id;
    if (!shopId) {
      throw new ForbiddenException('Магазин не назначен');
    }
    
    return this.inventoryService.create(
      { ...createInventoryDto, shopId },
      user.id,
      user.role,
      user.shopId,
    );
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
  ) {
    // Используем shopId из токена для владельцев и продавцов
    const shopId = user.shopId || user.shop?.id;
    if (!shopId) {
      throw new ForbiddenException('Магазин не назначен');
    }
    
    return this.inventoryService.findAll(shopId, user.role, user.shopId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.inventoryService.findOne(id, user.role, user.shopId);
  }

  @Get(':id/report')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SHOP_OWNER, UserRole.ADMIN)
  generateReport(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.inventoryService.generateReport(id, user.role, user.shopId);
  }

  @Patch(':id/complete')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SHOP_OWNER, UserRole.ADMIN)
  complete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.inventoryService.complete(id, user.role, user.shopId);
  }
}
