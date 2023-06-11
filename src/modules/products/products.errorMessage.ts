import { ErrorResponse } from '@/types/common';
import { HttpStatus } from '@nestjs/common';

export const ProductErrorMessage: Record<string, ErrorResponse> = {
  product_exist: {
    message: 'Product already exist',
    code: HttpStatus.CONFLICT,
    error: 'product-001',
    detail: 'Ensure that the product is correct.',
  },
  product_not_found: {
    message: 'Product not found',
    code: HttpStatus.NOT_FOUND,
    error: 'product-002',
    detail: 'Ensure that the product is correct.',
  },
};
