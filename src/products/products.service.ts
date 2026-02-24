import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, LessThan } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FindProductsDto } from './dto/find-products.dto';
import { Shop } from '../shops/entities/shop.entity';
import { ShopSettings } from '../shop-settings/entities/shop-settings.entity';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Shop)
    private shopRepository: Repository<Shop>,
    @InjectRepository(ShopSettings)
    private shopSettingsRepository: Repository<ShopSettings>,
  ) {}

  async create(createProductDto: CreateProductDto, userId: number, userRole: UserRole, userShopId?: number): Promise<Product> {
    // Проверка существования магазина
    const shop = await this.shopRepository.findOne({
      where: { id: createProductDto.shopId },
    });

    if (!shop) {
      throw new NotFoundException(`Магазин с ID ${createProductDto.shopId} не найден`);
    }

    // Проверка прав доступа: продавцы могут добавлять товары только в свой магазин
    if (userRole === UserRole.SELLER && userShopId !== createProductDto.shopId) {
      throw new ForbiddenException('Нет доступа к добавлению товаров в этот магазин');
    }

    // Проверка на дубликат штрихкода + размера в магазине
    // Для магазинов одежды разрешаем одинаковые штрихкоды для разных размеров
    // Для других магазинов штрихкод должен быть уникальным
    if (createProductDto.barcode) {
      if (shop.type === 'clothing') {
        // Для магазинов одежды проверяем комбинацию штрихкод + размер
        const whereCondition: any = {
          barcode: createProductDto.barcode,
          shopId: createProductDto.shopId,
        };
        
        if (createProductDto.size) {
          whereCondition.size = createProductDto.size;
        } else {
          whereCondition.size = null;
        }
        
        const existingProduct = await this.productRepository.findOne({
          where: whereCondition,
        });

        if (existingProduct) {
          throw new ConflictException(
            'Товар с таким штрихкодом и размером уже существует в этом магазине',
          );
        }
      } else {
        // Для других магазинов штрихкод должен быть уникальным
        const existingProduct = await this.productRepository.findOne({
          where: {
            barcode: createProductDto.barcode,
            shopId: createProductDto.shopId,
          },
        });

        if (existingProduct) {
          throw new ConflictException(
            'Товар с таким штрихкодом уже существует в этом магазине',
          );
        }
      }
    }

    // Получаем настройки магазина для валидации полей
    const shopSettings = await this.shopSettingsRepository.findOne({
      where: { shopId: createProductDto.shopId },
    });

    // Валидация полей в зависимости от типа магазина
    if (shop.type === 'clothing' && shopSettings?.enableSizes && !createProductDto.size) {
      throw new ConflictException('Для магазина одежды необходимо указать размер');
    }

    if (shop.type === 'grocery' && shopSettings?.enableWeight && !createProductDto.weight) {
      throw new ConflictException('Для продуктового магазина необходимо указать вес');
    }

    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  async findAll(
    findProductsDto: FindProductsDto,
    userRole: UserRole,
    userShopId?: number,
  ): Promise<{ data: Product[]; total: number; page: number; limit: number; totalPages: number }> {
    console.log('🔍 Поиск товаров:', {
      userRole,
      userShopId,
      queryShopId: findProductsDto.shopId,
      page: findProductsDto.page,
      limit: findProductsDto.limit,
    });
    
    const where: any = {};

    // Продавцы и владельцы видят только товары своего магазина
    if (userRole === UserRole.SELLER || userRole === UserRole.SHOP_OWNER) {
      if (!userShopId) {
        console.error('❌ Магазин не назначен для пользователя');
        throw new ForbiddenException('Магазин не назначен');
      }
      where.shopId = userShopId;
      console.log('✅ Фильтр по shopId:', userShopId);
    } else if (findProductsDto.shopId) {
      where.shopId = findProductsDto.shopId;
    }

    if (findProductsDto.category) {
      where.category = findProductsDto.category;
    }

    const page = findProductsDto.page || 1;
    const limit = findProductsDto.limit || 50;
    const skip = (page - 1) * limit;

    let queryBuilder = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.shop', 'shop')
      .where(where)
      .andWhere('product.deletedAt IS NULL'); // Явная фильтрация удаленных записей

    if (findProductsDto.search) {
      queryBuilder = queryBuilder.andWhere(
        '(product.name LIKE :search OR product.barcode LIKE :search)',
        { search: `%${findProductsDto.search}%` }
      );
    }

    // Подсчет общего количества
    const total = await queryBuilder.getCount();

    // Получение данных с пагинацией
    const products = await queryBuilder
      .orderBy('product.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();
    
    console.log(`✅ Найдено товаров: ${products.length} из ${total} (страница ${page}, лимит ${limit})`);
    if (products.length > 0) {
      console.log('📦 Первый товар:', {
        id: products[0].id,
        name: products[0].name,
        shopId: products[0].shopId,
      });
      console.log('📦 Последний товар:', {
        id: products[products.length - 1].id,
        name: products[products.length - 1].name,
        shopId: products[products.length - 1].shopId,
      });
    } else {
      console.log('⚠️ Товары не найдены! Проверьте фильтры:', where);
    }
    
    return {
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(
    id: number,
    userRole: UserRole,
    userShopId?: number,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['shop'],
    });

    if (!product) {
      throw new NotFoundException(`Товар с ID ${id} не найден`);
    }

    // Проверка прав доступа
    if (
      (userRole === UserRole.SELLER || userRole === UserRole.SHOP_OWNER) &&
      product.shopId !== userShopId
    ) {
      throw new ForbiddenException('Нет доступа к этому товару');
    }

    return product;
  }

  async findByBarcode(
    barcode: string,
    shopId: number,
    userRole: UserRole,
    userShopId?: number,
  ): Promise<Product> {
    // Проверка прав доступа
    if (userRole === UserRole.SELLER && userShopId !== shopId) {
      throw new ForbiddenException('Нет доступа к товарам этого магазина');
    }

    const product = await this.productRepository.findOne({
      where: { barcode, shopId },
      relations: ['shop'],
    });

    if (!product) {
      throw new NotFoundException(
        `Товар со штрихкодом ${barcode} не найден в магазине`,
      );
    }

    return product;
  }

  async findAllByBarcode(
    barcode: string,
    shopId: number,
    userRole: UserRole,
    userShopId?: number,
  ): Promise<Product[]> {
    // Проверка прав доступа
    if (userRole === UserRole.SELLER && userShopId !== shopId) {
      throw new ForbiddenException('Нет доступа к товарам этого магазина');
    }

    const products = await this.productRepository.find({
      where: { barcode, shopId },
      relations: ['shop'],
      order: { size: 'ASC' },
    });

    return products;
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
    userRole: UserRole,
    userShopId?: number,
  ): Promise<Product> {
    const product = await this.findOne(id, userRole, userShopId);

    // Проверка прав доступа
    if (
      (userRole === UserRole.SELLER || userRole === UserRole.SHOP_OWNER) &&
      product.shopId !== userShopId
    ) {
      throw new ForbiddenException('Нет доступа к редактированию этого товара');
    }

    // Проверка на дубликат штрихкода при обновлении
    if (updateProductDto.barcode && updateProductDto.barcode !== product.barcode) {
      const existingProduct = await this.productRepository.findOne({
        where: {
          barcode: updateProductDto.barcode,
          shopId: product.shopId,
        },
      });

      if (existingProduct) {
        throw new ConflictException(
          'Товар с таким штрихкодом уже существует в этом магазине',
        );
      }
    }

    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async updateQuantity(
    id: number,
    quantity: number,
    userRole: UserRole,
    userShopId?: number,
  ): Promise<Product> {
    const product = await this.findOne(id, userRole, userShopId);

    // Проверка прав доступа
    if (
      (userRole === UserRole.SELLER || userRole === UserRole.SHOP_OWNER) &&
      product.shopId !== userShopId
    ) {
      throw new ForbiddenException('Нет доступа к изменению количества этого товара');
    }

    product.quantity = quantity;
    return this.productRepository.save(product);
  }

  async remove(
    id: number,
    userRole: UserRole,
    userShopId?: number,
  ): Promise<void> {
    const product = await this.findOne(id, userRole, userShopId);

    // Проверка прав доступа
    if (
      (userRole === UserRole.SELLER || userRole === UserRole.SHOP_OWNER) &&
      product.shopId !== userShopId
    ) {
      throw new ForbiddenException('Нет доступа к удалению этого товара');
    }

    await this.productRepository.softDelete(id);
  }

  async getCategories(shopId: number, userRole: UserRole, userShopId?: number): Promise<string[]> {
    // Проверка прав доступа
    if (userRole === UserRole.SELLER && userShopId !== shopId) {
      throw new ForbiddenException('Нет доступа к категориям этого магазина');
    }

    const products = await this.productRepository.find({
      where: { shopId },
      select: ['category'],
    });

    const categories = products
      .map((p) => p.category)
      .filter((c) => c !== null && c !== undefined && c !== '')
      .filter((value, index, self) => self.indexOf(value) === index);

    return categories.sort();
  }

  async getLowStockProducts(
    shopId: number,
    threshold: number = 10,
    userRole: UserRole,
    userShopId?: number,
  ): Promise<Product[]> {
    // Проверка прав доступа
    if (userRole === UserRole.SELLER && userShopId !== shopId) {
      throw new ForbiddenException('Нет доступа к товарам этого магазина');
    }

    return this.productRepository.find({
      where: {
        shopId,
        quantity: LessThan(threshold),
      },
      relations: ['shop'],
      order: { quantity: 'ASC' },
    });
  }

  // Оптимизированная статистика для дашборда админ панели
  async getDashboardStats() {
    const totalProducts = await this.productRepository.count({
      where: { deletedAt: null as any },
    });
    return { totalProducts };
  }
}
