import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  thumbnailUrl: string;

  @IsNumber()
  price: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsUUID('4')
  @IsNotEmpty()
  categoryId: string;

  @IsNumber()
  @IsOptional()
  salePrice: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  weight: number;

  @IsNumber()
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
  price: number;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  categoryId: string;

  @IsNumber()
  @IsOptional()
  salePrice: number;

  @IsNumber()
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
