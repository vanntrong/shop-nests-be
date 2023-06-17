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
      const { keyword = '', minLevel = 1, maxLevel = 3, ..._filter } = filter;

      const [categories, count] = await this.categoryRepository
        .createQueryBuilder('category')
        .where({ isDeleted: false })
        .andWhere('category.level >= :minLevel', { minLevel })
        .andWhere('category.level <= :maxLevel', { maxLevel })
        .andWhere('category.name ILIKE :keyword', { keyword: `%${keyword}%` })
        .andWhere('category.parentCategory IS NULL')
        .leftJoinAndSelect('category.subCategories', 'children')
        .leftJoinAndSelect('children.subCategories', 'childrensub')
        .andWhere('children.isDeleted = false')
        .andWhere('childrensub.isDeleted = false')
        .skip(offset)
        .take(limit)
        .orderBy(
          `category.${sortBy || 'createdAt'}`,
          sortOrder === 'asc' ? 'ASC' : 'DESC',
        )
        .getManyAndCount();

      this.logger.log(
        `Get all categories :: ${JSON.stringify({ query, filter })}`,
      );

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
      console.log({ body });
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
        level: parentCategory ? parentCategory.level + 1 : 1,
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
  async update(
    id: string,
    { parentId, ...body }: UpdateCategoryDto,
  ): Promise<Result<Category>> {
    try {
      const isExist = await this.$isExistById(id);

      if (!isExist) {
        throw new HttpException(
          CategoryErrorMessage['category_not_found'],
          HttpStatus.CONFLICT,
        );
      }

      let parentCategory: Category;

      if (parentId) {
        parentCategory = await this.categoryRepository.findOne({
          where: { id: parentId, isDeleted: false },
        });
      }

      const slug = generateSlug(body.name);
      const newCategory = await this.categoryRepository
        .createQueryBuilder()
        .update(Category)
        .set({
          ...body,
          parentCategory,
          level: parentCategory ? parentCategory.level + 1 : 1,
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
      const category = await this.categoryRepository.findOne({
        where: { id, isDeleted: false },
      });

      if (!category) {
        throw new HttpException(
          CategoryErrorMessage['category_not_found'],
          HttpStatus.CONFLICT,
        );
      }
      // delete all subcategories
      await this.categoryRepository
        .createQueryBuilder('category')
        .update(Category)
        .set({
          isDeleted: true,
          deletedAt: new Date(),
        })
        .where('id = :id', { id: category.id })
        .orWhere('parentCategory = :id', { id: category.id })
        .returning('*')
        .execute();

      this.logger.log(`Delete category :: ${JSON.stringify(category.id)}`);
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  /**
   * This function retrieves a single category from a repository based on a given slug and returns it
   * as a Promise.
   * @param {string} slug - The slug is a string parameter that is used to identify a specific category
   * in the database. It is a unique identifier for the category and is usually generated based on the
   * category name or some other relevant information. The function uses this parameter to query the
   * database and retrieve the category with the matching slug.
   * @returns This function returns a Promise that resolves to a Result object containing a message and
   * data. The data is the category object retrieved from the database based on the provided slug, and
   * the message is "Successful". If the category is not found, it throws an HttpException with a
   * message and status code. If there is an error during the execution of the function, it logs the
   * error and rethrows it.
   */
  async getOne(slug: string): Promise<Result<Category>> {
    try {
      const category = await this.categoryRepository.findOne({
        where: { slug, isDeleted: false },
      });

      if (!category) {
        throw new HttpException(
          CategoryErrorMessage['category_not_found'],
          HttpStatus.CONFLICT,
        );
      }

      this.logger.log(`Get one category :: ${JSON.stringify(category)}`);

      return {
        message: 'Successful',
        data: category,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  /**
   * This function retrieves a single category by its ID and returns it as a Promise with error
   * handling.
   * @param {string} id - a string representing the unique identifier of the category to be retrieved.
   * @returns A Promise that resolves to a Result object containing a message and data property. The
   * data property contains the category object retrieved from the database, and the message property is
   * set to 'Successful'. If the category is not found, an HttpException is thrown.
   */
  async getOneById(id: string): Promise<Result<Category>> {
    try {
      const category = await this.categoryRepository.findOne({
        where: { id, isDeleted: false },
        relations: ['parentCategory'],
      });

      if (!category) {
        throw new HttpException(
          CategoryErrorMessage['category_not_found'],
          HttpStatus.CONFLICT,
        );
      }

      this.logger.log(`Get one category :: ${JSON.stringify(category)}`);

      return {
        message: 'Successful',
        data: category,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async getParentCategories(): Promise<Result<Category[]>> {
    try {
      const query = await this.categoryRepository
        .createQueryBuilder('category')
        .where({ isDeleted: false })
        .andWhere('category.parentCategory IS NULL')
        .leftJoinAndSelect('category.subCategories', 'children')
        .andWhere('children.isDeleted = false')
        .getMany();

      //flat the array
      const flat = (categories: Category[]) => {
        if (!categories || !categories.length) return [];
        return categories.reduce((acc, category) => {
          const { subCategories, ...rest } = category;
          return [...acc, rest, ...flat(subCategories)];
        }, []);
      };

      return {
        message: 'Successful',
        data: flat(query),
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  /**
   * This is an asynchronous function that checks if a category exists based on its slug or ID.
   * @param {string} slug - A string parameter that can either be a category slug or a category ID.
   * @returns a boolean value indicating whether a category with the given `slugOrId` exists in the
   * database or not. The function first tries to find a category with the given `slugOrId` by checking
   * if there is a category with the given `slug` or `id` and is not deleted. If a category is found,
   * the function returns `true`, otherwise it returns `
   */
  async $isExist(slug: string) {
    try {
      const count = await this.categoryRepository.count({
        where: [{ slug: slug, isDeleted: false }],
      });

      return !!count;
    } catch (error) {
      this.logger.error(error.message);
    }
  }

  async $isExistById(id: string) {
    try {
      const count = await this.categoryRepository.count({
        where: [{ id: id, isDeleted: false }],
      });

      return !!count;
    } catch (error) {
      this.logger.error(error.message);
    }
  }
}
