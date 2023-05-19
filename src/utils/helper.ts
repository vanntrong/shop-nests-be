import { PaginationDto } from '@/validations/common';
import { omit, pick, replace } from 'lodash';

// Delay function
export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Generating a random integer
export async function randomInt(min: number, max: number): Promise<number> {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * It takes a filename, replaces spaces with dashes, adds a timestamp, and returns the new filename
 * @param {string} filename - string - The name of the file you want to rename.
 */
export const getFileName = (filename: string): string => {
  const fileReplaceSpace = replace(filename, / /g, '-');
  return (
    fileReplaceSpace.split('.')[0] +
    '-' +
    Date.now() +
    '.' +
    fileReplaceSpace.split('.')[1]
  );
};

/* Taking a query object and returning a new object with the query and filter properties. */
export const generateQuery = (query: PaginationDto) => {
  const _query = pick(query, ['offset', 'limit', 'sortBy', 'sortOrder']);
  const _filter = omit(query, ['offset', 'limit', 'sortBy', 'sortOrder']);

  return {
    query: _query,
    filter: _filter,
  };
};
