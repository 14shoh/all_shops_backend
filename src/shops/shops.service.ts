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
import { LogsService } from '../logs/logs.service';

@Injectable()
export class ShopsService {
  constructor(
    @InjectRepository(Shop)
    private shopRepository: Repository<Shop>,
    @InjectRepository(ShopSettings)
    private shopSettingsRepository: Repository<ShopSettings>,
    private logsService: LogsService,
  ) {}

  async create(createShopDto: CreateShopDto, userId?: number): Promise<Shop> {
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

    if (userId) {
      this.logsService.log(userId, 'create_shop', `Создан магазин "${savedShop.name}"`).catch(() => {});
    }
    return savedShop;
  }

  async findAll(): Promise<Shop[]> {
    // Убираем relations для оптимизации - админ панели не нужны все товары и пользователи
    return this.shopRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findActive(): Promise<Shop[]> {
    // Убираем relations для оптимизации
    return this.shopRepository.find({
      where: { isActive: true },
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

  async getShopPhone(id: number): Promise<{ phone: string | null }> {
    const shop = await this.shopRepository.findOne({
      where: { id },
      select: ['id', 'phone'],
    });

    if (!shop) {
      throw new NotFoundException(`Магазин с ID ${id} не найден`);
    }

    return { phone: shop.phone ?? null };
  }

  async updateShopPhone(id: number, phone?: string): Promise<{ phone: string | null }> {
    const shop = await this.shopRepository.findOne({
      where: { id },
      select: ['id', 'phone'],
    });

    if (!shop) {
      throw new NotFoundException(`Магазин с ID ${id} не найден`);
    }

    const normalized = phone == null ? '' : phone.toString().trim();
    shop.phone = normalized.length > 0 ? normalized : null;
    const saved = await this.shopRepository.save(shop);
    return { phone: saved.phone ?? null };
  }

  async update(id: number, updateShopDto: UpdateShopDto, userId?: number): Promise<Shop> {
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
    const saved = await this.shopRepository.save(shop);
    if (userId) {
      this.logsService.log(userId, 'update_shop', `Обновлён магазин "${saved.name}" (ID ${id})`).catch(() => {});
    }
    return saved;
  }

  async block(id: number, userId?: number): Promise<Shop> {
    const shop = await this.findOne(id);
    shop.isActive = false;
    const saved = await this.shopRepository.save(shop);
    if (userId) {
      this.logsService.log(userId, 'block_shop', `Заблокирован магазин "${shop.name}" (ID ${id})`).catch(() => {});
    }
    return saved;
  }

  async unblock(id: number, userId?: number): Promise<Shop> {
    const shop = await this.findOne(id);
    shop.isActive = true;
    const saved = await this.shopRepository.save(shop);
    if (userId) {
      this.logsService.log(userId, 'unblock_shop', `Разблокирован магазин "${shop.name}" (ID ${id})`).catch(() => {});
    }
    return saved;
  }

  async remove(id: number, userId?: number): Promise<void> {
    const shop = await this.findOne(id);
    const name = shop.name;
    await this.shopRepository.softDelete(id);
    if (userId) {
      this.logsService.log(userId, 'delete_shop', `Удалён магазин "${name}" (ID ${id})`).catch(() => {});
    }
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

  // Оптимизированная статистика для дашборда админ панели
  async getDashboardStats() {
    const [totalShops, activeShops] = await Promise.all([
      this.shopRepository.count(),
      this.shopRepository.count({ where: { isActive: true } }),
    ]);

    return {
      totalShops,
      activeShops,
    };
  }
}
