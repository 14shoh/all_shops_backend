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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FindProductsDto } from './dto/find-products.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: any,
  ) {
    return this.productsService.create(
      createProductDto,
      user.id,
      user.role,
      user.shopId,
    );
  }

  @Get()
  findAll(
    @Query() query: FindProductsDto,
    @CurrentUser() user: any,
  ) {
    console.log('📥 Запрос товаров от пользователя:', {
      userId: user.id,
      username: user.username,
      role: user.role,
      shopId: user.shopId,
    });
    
    return this.productsService.findAll(
      query,
      user.role,
      user.shopId,
    );
  }

  @Get('categories')
  getCategories(
    @Query('shopId', ParseIntPipe) shopId: number,
    @CurrentUser() user: any,
  ) {
    return this.productsService.getCategories(
      shopId,
      user.role,
      user.shopId,
    );
  }

  @Get('low-stock')
  getLowStockProducts(
    @Query('shopId', ParseIntPipe) shopId: number,
    @Query('threshold') threshold?: string,
    @CurrentUser() user?: any,
  ) {
    const thresholdNumber = threshold ? parseInt(threshold, 10) : 10;
    return this.productsService.getLowStockProducts(
      shopId,
      thresholdNumber,
      user.role,
      user.shopId,
    );
  }

  @Get('barcode/:barcode')
  findByBarcode(
    @Param('barcode') barcode: string,
    @Query('shopId', ParseIntPipe) shopId: number,
    @CurrentUser() user: any,
  ) {
    return this.productsService.findByBarcode(
      barcode,
      shopId,
      user.role,
      user.shopId,
    );
  }

  @Get('barcode/:barcode/all')
  findAllByBarcode(
    @Param('barcode') barcode: string,
    @CurrentUser() user: any,
  ) {
    // Используем shopId из токена для продавцов
    const shopId = user.shopId || user.shop?.id;
    if (!shopId) {
      throw new ForbiddenException('Магазин не назначен');
    }
    
    return this.productsService.findAllByBarcode(
      barcode,
      shopId,
      user.role,
      user.shopId,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.productsService.findOne(id, user.role, user.shopId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: any,
  ) {
    return this.productsService.update(
      id,
      updateProductDto,
      user.role,
      user.shopId,
    );
  }

  @Patch(':id/quantity')
  updateQuantity(
    @Param('id', ParseIntPipe) id: number,
    @Body('quantity', ParseIntPipe) quantity: number,
    @CurrentUser() user: any,
  ) {
    return this.productsService.updateQuantity(
      id,
      quantity,
      user.role,
      user.shopId,
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.productsService.remove(id, user.role, user.shopId);
  }
}
