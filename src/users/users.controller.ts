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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto, @CurrentUser() user: any) {
    return this.usersService.create(createUserDto, user.id);
  }

  @Get()
  findAll(
    @Query('shopId') shopId?: string,
    @CurrentUser() user?: any,
  ) {
    const shopIdNumber = shopId ? parseInt(shopId, 10) : undefined;
    return this.usersService.findAll(user.id, shopIdNumber);
  }

  @Get('shop/:shopId')
  findByShop(@Param('shopId', ParseIntPipe) shopId: number) {
    return this.usersService.findByShop(shopId);
  }

  @Get('dashboard/stats')
  getDashboardStats() {
    return this.usersService.getDashboardStats();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.update(id, updateUserDto, user.id);
  }

  @Patch(':id/block')
  block(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.usersService.block(id, user.id);
  }

  @Patch(':id/unblock')
  unblock(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.usersService.unblock(id, user.id);
  }

  @Patch(':id/regenerate-credentials')
  regenerateCredentials(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.usersService.regenerateCredentials(id, user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.usersService.remove(id, user.id);
  }
}
