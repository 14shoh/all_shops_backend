import { IsOptional, IsString, IsInt } from 'class-validator';

export class FindProductsDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  search?: string; // Поиск по названию или штрихкоду

  @IsOptional()
  @IsInt()
  shopId?: number;
}
