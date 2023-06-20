import { Category } from '@/entities/category/category.entity';
import { Filter, PaginationResult, Query, Result } from '@/types/common';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto';
import { generateSlug } from '@/utils/slug';
import { CategoryErrorMessage } from './categories.errorMessage';
import { omit } from 'lodash';
import { User } from '@/entities/user/user.entity';
import { CommonService } from '../common/common.service';
import { readFile } from 'fs';

@Injectable()
export class CategoriesService {
  logger: Logger;
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly commonService: CommonService,
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
    userId?: string,
  ): Promise<PaginationResult<Category>> {
    try {
      const isAdminQuery = await this.commonService.$isAdminQuery(userId);

      const { offset = 0, limit = 10, sortBy, sortOrder } = query;
      const { keyword = '', minLevel = 1, maxLevel = 3, ..._filter } = filter;

      const [categories, count] = await this.categoryRepository
        .createQueryBuilder('category')
        .where(
          new Brackets((qb) => {
            if (!isAdminQuery) {
              qb.andWhere({
                isDeleted: false,
              });
              qb.andWhere({
                isActive: true,
              });
            }
          }),
        )
        .andWhere(_filter)
        .andWhere('category.level >= :minLevel', { minLevel })
        .andWhere('category.level <= :maxLevel', { maxLevel })
        .andWhere('category.name ILIKE :keyword', { keyword: `%${keyword}%` })
        .leftJoinAndSelect(
          'category.subCategories',
          'children',
          'children.isDeleted = false AND children.isActive = true',
        )
        .leftJoinAndSelect(
          'children.subCategories',
          'childrensub',
          'childrensub.isDeleted = false AND childrensub.isActive = true',
        )
        .leftJoinAndSelect('category.createdBy', 'createdBy')
        .leftJoinAndSelect('children.createdBy', 'childrenCreatedBy')
        .leftJoinAndSelect('childrensub.createdBy', 'childrensubCreatedBy')

        .select([
          'category',
          'children',
          'childrensub',
          'childrenCreatedBy.name',
          'childrensubCreatedBy.name',
          'createdBy.name',
        ])
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
  async create(body: CreateCategoryDto, userId: string) {
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

      const createdBy = await this.userRepository.findOne({
        where: { id: userId, isDeleted: false },
      });

      const category = await this.categoryRepository.save({
        ...body,
        slug,
        createdBy,
        parentCategory,
        level: parentCategory ? parentCategory.level + 1 : 1,
      });

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

  async restore(id: string): Promise<void> {
    try {
      await this.categoryRepository
        .createQueryBuilder('category')
        .update(Category)
        .set({
          isDeleted: false,
          deletedAt: null,
        })
        .where('id = :id', { id })
        .returning('*')
        .execute();

      return;
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
        where: { slug, isDeleted: false, isActive: true },
        relations: ['parentCategory', 'parentCategory.parentCategory'],
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
        where: { id },
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

  async getParentCategories(userId?: string): Promise<Result<Category[]>> {
    try {
      const isAdminQuery = await this.commonService.$isAdminQuery(userId);
      const query = await this.categoryRepository
        .createQueryBuilder('category')
        .where(
          new Brackets((qb) => {
            if (!isAdminQuery) {
              qb.andWhere('category.isDeleted = false').andWhere(
                'category.isActive = true',
              );
            }
          }),
        )
        .andWhere('category.parentCategory IS NULL')
        .leftJoinAndSelect('category.subCategories', 'children')
        .andWhere(
          new Brackets((qb) => {
            if (!isAdminQuery) {
              qb.andWhere('children.isDeleted = false').andWhere(
                'children.isActive = true',
              );
            }
          }),
        )

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

  async seed() {
    try {
      new Promise((resolve, reject) => {
        readFile('data.json', 'utf8', async (err, data) => {
          if (err) {
            reject(err);
          }

          const { categories = [] } = JSON.parse(data) || {};
          await Promise.all(
            categories.map(async ({ name, description, children }) => {
              const category = await this.createSeedCategory({
                name,
                description,
                parent: null,
                level: 1,
              });

              if (children && children.length > 0) {
                await Promise.all(
                  children.map(
                    async ({ name, description, children: child }) => {
                      const chilCate = await this.createSeedCategory({
                        name,
                        description,
                        parent: category,
                        level: 2,
                      });

                      if (child && child.length > 0) {
                        await Promise.all(
                          child.map(async ({ name, description }) => {
                            return await this.createSeedCategory({
                              name,
                              description,
                              parent: chilCate,
                              level: 3,
                            });
                          }),
                        );
                      }

                      return chilCate;
                    },
                  ),
                );
              }

              return category;
            }),
          );
        });
      });
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async createSeedCategory({ name, description, level, parent }: any) {
    try {
      const slug = generateSlug(name);
      console.log('seed category:::', name);
      const user = await this.userRepository.findOne({
        where: {
          id: '4487abf4-016a-48ad-9bb4-e4eb179f238e',
        },
      });
      const category = await this.categoryRepository.save({
        name,
        description,
        slug,
        parentCategory: parent,
        level,
        createdBy: user,
      });

      return category;
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
