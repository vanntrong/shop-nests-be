import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class AuthLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class AuthRegisterDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsPhoneNumber('VI')
  @IsNotEmpty()
  phone: string;
}

export class AuthVerifyDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class AuthUpdatePassword {
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
