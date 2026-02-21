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
    const settings = await this.shopSettingsRepository.findOne({
      where: { shopId },
      relations: ['shop'],
    });

    if (!settings) {
      throw new NotFoundException(`Настройки для магазина с ID ${shopId} не найдены`);
    }

    return settings;
  }

  async updateSettings(
    shopId: number,
    updateData: Partial<ShopSettings>,
    userRole: UserRole,
  ): Promise<ShopSettings> {
    // Только администратор может изменять настройки
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Только администратор может изменять настройки магазина');
    }

    const settings = await this.getSettings(shopId, userRole);

    Object.assign(settings, updateData);
    return this.shopSettingsRepository.save(settings);
  }
}
