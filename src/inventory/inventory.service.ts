import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import { InventoryItem } from './entities/inventory-item.entity';
import { Product } from '../products/entities/product.entity';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    @InjectRepository(InventoryItem)
    private inventoryItemRepository: Repository<InventoryItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(
    createInventoryDto: CreateInventoryDto,
    userId: number,
    userRole: UserRole,
    userShopId?: number,
  ): Promise<Inventory> {
    // Проверка прав доступа
    if (userRole === UserRole.SELLER && userShopId !== createInventoryDto.shopId) {
      throw new ForbiddenException('Нет доступа к инвентаризации этого магазина');
    }

    if (createInventoryDto.items.length === 0) {
      throw new BadRequestException('Инвентаризация должна содержать хотя бы один товар');
    }

    // Создаем инвентаризацию
    const inventory = this.inventoryRepository.create({
      shopId: createInventoryDto.shopId,
      userId,
      notes: createInventoryDto.notes,
      isCompleted: false,
    });

    const savedInventory = await this.inventoryRepository.save(inventory);

    // Создаем позиции инвентаризации
    const items: InventoryItem[] = [];

    for (const itemDto of createInventoryDto.items) {
      const product = await this.productRepository.findOne({
        where: { id: itemDto.productId },
      });

      if (!product) {
        throw new NotFoundException(`Товар с ID ${itemDto.productId} не найден`);
      }

      if (product.shopId !== createInventoryDto.shopId) {
        throw new BadRequestException(
          `Товар с ID ${itemDto.productId} не принадлежит этому магазину`,
        );
      }

      const difference = itemDto.actualQuantity - itemDto.expectedQuantity;

      const item = this.inventoryItemRepository.create({
        inventoryId: savedInventory.id,
        productId: itemDto.productId,
        expectedQuantity: itemDto.expectedQuantity,
        actualQuantity: itemDto.actualQuantity,
        difference,
      });

      items.push(item);
    }

    await this.inventoryItemRepository.save(items);

    return this.findOne(savedInventory.id, userRole, userShopId);
  }

  async findAll(
    shopId: number,
    userRole: UserRole,
    userShopId?: number,
  ): Promise<Inventory[]> {
    // Проверка прав доступа
    if (userRole === UserRole.SELLER && userShopId !== shopId) {
      throw new ForbiddenException('Нет доступа к инвентаризации этого магазина');
    }

    return this.inventoryRepository.find({
      where: { shopId },
      relations: ['user', 'shop', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(
    id: number,
    userRole: UserRole,
    userShopId?: number,
  ): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['user', 'shop', 'items', 'items.product'],
    });

    if (!inventory) {
      throw new NotFoundException(`Инвентаризация с ID ${id} не найдена`);
    }

    // Проверка прав доступа
    if (userRole === UserRole.SELLER && inventory.shopId !== userShopId) {
      throw new ForbiddenException('Нет доступа к этой инвентаризации');
    }

    return inventory;
  }

  async complete(
    id: number,
    userRole: UserRole,
    userShopId?: number,
  ): Promise<Inventory> {
    const inventory = await this.findOne(id, userRole, userShopId);

    if (inventory.isCompleted) {
      throw new BadRequestException('Инвентаризация уже завершена');
    }

    // Обновляем количество товаров на основе фактического количества
    for (const item of inventory.items) {
      const product = await this.productRepository.findOne({
        where: { id: item.productId },
      });

      if (product) {
        product.quantity = item.actualQuantity;
        await this.productRepository.save(product);
      }
    }

    inventory.isCompleted = true;
    inventory.completedAt = new Date();

    return this.inventoryRepository.save(inventory);
  }

  async generateReport(
    id: number,
    userRole: UserRole,
    userShopId?: number,
  ) {
    const inventory = await this.findOne(id, userRole, userShopId);

    const totalItems = inventory.items.length;
    const itemsWithDifference = inventory.items.filter((item) => item.difference !== 0);
    const totalDifference = inventory.items.reduce(
      (sum, item) => sum + item.difference,
      0,
    );

    const discrepancies = itemsWithDifference.map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      expectedQuantity: item.expectedQuantity,
      actualQuantity: item.actualQuantity,
      difference: item.difference,
    }));

    return {
      inventoryId: inventory.id,
      shopId: inventory.shopId,
      shopName: inventory.shop.name,
      createdAt: inventory.createdAt,
      completedAt: inventory.completedAt,
      isCompleted: inventory.isCompleted,
      notes: inventory.notes,
      totalItems,
      itemsWithDifference: itemsWithDifference.length,
      totalDifference,
      discrepancies,
      items: inventory.items.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        barcode: item.product.barcode,
        category: item.product.category,
        expectedQuantity: item.expectedQuantity,
        actualQuantity: item.actualQuantity,
        difference: item.difference,
      })),
    };
  }
}
