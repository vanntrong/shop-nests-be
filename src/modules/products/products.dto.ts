import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  thumbnailUrl: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsNumber()
  @IsOptional()
  salePrice: number;

  @IsString()
  @IsNotEmpty()
  name: string;

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
  @IsNotEmpty()
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

  @IsNumber()
  @IsOptional()
  @IsOptional()
  salePrice: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
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
  @IsOptional()
  images: string[];
}
