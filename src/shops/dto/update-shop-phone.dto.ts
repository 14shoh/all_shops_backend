import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateShopPhoneDto {
  // Разрешаем null/пустое значение (очистка), но в запросе это будет строка.
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;
}

