import { ErrorResponse } from '@/types/common';
import { HttpStatus } from '@nestjs/common';

export const OrderErrorMessage: Record<string, ErrorResponse> = {
  product_not_available: {
    message: 'Product is not available',
    code: HttpStatus.BAD_REQUEST,
    error: 'order-001',
    detail: "Some product is not available or don't have enough quantity.",
  },
};
