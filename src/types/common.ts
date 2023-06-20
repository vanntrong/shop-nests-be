export interface UserExtractFromToken {
  id: string;
  email: string;
  iat: number;
  exp: number;
  rfToken?: string;
}

import { PaginationDto } from '@/validations/common';

export interface PaginationResult<T> {
  message?: string;
  offset: number;
  limit: number;
  total: number;
  data: T[];
  hasNext: boolean;
}

export type ErrorResponse = {
  message: string;
  code: number;
  error: string;
  detail: string;
};

export interface Result<T> {
  message: string;
  data: T;
}

export type Query = Pick<
  PaginationDto,
  'limit' | 'offset' | 'sortBy' | 'sortOrder'
>;

export type Filter = Omit<
  PaginationDto,
  'limit' | 'offset' | 'sortBy' | 'sortOrder'
> &
  Record<string, string | number | Array<string>>;
