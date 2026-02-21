import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  IsInt,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @IsInt()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsString()
  size?: string; // Для одежды: S, M, L, XL и т.д.

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number; // Для продуктов: вес в кг

  @IsInt()
  @IsNotEmpty()
  shopId: number;
}
