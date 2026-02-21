import { PartialType } from '@nestjs/mapped-types';
import { CreateShopDto } from './create-shop.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateShopDto extends PartialType(CreateShopDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
