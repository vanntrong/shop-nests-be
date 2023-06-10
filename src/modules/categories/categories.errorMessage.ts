import { ErrorResponse } from '@/types/common';
import { HttpStatus } from '@nestjs/common';

export const CategoryErrorMessage: Record<string, ErrorResponse> = {
  category_exist: {
    message: 'Category already exist',
    code: HttpStatus.CONFLICT,
    error: 'category-001',
    detail: 'Ensure that the category is correct.',
  },
  category_not_found: {
    message: 'Category not found',
    code: HttpStatus.NOT_FOUND,
    error: 'category-002',
    detail: 'Ensure that the category is correct.',
  },
};
