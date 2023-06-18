import { ErrorResponse } from '@/types/common';
import { HttpStatus } from '@nestjs/common';

export const PromotionErrorMessage: Record<string, ErrorResponse> = {
  promotion_not_found: {
    message: 'Promotion not found',
    code: HttpStatus.NOT_FOUND,
    error: 'promotion-001',
    detail: 'Ensure that the promotion is correct.',
  },
  promotion_expired: {
    message: 'Promotion expired',
    code: HttpStatus.BAD_REQUEST,
    error: 'promotion-002',
    detail: 'This promotion has been expired.',
  },
  promotion_max_used: {
    message: 'Promotion max used',
    code: HttpStatus.BAD_REQUEST,
    error: 'promotion-003',
    detail: 'This promotion has reached the maximum number of uses.',
  },
};
