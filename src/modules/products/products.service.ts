import { Category } from '@/entities/category/category.entity';
import { Product } from '@/entities/product/product.entity';
import { Filter, PaginationResult, Query, Result } from '@/types/common';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CreateProductDto, UpdateProductDto } from './products.dto';
import { generateSlug } from '@/utils/slug';
import { ProductErrorMessage } from './products.errorMessage';

@Injectable()
export class ProductsService {
  logger: Logger;

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {
    this.logger = new Logger(ProductsService.name);
  }

  /**
   * This is an asynchronous function that retrieves a list of products based on a query and filter,
   * and returns a pagination result.
   * @param {Query} query - An object containing pagination and sorting parameters such as offset,
   * limit, sortBy, and sortOrder.
   * @param {Filter} filter - The `filter` parameter is an object that contains filtering options for
   * the query. It may contain a `keyword` property for searching by keyword, as well as other
   * properties that can be used to filter the results, such as `category`, `brand`, `price`, etc. The
   * `..._
   * @returns A `Promise` that resolves to a `PaginationResult` object containing information about the
   * products that match the provided query and filter parameters. The `PaginationResult` object
   * includes the following properties: `message`, `offset`, `limit`, `total`, `hasNext`, and `data`.
   */
  async findAll(
    query: Query,
    filter: Filter,
  ): Promise<PaginationResult<Product>> {
    try {
      const { offset = 0, limit = 10, sortBy, sortOrder } = query;
      const { keyword = '', ..._filter } = filter;
      console.log('filter', filter);

      const queryBuilder = this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.category', 'category')
        .where({ isDeleted: false })
        .andWhere(
          new Brackets((subQb) => {
            subQb
              .where('product.name ILIKE :keyword', {
                keyword: `%${keyword}%`,
              })
              .orWhere('product.slug ILIKE :keyword', {
                keyword: `%${keyword}%`,
              });
          }),
        )
        .skip(offset)
        .take(limit)
        .orderBy(
          `product.${sortBy || 'createdAt'}`,
          sortOrder === 'asc' ? 'ASC' : 'DESC',
        );

      if (filter.categoryId) {
        queryBuilder.andWhere((qb) => {
          qb.where('product.category = :categoryId', {
            categoryId: _filter.categoryId,
          });
        });
      }

      const [products, count] = await queryBuilder.getManyAndCount();

      this.logger.log(
        `Get all products :: ${JSON.stringify({ query, filter })}`,
      );

      return {
        message: 'Successful',
        offset,
        limit,
        total: count,
        hasNext: count > offset + limit,
        data: products,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  /**
   * This function finds a product by its slug and returns it as a Promise, throwing an error if the
   * product is not found.
   * @param {string} slug - The `slug` parameter is a string that represents a unique identifier for a
   * product. It is used to query the database and retrieve a single product that matches the given
   * slug.
   * @returns This function returns a Promise that resolves to a Result object containing a message and
   * data. The data is the product object retrieved from the database based on the provided slug
   * parameter. If the product is not found, it throws an HttpException with a NOT_FOUND status and a
   * message indicating that the product was not found. If there is an error during the execution of
   * the function, it logs the error and re
   */
  async findOne(slug: string): Promise<Result<Product>> {
    try {
      const product = await this.productRepository.findOne({
        where: [
          {
            slug: slug,
            isDeleted: false,
          },
        ],
      });

      if (!product) {
        throw new HttpException(
          ProductErrorMessage['product_not_found'],
          HttpStatus.NOT_FOUND,
        );
      }

      this.logger.log(`Get product :: ${JSON.stringify({ slug })}`);

      return {
        message: 'Successful',
        data: product,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  /**
   * This is an async function that creates a new product with a unique slug and a specified category,
   * and returns a success message with the created product data, or throws an error if the product
   * already exists or if there is an error during the creation process.
   * @param {CreateProductDto} body - The `body` parameter is of type `CreateProductDto`, which is an
   * object containing the data needed to create a new product. It likely includes properties such as
   * `name`, `description`, `price`, and `categoryId`.
   * @returns The `create` method is returning a Promise that resolves to a `Result` object containing
   * a message and data. The message is a string indicating that the product was created successfully,
   * and the data is the newly created product object.
   */
  async create(body: CreateProductDto): Promise<Result<Product>> {
    try {
      const { categoryId, ..._body } = body;
      const slug = generateSlug(body.name);
      const isExists = await this.$isExists(slug);

      if (isExists) {
        throw new HttpException(
          ProductErrorMessage['product_exist'],
          HttpStatus.CONFLICT,
        );
      }

      const category = await this.categoryRepository.findOne({
        where: { id: categoryId },
      });

      const product = this.productRepository.create({
        ..._body,
        slug,
      });

      product.category = category;

      await this.productRepository.save(product);

      return {
        message: 'Product created successfully',
        data: product,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  /**
   * This is an async function that updates a product in a database, including changing its category
   * and generating a new slug.
   * @param {string} id - The ID of the product to be updated.
   * @param {UpdateProductDto} body - The `body` parameter is an object of type `UpdateProductDto`,
   * which contains the updated information for a product. It may include properties such as `name`,
   * `description`, `price`, `quantity`, and `categoryId`.
   * @returns This function returns a Promise that resolves to a Result object containing a message and
   * data. The message indicates whether the product was updated successfully or not, and the data
   * contains the updated product information.
   */
  async update(id: string, body: UpdateProductDto): Promise<Result<Product>> {
    try {
      const { categoryId, ..._body } = body;
      const product = await this.productRepository.findOne({
        where: { id, isDeleted: false },
      });

      if (!product) {
        throw new HttpException(
          ProductErrorMessage['product_not_found'],
          HttpStatus.NOT_FOUND,
        );
      }

      let newCategory: Category = product.category;

      if (categoryId) {
        newCategory = await this.categoryRepository.findOne({
          where: { id: categoryId },
        });
      }

      const slug = generateSlug(_body.name);

      const isExists = await this.$isExists(slug);

      if (isExists) {
        throw new HttpException(
          ProductErrorMessage['product_exist'],
          HttpStatus.CONFLICT,
        );
      }

      const updatedProduct = await this.productRepository.save({
        ...product,
        category: newCategory,
        ..._body,
        slug,
      });

      return {
        message: 'Product updated successfully',
        data: updatedProduct,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  /**
   * This is an async function that deletes a product by setting its "isDeleted" property to true.
   * @param {string} id - a string representing the unique identifier of the product to be deleted.
   * @returns A Promise that resolves to void (i.e., nothing is returned explicitly, but the function
   * is expected to complete successfully without returning any value).
   */
  async delete(id: string): Promise<void> {
    try {
      const product = await this.productRepository.findOne({
        where: { id, isDeleted: false },
      });

      if (!product) {
        throw new HttpException(
          ProductErrorMessage['product_not_found'],
          HttpStatus.NOT_FOUND,
        );
      }

      await this.productRepository.save({
        ...product,
        isDeleted: true,
      });

      return;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async $isExists(slug: string) {
    try {
      const count = await this.productRepository.count({
        where: [{ slug: slug, isDeleted: false }],
      });

      return !!count;
    } catch (error) {
      this.logger.error(error.message);
    }
  }
}
