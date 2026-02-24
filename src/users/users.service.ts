import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthService } from '../auth/auth.service';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private authService: AuthService,
    private logsService: LogsService,
  ) {}

  async create(createUserDto: CreateUserDto, adminId: number) {
    // Проверка прав: только админ может создавать пользователей
    const admin = await this.userRepository.findOne({
      where: { id: adminId },
    });

    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Только администратор может создавать пользователей');
    }

    // Генерация логина и пароля, если не указаны
    let username = createUserDto.username;
    let password = createUserDto.password;
    let originalPassword = password; // Сохраняем оригинальный пароль для возврата

    // Генерируем username, если не указан
    if (!username) {
      username = await this.authService.generateUniqueUsername(createUserDto.role);
    } else {
      // Проверка на дубликат логина, если username указан
      const existingUser = await this.userRepository.findOne({
        where: { username },
      });

      if (existingUser) {
        throw new ConflictException('Пользователь с таким логином уже существует');
      }
    }

    // Генерируем password, если не указан
    if (!password) {
      password = this.authService.generatePassword();
      originalPassword = password; // Сохраняем сгенерированный пароль
    } else {
      // Сохраняем оригинальный пароль перед хешированием
      originalPassword = password;
      // Хеширование пароля
      password = await bcrypt.hash(password, 10);
    }

    const user = this.userRepository.create({
      ...createUserDto,
      username,
      password,
    });

    const savedUser = await this.userRepository.save(user);

    this.logsService.log(adminId, 'create_user', `Создан пользователь "${savedUser.username}" (роль: ${savedUser.role})`).catch(() => {});

    // Возвращаем пользователя с оригинальным паролем (только при создании)
    return {
      id: savedUser.id,
      username: savedUser.username,
      password: originalPassword, // Возвращаем оригинальный пароль
      role: savedUser.role,
      fullName: savedUser.fullName,
      email: savedUser.email,
      phone: savedUser.phone,
      shopId: savedUser.shopId,
      isActive: savedUser.isActive,
      createdAt: savedUser.createdAt,
    };
  }

  async findAll(adminId: number, shopId?: number): Promise<User[]> {
    const admin = await this.userRepository.findOne({
      where: { id: adminId },
    });

    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Только администратор может просматривать всех пользователей');
    }

    const where: any = {};
    if (shopId) {
      where.shopId = shopId;
    }

    return this.userRepository.find({
      where,
      relations: ['shop'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByShop(shopId: number): Promise<User[]> {
    return this.userRepository.find({
      where: { shopId },
      relations: ['shop'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['shop'],
    });

    if (!user) {
      throw new NotFoundException(`Пользователь с ID ${id} не найден`);
    }

    return user;
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    adminId: number,
  ): Promise<User> {
    const admin = await this.userRepository.findOne({
      where: { id: adminId },
    });

    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Только администратор может редактировать пользователей');
    }

    const user = await this.findOne(id);

    // Обновление пароля, если указан
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Проверка на дубликат логина при обновлении
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: updateUserDto.username },
      });

      if (existingUser) {
        throw new ConflictException('Пользователь с таким логином уже существует');
      }
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async block(id: number, adminId: number): Promise<User> {
    const admin = await this.userRepository.findOne({
      where: { id: adminId },
    });

    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Только администратор может блокировать пользователей');
    }

    const user = await this.findOne(id);
    user.isActive = false;
    const saved = await this.userRepository.save(user);
    this.logsService.log(adminId, 'block_user', `Заблокирован пользователь "${user.username}" (ID ${id})`).catch(() => {});
    return saved;
  }

  async unblock(id: number, adminId: number): Promise<User> {
    const admin = await this.userRepository.findOne({
      where: { id: adminId },
    });

    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Только администратор может разблокировать пользователей');
    }

    const user = await this.findOne(id);
    user.isActive = true;
    const saved = await this.userRepository.save(user);
    this.logsService.log(adminId, 'unblock_user', `Разблокирован пользователь "${user.username}" (ID ${id})`).catch(() => {});
    return saved;
  }

  async remove(id: number, adminId: number): Promise<void> {
    const admin = await this.userRepository.findOne({
      where: { id: adminId },
    });

    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Только администратор может удалять пользователей');
    }

    const user = await this.findOne(id);
    const username = user.username;
    await this.userRepository.softDelete(id);
    this.logsService.log(adminId, 'delete_user', `Удалён пользователь "${username}" (ID ${id})`).catch(() => {});
  }

  async regenerateCredentials(id: number, adminId: number) {
    const admin = await this.userRepository.findOne({
      where: { id: adminId },
    });

    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Только администратор может генерировать учетные данные');
    }

    const user = await this.findOne(id);

    const credentials = await this.authService.generateCredentials(
      user.role,
      user.shopId,
    );

    // Обновляем пользователя с новыми учетными данными
    user.username = credentials.username;
    user.password = await bcrypt.hash(credentials.password, 10);
    await this.userRepository.save(user);

    return {
      id: user.id,
      username: credentials.username,
      password: credentials.password,
      role: user.role,
    };
  }

  // Оптимизированная статистика для дашборда админ панели
  async getDashboardStats() {
    const totalUsers = await this.userRepository.count();
    return { totalUsers };
  }
}
