import { User } from '@/entities/user/user.entity';
import { omit } from 'lodash';

export const $toUserResponse = (user: User) => {
  return omit(user, 'password');
};
