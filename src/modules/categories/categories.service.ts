import { Category } from '@/entities/category/category.entity';
import { Filter, PaginationResult, Query, Result } from '@/types/common';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto';
import { generateSlug } from '@/utils/slug';
import { CategoryErrorMessage } from './categories.errorMessage';
import { omit } from 'lodash';

@Injectable()
export class CategoriesService {
  logger: Logger;
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {
    this.logger = new Logger(CategoriesService.name);
  }

  /**
   * This is an asynchronous function that retrieves categories from a database based on a query and
   * filter, and returns them along with pagination information.
   * @param {Query} query - The `query` parameter is an object that contains optional properties used
   * for pagination and sorting. It has the following properties:
   * @param {Filter} filter - The `filter` parameter is an object that contains filtering options for
   * the query. It has a property `keyword` which is a string used to search for categories by name or
   * slug. Other properties in the `filter` object may be used to filter categories based on other
   * criteria.
   * @returns An object with the properties `message`, `offset`, `limit`, `total`, `hasNext`, and
   * `data`. The `message` property contains the string "Successful". The `offset` and `limit`
   * properties contain the values passed in the `query` parameter or their default values if not
   * provided. The `total` property contains the total number of categories that match the query and
   * filter
   */
  async getAll(
    query: Query,
    filter: Filter,
  ): Promise<PaginationResult<Category>> {
    try {
      const { offset = 0, limit = 10, sortBy, sortOrder } = query;
      const { keyword = '', ..._filter } = filter;

      const [categories, count] = await this.categoryRepository
        .createQueryBuilder('category')
        .where({ ..._filter, isDeleted: false })
        .andWhere('category.name ILIKE :keyword', { keyword: `%${keyword}%` })
        .orWhere('category.slug ILIKE :keyword', { keyword: `%${keyword}%` })
        .where('category.parentCategory IS NULL')
        .leftJoinAndSelect('category.subCategories', 'children')
        .leftJoinAndSelect('children.subCategories', 'childrensub')
        .skip(offset)
        .take(limit)
        .orderBy(
          `category.${sortBy || 'createdAt'}`,
          sortOrder === 'asc' ? 'ASC' : 'DESC',
        )
        .getManyAndCount();

      this.logger.log(`Get all users :: ${JSON.stringify({ query, filter })}`);

      return {
        message: 'Successful',
        offset,
        limit,
        total: count,
        hasNext: count > offset + limit,
        data: categories,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  /**
   * This function creates a new category with a unique slug and optional parent category, and returns
   * the created category without its parent category.
   * @param {CreateCategoryDto} body - CreateCategoryDto object, which contains the data needed to
   * create a new category, such as name, description, and parentId (optional).
   * @returns an object with two properties: "message" and "data". The "message" property contains the
   * string "Successful", and the "data" property contains the category object with the
   * "parentCategory" property omitted.
   */
  async create(body: CreateCategoryDto) {
    try {
      const slug = generateSlug(body.name);
      const isCategoryExist = await this.$isExist(slug);

      if (isCategoryExist) {
        throw new HttpException(
          CategoryErrorMessage['category_exist'],
          HttpStatus.CONFLICT,
        );
      }

      let parentCategory: Category;

      if (body.parentId) {
        parentCategory = await this.categoryRepository.findOne({
          where: { id: body.parentId, isDeleted: false },
        });
      }

      const category = await this.categoryRepository.save({
        ...body,
        slug,
      });
      category.parentCategory = parentCategory;
      await this.categoryRepository.save(category);

      this.logger.log(`Create category :: ${JSON.stringify(category)}`);
      return {
        message: 'Successful',
        data: omit(category, 'parentCategory'),
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  /* The `async update(id: string, body: UpdateCategoryDto)` function is a method of the
  `CategoriesService` class that updates an existing category in the database. It takes two
  parameters: `id`, which is the ID of the category to be updated, and `body`, which is an object
  containing the updated data for the category. */
  async update(id: string, body: UpdateCategoryDto): Promise<Result<Category>> {
    try {
      const isExist = await this.$isExist(id);

      if (!isExist) {
        throw new HttpException(
          CategoryErrorMessage['category_not_found'],
          HttpStatus.CONFLICT,
        );
      }

      const slug = generateSlug(body.name);
      const newCategory = await this.categoryRepository
        .createQueryBuilder()
        .update(Category)
        .set({
          ...body,
          slug,
        })
        .where('id = :id', { id })
        .returning('*')
        .execute();

      this.logger.log(`Update category :: ${JSON.stringify(newCategory)}`);

      return {
        message: 'Successful',
        data: newCategory.raw[0],
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const isExist = await this.$isExist(id);

      if (!isExist) {
        throw new HttpException(
          CategoryErrorMessage['category_not_found'],
          HttpStatus.CONFLICT,
        );
      }

      const category = await this.categoryRepository
        .createQueryBuilder()
        .update(Category)
        .set({ isDeleted: true })
        .where('id = :id', { id })
        .execute();

      this.logger.log(`Delete category :: ${JSON.stringify(category)}`);
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  /**
   * This is an asynchronous function that checks if a category exists based on its slug or ID.
   * @param {string} slugOrId - A string parameter that can either be a category slug or a category ID.
   * @returns a boolean value indicating whether a category with the given `slugOrId` exists in the
   * database or not. The function first tries to find a category with the given `slugOrId` by checking
   * if there is a category with the given `slug` or `id` and is not deleted. If a category is found,
   * the function returns `true`, otherwise it returns `
   */
  async $isExist(slugOrId: string) {
    try {
      const count = await this.categoryRepository.count({
        where: [
          { slug: slugOrId, isDeleted: false },
          { id: slugOrId, isDeleted: false },
        ],
      });

      return !!count;
    } catch (error) {
      this.logger.error(error.message);
    }
  }
}
