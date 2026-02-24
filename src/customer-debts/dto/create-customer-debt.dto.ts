import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsInt,
  IsDateString,
} from 'class-validator';

export class CreateCustomerDebtDto {
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  debtDate: string;

  @IsInt()
  @IsNotEmpty()
  shopId: number;
}
