import { IsOptional, IsBoolean, IsString, MaxLength } from 'class-validator';

export class UpdateShopSettingsDto {
  @IsOptional()
  @IsBoolean()
  enableSizes?: boolean;

  @IsOptional()
  @IsBoolean()
  enableWeight?: boolean;

  @IsOptional()
  @IsBoolean()
  enableBarcode?: boolean;

  @IsOptional()
  @IsBoolean()
  enableCategories?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentAccountNumber?: string;
}
