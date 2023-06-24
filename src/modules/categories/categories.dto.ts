import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsUUID('4')
  @IsOptional()
  @ValidateIf((object, value) => value !== undefined)
  parentId: string;
}

export class UpdateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @ValidateIf((object, value) => value !== null && value !== undefined)
  @IsUUID('4')
  parentId: string;

  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;

  @IsBoolean()
  @IsNotEmpty()
  isAtSidebar: boolean;

  @IsBoolean()
  @IsNotEmpty()
  isShowAtHome: boolean;
}
