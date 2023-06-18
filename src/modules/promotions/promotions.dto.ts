import {
  DISCOUNT_FOR,
  TYPE_PROMOTIONS,
} from '@/entities/promotion/promotion.entity';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(TYPE_PROMOTIONS)
  @IsNotEmpty()
  typePromotion: string;

  @IsString()
  @IsOptional()
  code: string;

  @IsEnum(DISCOUNT_FOR)
  @IsNotEmpty()
  discountFor: string;

  @IsNumber()
  value: number;

  @IsNumber()
  @IsOptional()
  maxValue: number;

  @IsNumber()
  @IsOptional()
  maxUsedTimes: number;

  @IsString()
  @IsOptional()
  expiredAt: string;
}

export class UpdateStatusPromotion {
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}
