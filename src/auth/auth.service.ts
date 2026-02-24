import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private logsService: LogsService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Пользователь заблокирован');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto, ip?: string) {
    const user = await this.validateUser(loginDto.username, loginDto.password);

    this.logsService.log(user.id, 'login', 'Вход в систему', ip).catch(() => {});

    const payload = {
      username: user.username,
      sub: user.id,
      role: user.role,
      shopId: user.shopId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        shopId: user.shopId,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { username: registerDto.username },
    });

    if (existingUser) {
      throw new ConflictException('Пользователь с таким логином уже существует');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);

    const { password: _, ...result } = savedUser;

    return result;
  }

  async generateCredentials(role: UserRole, shopId?: number): Promise<{
    username: string;
    password: string;
  }> {
    const username = await this.generateUniqueUsername(role);
    const password = this.generatePassword();
    return { username, password };
  }

  async generateUniqueUsername(role: UserRole): Promise<string> {
    // Генерируем уникальный username
    let username = this.generateUsername(role);
    let attempts = 0;
    const maxAttempts = 10;

    // Проверяем уникальность username
    while (attempts < maxAttempts) {
      const existingUser = await this.userRepository.findOne({
        where: { username },
      });

      if (!existingUser) {
        return username; // Username уникален
      }

      // Генерируем новый username
      username = this.generateUsername(role);
      attempts++;
    }

    throw new ConflictException('Не удалось сгенерировать уникальный логин');
  }

  private generateUsername(role: UserRole): string {
    const prefix = role === UserRole.SELLER ? 'seller' : 'owner';
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${random}`;
  }

  generatePassword(): string {
    const length = 12;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }
}
