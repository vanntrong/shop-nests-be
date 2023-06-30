import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class UpdateCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  cartProducts: CartProductDto[];
}

export class CartProductDto {
  @IsUUID('4')
  @IsNotEmpty()
  id: string;

  @IsNumber()
  quantity: string;
}
