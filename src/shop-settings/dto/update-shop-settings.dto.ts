import { IsOptional, IsBoolean } from 'class-validator';

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
}
