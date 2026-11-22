import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ProductImageDto {
  @IsString()
  url!: string;

  @IsString()
  key!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
