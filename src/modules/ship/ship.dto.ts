import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
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

  @IsNumber()
  weight: string;

  @IsEnum(['xteam', 'none'])
  deliver_option: string;

  @IsNumber()
  @IsOptional()
  value: string;
}
export class CreateShipOrderDto {
  @IsString()
  @IsNotEmpty()
  id: string; // our service order id

  /**
   * Tên người liên hệ lấy hàng hóa
   */
  @IsString()
  @IsNotEmpty()
  pick_name: string;

  /**
   * Địa chỉ ngắn gọn để lấy nhận hàng hóa
   */
  @IsString()
  @IsNotEmpty()
  pick_address: string;

  /**
   * Tên tỉnh/thành phố nơi lấy hàng hóa
   */
  @IsString()
  @IsNotEmpty()
  pick_province: string;

  /**
   * Tên quận/huyện nơi lấy hàng hóa
   */
  @IsString()
  @IsNotEmpty()
  pick_district: string;

  /**
   *  Tên phường/xã nơi lấy hàng hóa
   */
  @IsString()
  @IsNotEmpty()
  pick_ward: string;

  /**
   * Số điện thoại liên hệ nơi lấy hàng hóa
   */
  @IsString()
  @IsNotEmpty()
  pick_tel: string;

  /**
   * Số điện thoại người nhận hàng hóa
   */
  @IsString()
  @IsNotEmpty()
  tel: string;

  /**
   * tên người nhận hàng
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * Địa chỉ chi tiết của người nhận hàng
   */
  @IsString()
  @IsNotEmpty()
  address: string;

  /**
   * Tên tỉnh/thành phố của người nhận hàng hóa
   */
  @IsString()
  @IsNotEmpty()
  province: string;

  /**
   * Tên quận/huyện của người nhận hàng hóa
   */
  @IsString()
  @IsNotEmpty()
  district: string;

  /**
   * Tên phường/xã của người nhận hàng hóa (Bắt buộc khi không có đường/phố)
   */
  @IsString()
  @IsNotEmpty()
  ward: string;

  /**
   * Tên thôn/ấp/xóm/tổ/… của người nhận hàng hóa. Nếu không có, vui lòng điền “Khác”
   */
  @IsString()
  @IsNotEmpty()
  hamlet: string;

  /**
   * Freeship cho người nhận hàng.
   * Nếu bằng 1 COD sẽ chỉ thu người nhận hàng số tiền bằng pick_money, nếu bằng 0 COD sẽ thu tiền người nhận số tiền bằng pick_money + phí ship của đơn hàng,
   * giá trị mặc định bằng 0
   */
  @IsEnum([0, 1])
  @IsNotEmpty()
  is_freeship: number;

  // @IsString()
  // @IsNotEmpty()
  // pick_date: string;

  /**
   * Số tiền CoD
   */
  @IsNumber()
  @IsNotEmpty()
  pick_money: number;

  /**
   * Ghi chú đơn hàng. Vd: Khối lượng tính cước tối đa: 1.00 kgTừ 24/2/2020 ghi chú tối đa cho phép là 120 kí tự
   */
  @IsString()
  @IsNotEmpty()
  note: string;

  /**
   * Giá trị đóng bảo hiểm, là căn cứ để tính phí bảo hiểm và bồi thường khi có sự cố.
   */
  @IsNumber()
  @IsNotEmpty()
  value: number;

  @IsEnum(['road', 'fly'])
  @IsNotEmpty()
  transport: string;

  @IsEnum(['xteam', 'none'])
  @IsNotEmpty()
  deliver_option: string;
}

export class CreateShipDto {
  @IsArray()
  @ValidateNested({ each: true })
  products: CreateShipProductDto[];

  @ValidateNested()
  order: CreateShipOrderDto;
}

export class CreateShipProductDto {
  name: string;
  weight: number;
  quantity: number;
  product_code: number;
}
