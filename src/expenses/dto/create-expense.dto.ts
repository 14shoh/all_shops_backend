import {
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  IsInt,
} from 'class-validator';

export class CreateExpenseDto {
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsInt()
  @IsNotEmpty()
  shopId: number;
}
