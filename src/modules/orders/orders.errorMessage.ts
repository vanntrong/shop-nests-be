import { ErrorResponse } from '@/types/common';
import { HttpStatus } from '@nestjs/common';

export const OrderErrorMessage: Record<string, ErrorResponse> = {
  product_not_available: {
    message: 'Product is not available',
    code: HttpStatus.BAD_REQUEST,
    error: 'order-001',
    detail: "Some product is not available or don't have enough quantity.",
  },
  order_not_found: {
    message: 'Order not found',
    code: HttpStatus.NOT_FOUND,
    error: 'order-002',
    detail: 'Order not found',
  },
  not_enough_point: {
    message: 'Not enough point',
    code: HttpStatus.BAD_REQUEST,
    error: 'order-003',
    detail: 'Not enough point',
  },
};
