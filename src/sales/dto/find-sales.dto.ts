import { IsOptional, IsInt, IsDateString } from 'class-validator';

export class FindSalesDto {
  @IsOptional()
  @IsInt()
  shopId?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
