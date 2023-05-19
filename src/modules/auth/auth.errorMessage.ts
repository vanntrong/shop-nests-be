import { HttpStatus } from '@nestjs/common';

const AuthErrorResponse = {
  incorrect_username_or_password: {
    code: HttpStatus.UNAUTHORIZED,
    error: 'auth-001',
    message: 'Wrong email or password',
    detail: 'Ensure that the email and password are correct.',
  },

  user_already_exist: {
    code: HttpStatus.CONFLICT,
    error: 'auth-002',
    message: 'User already exist',
    detail: 'User with the same email already exist.',
  },

  invalid_token: {
    code: HttpStatus.UNAUTHORIZED,
    error: 'auth-003',
    message: 'Invalid token',
    detail: 'Ensure that the token is correct.',
  },
};

export default AuthErrorResponse;
