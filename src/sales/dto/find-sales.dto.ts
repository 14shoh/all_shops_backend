import { IsOptional, IsInt, IsDateString, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class FindSalesDto {
  @IsOptional()
  @IsInt()
  shopId?: number;

  // seller: только продажи текущего продавца (по умолчанию для роли seller)
  // shop: все продажи магазина (в пределах user.shopId)
  @IsOptional()
  @IsIn(['seller', 'shop'])
  scope?: 'seller' | 'shop';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1; // Номер страницы (начинается с 1)

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50; // Количество продаж на странице (макс 200 для безопасности)
}
