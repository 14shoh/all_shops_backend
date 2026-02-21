import { IsInt, IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInventoryItemDto {
  @IsInt()
  @IsNotEmpty()
  productId: number;

  @IsInt()
  @IsNotEmpty()
  expectedQuantity: number;

  @IsInt()
  @IsNotEmpty()
  actualQuantity: number;
}

export class CreateInventoryDto {
  @IsInt()
  @IsNotEmpty()
  shopId: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInventoryItemDto)
  items: CreateInventoryItemDto[];
}
