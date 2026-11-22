import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ProductVariantDto {
  @IsString()
  size!: string;

  @IsString()
  color!: string;

  @IsOptional()
  @IsString()
  colorHex?: string;

  @IsString()
  sku!: string;

  @IsInt()
  @Min(0)
  stock!: number;
}
