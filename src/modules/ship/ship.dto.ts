import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class GetFeeShipDto {
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
  street: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsNumberString()
  @IsNotEmpty()
  weight: string;

  @IsEnum(['xteam', 'none'])
  deliver_option: string;

  @IsNumberString()
  @IsOptional()
  value: string;
}
