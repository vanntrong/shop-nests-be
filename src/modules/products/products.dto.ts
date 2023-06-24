import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  thumbnailUrl: string;

  @IsNumberString()
  @IsNotEmpty()
  price: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsUUID('4')
  @IsNotEmpty()
  categoryId: string;

  @IsNumberString()
  @IsOptional()
  salePrice: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumberString()
  @IsNotEmpty()
  weight: number;

  @IsNumberString()
  @IsNotEmpty()
  inventory: number;

  @IsString()
  @IsNotEmpty()
  detailDescription: string;

  @IsString()
  @IsOptional()
  @IsDateString()
  saleEndAt: Date;

  @IsArray()
  @IsString({
    each: true,
  })
  @IsNotEmpty()
  images: string[];
}

export class UpdateProductDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  thumbnailUrl: string;

  @IsNumber()
  @IsOptional()
  price: number;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  categoryId: string;

  @IsNumberString()
  @IsOptional()
  salePrice: number;

  @IsNumber()
  @IsNotEmpty()
  weight: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  detailDescription: string;

  @IsString()
  @IsOptional()
  saleEndAt: string;

  @IsArray()
  @IsString({
    each: true,
  })
  @IsNotEmpty()
  @IsOptional()
  images: string[];

  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}
