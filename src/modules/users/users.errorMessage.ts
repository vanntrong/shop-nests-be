import { ErrorResponse } from '@/types/common';
import { HttpStatus } from '@nestjs/common';

export const UserErrorMessage: Record<string, ErrorResponse> = {
  user_not_found: {
    message: 'User not found',
    code: HttpStatus.NOT_FOUND,
    error: 'user-001',
    detail: 'Ensure that the user is correct.',
  },

  forbidden: {
    message: 'Not allowed',
    code: HttpStatus.FORBIDDEN,
    error: 'user-002',
    detail: 'You are not allowed to attack this resource.',
  },
};
