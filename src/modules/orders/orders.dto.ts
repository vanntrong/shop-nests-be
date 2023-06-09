import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsPhoneNumber('VN')
  @IsNotEmpty()
  phone: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  province: string;

  @IsString()
  @IsNotEmpty()
  district: string;

  @IsString()
  @IsNotEmpty()
  ward: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  note: string;

  @IsEnum(['xteam', 'none'])
  deliver_option: string;

  @IsNumber()
  @IsOptional()
  pointUsed?: number;

  @IsString()
  @IsOptional()
  promotionCode?: string;

  @IsArray()
  @ValidateNested({ each: true })
  products: CreateOrderProductDto[];
}

export class CreateOrderProductDto {
  @IsUUID('4')
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}

export class UpdateShipmentDto {
  @IsString()
  @IsNotEmpty()
  partner_id: string;

  @IsString()
  reason: string;

  @IsNumber({
    allowNaN: false,
  })
  fee: number;

  @IsNumber({
    allowNaN: false,
  })
  status_id: number;

  @IsString()
  reason_code: string;
}
