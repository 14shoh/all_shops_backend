import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShopSettings } from './entities/shop-settings.entity';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class ShopSettingsService {
  constructor(
    @InjectRepository(ShopSettings)
    private shopSettingsRepository: Repository<ShopSettings>,
  ) {}

  async getSettings(
    shopId: number,
    userRole: UserRole,
  ): Promise<ShopSettings> {
    let settings = await this.shopSettingsRepository.findOne({
      where: { shopId },
      relations: ['shop'],
    });

    // Если настройки не найдены, создаем их с дефолтными значениями
    if (!settings) {
      settings = this.shopSettingsRepository.create({
        shopId,
        enableSizes: true,
        enableWeight: true,
        enableBarcode: true,
        enableCategories: true,
        paymentAccountNumber: null,
      });
      settings = await this.shopSettingsRepository.save(settings);
    }

    return settings;
  }

  async updateSettings(
    shopId: number,
    updateData: Partial<ShopSettings>,
    userRole: UserRole,
  ): Promise<ShopSettings> {
    // Изменять настройки может владелец магазина или администратор приложения
    if (userRole !== UserRole.SHOP_OWNER && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Только владелец магазина может изменять настройки оплаты',
      );
    }

    let settings = await this.shopSettingsRepository.findOne({
      where: { shopId },
    });

    // Если настройки не найдены, создаем их с дефолтными значениями
    if (!settings) {
      settings = this.shopSettingsRepository.create({
        shopId,
        enableSizes: true,
        enableWeight: true,
        enableBarcode: true,
        enableCategories: true,
        paymentAccountNumber: null,
      });
    }

    Object.assign(settings, updateData);
    return this.shopSettingsRepository.save(settings);
  }

  async getPaymentAccount(shopId: number): Promise<{ paymentAccountNumber: string | null }> {
    let settings = await this.shopSettingsRepository.findOne({
      where: { shopId },
      select: ['paymentAccountNumber'],
    });

    // Если настройки не найдены, создаем их с дефолтными значениями
    if (!settings) {
      settings = this.shopSettingsRepository.create({
        shopId,
        enableSizes: true,
        enableWeight: true,
        enableBarcode: true,
        enableCategories: true,
        paymentAccountNumber: null,
      });
      settings = await this.shopSettingsRepository.save(settings);
    }

    return {
      paymentAccountNumber: settings?.paymentAccountNumber || null,
    };
  }
}
