import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Gender } from '@prisma/client';

export class OnboardingDto {
  @IsEnum(Gender)
  gender!: Gender;

  @IsOptional()
  @IsString()
  phone?: string;
}
