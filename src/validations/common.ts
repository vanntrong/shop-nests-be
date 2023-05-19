import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PaginationDto {
  @IsNotEmpty()
  offset = 0;

  @IsNotEmpty()
  limit = 10;

  @IsString()
  @IsOptional()
  sortBy: string;

  @IsString()
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder: string;

  @IsString()
  @IsOptional()
  keyword: string;
}
