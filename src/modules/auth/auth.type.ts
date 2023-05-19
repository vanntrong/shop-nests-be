import { User } from '@/entities/user/user.entity';

export interface AuthLoginResponse {
  message: string;
  data: Omit<User, 'password'>;
  tokens: {
    access_token: string;
    refresh_token: string;
    exp: number;
  };
}
