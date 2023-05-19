import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  lastName: string;

  @IsPhoneNumber('VN')
  @IsOptional()
  phone: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  avatar: string;

  // @IsBoolean()
  // @IsOptional()
  // isVerified: boolean;

  // @IsNumber()
  // @IsNotEmpty()
  // @IsOptional()
  // coin: number;

  // @IsNumber()
  // @IsNotEmpty()
  // @IsOptional()
  // point: number;

  // @IsString({
  //   each: true,
  // })
  // @IsNotEmpty()
  // @IsOptional()
  // roles: string[];

  @IsOptional()
  address: CreateAddressDto[];
}

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty()
  apartmentNumber: string;

  @IsString()
  @IsNotEmpty()
  addressLine: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  region: string;

  @IsBoolean()
  @IsOptional()
  isDefault: boolean;
}
