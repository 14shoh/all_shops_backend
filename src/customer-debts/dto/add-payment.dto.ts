import { IsNumber, Min, IsNotEmpty } from 'class-validator';

export class AddPaymentDto {
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  amount: number;
}
