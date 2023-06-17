import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  username: string;

  @IsPhoneNumber('VN')
  @IsOptional()
  phone: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  avatar: string;
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsPhoneNumber('VN')
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  avatar: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsBoolean()
  @IsOptional()
  isVerified: boolean;
}
