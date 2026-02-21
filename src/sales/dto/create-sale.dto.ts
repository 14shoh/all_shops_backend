import {
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsInt,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSaleItemDto {
  @IsInt()
  @IsNotEmpty()
  productId: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  salePrice: number;
}

export class CreateSaleDto {
  @IsInt()
  @IsNotEmpty()
  shopId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  @IsNotEmpty()
  items: CreateSaleItemDto[];
}
