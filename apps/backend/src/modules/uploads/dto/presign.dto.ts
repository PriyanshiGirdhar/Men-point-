import { IsString, MinLength } from 'class-validator';

export class PresignDto {
  @IsString()
  @MinLength(1)
  fileName!: string;

  @IsString()
  @MinLength(1)
  contentType!: string;
}
