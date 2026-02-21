import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shop } from './entities/shop.entity';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { ShopSettings } from '../shop-settings/entities/shop-settings.entity';

@Injectable()
export class ShopsService {
  constructor(
    @InjectRepository(Shop)
    private shopRepository: Repository<Shop>,
    @InjectRepository(ShopSettings)
    private shopSettingsRepository: Repository<ShopSettings>,
  ) {}

  async create(createShopDto: CreateShopDto): Promise<Shop> {
    // Проверка на дубликат имени
    const existingShop = await this.shopRepository.findOne({
      where: { name: createShopDto.name },
    });

    if (existingShop) {
      throw new ConflictException('Магазин с таким названием уже существует');
    }

    const shop = this.shopRepository.create(createShopDto);
    const savedShop = await this.shopRepository.save(shop);

    // Создаем настройки по умолчанию для нового магазина
    const defaultSettings = this.shopSettingsRepository.create({
      shopId: savedShop.id,
      enableSizes: createShopDto.type === 'clothing',
      enableWeight: createShopDto.type === 'grocery',
      enableBarcode: true,
      enableCategories: true,
    });

    await this.shopSettingsRepository.save(defaultSettings);

    return savedShop;
  }

  async findAll(): Promise<Shop[]> {
    return this.shopRepository.find({
      relations: ['users', 'products'],
      order: { createdAt: 'DESC' },
    });
  }

  async findActive(): Promise<Shop[]> {
    return this.shopRepository.find({
      where: { isActive: true },
      relations: ['users', 'products'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Shop> {
    const shop = await this.shopRepository.findOne({
      where: { id },
      relations: ['users', 'products', 'settings'],
    });

    if (!shop) {
      throw new NotFoundException(`Магазин с ID ${id} не найден`);
    }

    return shop;
  }

  async update(id: number, updateShopDto: UpdateShopDto): Promise<Shop> {
    const shop = await this.findOne(id);

    // Проверка на дубликат имени при обновлении
    if (updateShopDto.name && updateShopDto.name !== shop.name) {
      const existingShop = await this.shopRepository.findOne({
        where: { name: updateShopDto.name },
      });

      if (existingShop) {
        throw new ConflictException('Магазин с таким названием уже существует');
      }
    }

    Object.assign(shop, updateShopDto);
    return this.shopRepository.save(shop);
  }

  async block(id: number): Promise<Shop> {
    const shop = await this.findOne(id);
    shop.isActive = false;
    return this.shopRepository.save(shop);
  }

  async unblock(id: number): Promise<Shop> {
    const shop = await this.findOne(id);
    shop.isActive = true;
    return this.shopRepository.save(shop);
  }

  async remove(id: number): Promise<void> {
    const shop = await this.findOne(id);
    await this.shopRepository.softDelete(id);
  }

  async getShopStatistics(id: number) {
    const shop = await this.shopRepository.findOne({
      where: { id },
      relations: ['products', 'users'],
    });

    if (!shop) {
      throw new NotFoundException(`Магазин с ID ${id} не найден`);
    }

    const totalProducts = shop.products.length;
    const totalQuantity = shop.products.reduce(
      (sum, product) => sum + product.quantity,
      0,
    );
    const totalValue = shop.products.reduce(
      (sum, product) => sum + product.purchasePrice * product.quantity,
      0,
    );
    const totalUsers = shop.users.length;

    return {
      shopId: id,
      shopName: shop.name,
      totalProducts,
      totalQuantity,
      totalValue: Number(totalValue.toFixed(2)),
      totalUsers,
    };
  }
}
