import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsInt,
  IsOptional,
} from 'class-validator';

export class CreateSupplierDebtDto {
  @IsString()
  @IsNotEmpty()
  supplierName: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  totalDebt: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @IsInt()
  @IsNotEmpty()
  shopId: number;
}
