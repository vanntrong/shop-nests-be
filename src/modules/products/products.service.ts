import { Category } from '@/entities/category/category.entity';
import { Product } from '@/entities/product/product.entity';
import { Filter, PaginationResult, Query, Result } from '@/types/common';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Not, Repository } from 'typeorm';
import { CreateProductDto, UpdateProductDto } from './products.dto';
import { generateSlug } from '@/utils/slug';
import { ProductErrorMessage } from './products.errorMessage';
import { CommonService } from '../common/common.service';
import { User } from '@/entities/user/user.entity';
import { readFile } from 'fs';
import { MailService } from '../mail/mail.service';
import { Order } from '@/entities/order/order.entity';

@Injectable()
export class ProductsService {
  logger: Logger;

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly commonService: CommonService,

    private readonly mailService: MailService,
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
    userId?: string,
  ): Promise<PaginationResult<Product>> {
    try {
      const isAdminQuery = await this.commonService.$isAdminQuery(userId);
      const { offset = 0, limit = 10, sortBy, sortOrder } = query;
      const { keyword = '', ..._filter } = filter;

      console.log(keyword);

      const queryBuilder = this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoin('category.parentCategory', 'parentCategory')
        .leftJoinAndSelect('product.createdBy', 'createdBy')
        .where(
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

        .andWhere(
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

        .skip(offset)
        .take(limit)
        .select(['product', 'category', 'createdBy.name'])
        .orderBy(
          `product.${sortBy || 'createdAt'}`,
          sortOrder === 'asc' ? 'ASC' : 'DESC',
        );

      if (_filter.category) {
        const categoriesFilter = Array.isArray(_filter.category)
          ? _filter.category
          : [_filter.category];

        const categories = await this.categoryRepository
          .createQueryBuilder('categories')
          .where('slug IN (:...slugs)', {
            slugs: categoriesFilter,
          })
          .getMany();

        queryBuilder.andWhere(
          new Brackets((qb) => {
            qb.andWhere(
              'category.id IN (:...categoryIds) OR category.parentCategory IN (:...categoryIds) OR parentCategory.parentCategory IN (:...categoryIds)',
              {
                categoryIds: categories.map((category) => category.id),
              },
            );
          }),
        );
      }

      if (_filter.min_price) {
        queryBuilder.andWhere('product.price >= :minPrice', {
          minPrice: _filter.min_price,
        });
      }

      if (_filter.max_price) {
        queryBuilder.andWhere('product.price <= :maxPrice', {
          maxPrice: _filter.max_price,
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
            isActive: true,
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
  async create(
    body: CreateProductDto,
    userId: string,
  ): Promise<Result<Product>> {
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

      const author = await this.userRepository.findOne({
        where: { id: userId, isDeleted: false },
      });

      const product = this.productRepository.create({
        ..._body,
        createdBy: author,
        category,
        slug,
      });

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
      const slug = generateSlug(_body.name);
      const product = await this.productRepository.findOne({
        where: { id, slug, isDeleted: false },
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

      const updatedProduct = await this.productRepository.save({
        ...product,
        category: newCategory,
        ..._body,
        slug,
      });

      if (
        updatedProduct.salePrice &&
        updatedProduct.saleEndAt &&
        new Date(updatedProduct.saleEndAt) > new Date()
      ) {
        this.sendMailSalePriceToCustomer(updatedProduct);
      }
      return {
        message: 'Product updated successfully',
        data: updatedProduct,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async sendMailSalePriceToCustomer(product: Product) {
    try {
      return new Promise(async (resolve) => {
        const customerHaveOrder = await this.orderRepository
          .createQueryBuilder('order')
          .leftJoinAndSelect('order.orderProducts', 'orderProducts')
          .leftJoinAndSelect('orderProducts.product', 'product')
          .where('product.id = :id', { id: product.id })
          .andWhere('order.userId IS NOT NULL')
          .groupBy('order.id, orderProducts.id, product.id, order.userId')
          .getMany();

        const userSet = new Set<string>();

        customerHaveOrder.forEach((order) => {
          userSet.add(order.userId);
        });

        userSet.forEach(async (userId) => {
          const user = await this.userRepository.findOne({
            where: { id: userId },
          });

          if (user) {
            this.mailService.sendMailSaleProduct(
              user.name,
              user.email,
              product,
            );
          }
        });
        resolve(true);
      });
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

  async getById(id: string): Promise<Result<Product>> {
    try {
      const product = await this.productRepository.findOne({
        where: [
          {
            id,
          },
        ],
        relations: ['category'],
      });

      if (!product) {
        throw new HttpException(
          ProductErrorMessage['product_not_found'],
          HttpStatus.NOT_FOUND,
        );
      }

      this.logger.log(`Get product :: ${JSON.stringify({ id })}`);

      return {
        message: 'Successful',
        data: product,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async restore(id: string): Promise<void> {
    try {
      await this.productRepository
        .createQueryBuilder('product')
        .update(Product)
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

  async seed() {
    try {
      new Promise((resolve, reject) => {
        readFile('data.json', 'utf8', async (err, data) => {
          if (err) {
            reject(err);
          }

          const { products = [] } = JSON.parse(data) || {};

          console.log('Seed products:::', products.length);

          const productsHaveSameName = products.filter(
            (product, index, self) => {
              return (
                index !== self.findIndex((item) => item.name === product.name)
              );
            },
          );

          console.log('productsHaveSameName:::', productsHaveSameName);

          await Promise.all(
            products.map(async ({ categoryId, ...item }) => {
              const slug = generateSlug(item.name);
              console.log('seed:::', slug);
              const category = await this.categoryRepository.findOne({
                where: { id: categoryId },
              });
              const author = await this.userRepository.findOne({
                where: { id: '4487abf4-016a-48ad-9bb4-e4eb179f238e' },
              });

              return await this.productRepository.save({
                ...item,
                slug,
                createdBy: author,
                category,
                weight: 200,
                inventory: Math.floor(Math.random() * 100),
                images: [item.thumbnailUrl],
                description:
                  'Nhân sâm Hàn Quốc là một loại thảo dược quý, được Tổ Yến Khánh Hòa – Yến Vàng nhập trực tiếp từ Geumsan. Những củ nhân sâm nơi đây được đánh giá có chất lượng tốt nhất Hàn Quốc và trên thế giới.',
                detailDescription: `**1\. Thành phần của nhân sâm nguyên củ Hàn Quốc**
                --------------------------------------------------
                
                Đây là loại nhân sâm đạt chuẩn 6 năm tuổi được thu hoạch khi còn giữ nguyên lớp đất bám ở ngoài vỏ. **Nhân sâm tươi Hàn Quốc** với hàm lượng dinh dưỡng và saponin cao, củ rắn chắc, ngắn và tròn. **Giá sâm Hàn Quốc loại 6 củ 1 kg** phụ thuộc rất nhiều vào thành phần dược tính của sâm. Nhân sâm tươi Hàn Quốc có nhiều thành phần dưỡng chất hiếm có như:
                
                *   Có đến 13 loại hợp chất saponin bao gồm các hoạt chất ginsenosides hoặc panaxosides, triterpenes, oleanane.
                *   Thành phần ginsenosides trong sâm gồm: Ginsenosides Ro, Re, Rg1, Rg2, Rg3, Rh1, Rh2, Ra1, Ra2,… Các ginsenosides này là hoạt chất giúp tăng cường sức khỏe, hệ thống miễn dịch bảo vệ cơ thể con ngăn ngừa các bệnh nguy hiểm và cũng làm giảm mức cholesterol.
                *   Các thành phần Malonyl Rb1, Rb2, Rc, Rd có tác dụng chống lão hóa, chống lại quá trình lão hóa của cơ thể duy trì thể trạng và kéo dài tuổi xuân.
                *   Chứa 7 hợp chất polyacetylen, 17 axit béo (axit palnitic, axit stearic, oleic) trong đó có đủ 8 loại axit cần thiết cho cơ thể và 20 nguyên tố hóa học Fe, Mn, Co, Se, K. Các thành phần khác là glucid, tinh dầu,… cung cấp đầy đủ những vi chất cần thiết cho cơ thể.
                
                **2\. Công dụng của nhân sâm tươi Hàn Quốc**
                --------------------------------------------
                
                Trong thành phần **nhân sâm tươi Hàn Quốc** chứa nhiều dưỡng chất và thành phần có giá trị dược tính cao, khi sử dụng sẽ mang lại nhiều tác dụng tốt đối với cơ thể. Cụ thể sâm nguyên củ mang đến công dụng sau:
                
                *   Hàm lượng Saponin khá lớn nên có thể giúp tăng cường sức đề kháng, phục hồi cơ thể nhanh chóng sau khi khỏi bệnh.
                *   Giúp làm giảm cholesterol và triglycerid trong máu giúp ngăn được các bệnh về tim mạch, tăng cường tuần hoàn máu.
                *   Giúp bổ sung lượng canxi và giúp kích thích trí não hoạt động tăng cường, cải thiện trí nhớ.
                *   Có tác dụng chống lão hóa và làm đẹp da ở nữ giới.
                *   Tác dụng giải độc gan, tăng cường chức năng gan và ngăn ngừa các bệnh về gan như viêm gan, xơ gan, gan nhiễm mỡ.
                *   Giảm đường huyết trong máu, ngăn ngừa tiểu đường và các biến chứng.
                *   Hỗ trợ giảm tác hại của hóa xạ trị và các loại kháng sinh.
                
                **3\. Hướng dẫn cách sử dụng nhân sâm tươi Hàn Quốc hiệu quả nhất**:
                --------------------------------------------------------------------
                
                ### **3.1 Pha trà nhân sâm**
                
                Sâm tươi thái thành lát mỏng, mỗi lần dùng 1-2g, cho vào ấm, đổ nước sôi vào như là pha  trà. Sau 5 phút bạn có thể rót ra uống dần như trà. Bạn có thể hãm vài lần như vậy, sau khi thấy mùi vị đã nhạt thì lấy bã ra nhai và nuốt dần. Sản phẩm tốt với người mất ngủ, stress, căng thẳng mệt mỏi kéo dài,…
                
                ![](https://toyenkhanhhoa.vn/wp-content/uploads/2023/05/bat-mi-cong-dung-tuyet-voi-cua-tr-sam-han-quoc-1-1.jpg)
                
                **\* Lưu ý:** Tránh dùng trà sâm vào buổi tối muộn vì nhân sâm giúp đầu óc tỉnh tảo minh mẫn, dùng muộn có thể phản tác dụng gây khó ngủ
                
                ### **3.2 Nhân sâm tươi hầm gà**
                
                **Nguyên liệu :**
                
                *   Gà: 1 con;
                *   Nhân sâm tươi: khoảng 5 củ (tùy theo sâm lớn nhỏ);
                *   Táo tàu: 10 quả;
                *   Gạo nếp: 80 g;
                *   Nước dùng : 2 lít;
                *   Gia vị : Bột nêm gà , muối đường,…
                *   Gạo nếp
                
                ![](https://toyenkhanhhoa.vn/wp-content/uploads/2023/05/2-cach-nau-ga-ham-sam-han-quoc-vua-ngon-mieng-vua-bo-duong-ca-gia-dinh-thich-me-202008191402499671.jpg)
                
                **Cách thức thực hiện:**
                
                *   **Nhân sâm tươi:** Rửa thật sạch, chặt thành từng khúc rồi cho vào nồi nước dùng, đun cho đến khi nước sôi vặn lửa riu khoảng 1h đồng hồ .
                *   **Táo tàu:** Ngâm nước và rửa sạch.
                *   **Gà:** Rút xương, ướp gia vị khoảng 20 phút .
                *   **Gạo nếp:** Vo sạch, để ráo sau đó trộn với táo tàu cùng với phụ gia bột nêm, muối …. sau đó nhồi tất cả vào bụng gà, dùng kim may kín lại .
                
                Nhân sâm tươi khi đã đun lửa được 1 giờ thì ta có thể ngửi thấy mùi thơm, lúc này ta cho gà vào vặn lửa lớn, đun đến khi nào gạo nếp chín thì ta có thể vớt ra dùng. Gà hầm sâm là một món ăn vô cùng bổ dưỡng, mỗi tuần 1 – 2 lần. Cách dùng này thường áp dụng để bồi bổ cơ thể phụ nữ sau thời kỳ sinh đẻ hoặc người ốm bệnh mới hồi phục
                
                ### **3.3 Nhân sâm tươi ngâm mật ong**
                
                Nhân sâm ngâm mật ong có công dụng cực kỳ tốt cho sức khỏe, đồng thời đây cũng là cách giúp bảo quản sâm tươi và sử dụng lâu dài.
                
                **Nguyên liệu:**
                
                *   **Nhân sâm tươi:** 1kg
                *   **Mật ong:** 1.5 – 2 lít. Bạn nên chuẩn bị lượng mật ong dư ra, sao cho khi ngâm mật ong ngập sâm là được.
                *   Bình thủy tinh.
                
                ![](https://toyenkhanhhoa.vn/wp-content/uploads/2023/05/cach-ngam-nhan-sam-voi-mat-ong.png)
                
                **Cách ngâm:**
                
                *   Rửa sạch củ sâm tươi và để thật ráo nước.
                *   Cắt bỏ phần núm đầu củ sâm.
                *   Phần thân và rễ chính cắt lát thật mỏng.
                *   Rễ phụ có thể mang đi hầm canh, nấu nước uống rất tốt.
                *   Cho sâm đã thái lát vào hũ thủy tinh.
                *   Đổ mật ong vào và khuấy nhẹ cho đến khi mật ong ngập sâm thì dừng lại.
                *   Đậy nắp và bảo quản tủ lạnh trong 1 tháng là có thể sử dụng.
                
                Mỗi ngày nên dùng 1-2 lần, mỗi lần ăn 1 thìa, nên pha với nước ấm để uống và nhai lát sâm. Hơn thế nữa sâm tươi cũng có thể ngâm cùng các loại dược liệu khác như câu kỳ tử, linh chi, hoàng kỳ để chữa bệnh mất ngủ, tình trạng ăn uống kém, người suy nhược sau cơn bệnh,… hoặc tăng cường sinh lực sinh lý cho nam giới.
                
                ### **3.4 Ngâm rượu nhân sâm tươi**
                
                **Nguyên liệu:**
                
                *   Sâm tươi, nên chọn sâm tươi Hàn Quốc 6 năm tuổi ( theo tỷ lệ 100 – 200gr / 1 lít rượu)
                *   Rượu trắng ( 32 – 40 độ)
                *   1 bàn chải: Để làm sạch sâm
                *   1 con dao, 1 cái kéo để cắt tỉa nhân sâm
                *   1 hộp tăm giúp xiên nhỏ nhân sâm
                *   1 cái rổ để đựng sâm
                *   Bình thủy tinh đựng rượu ngâm.
                
                ![](https://toyenkhanhhoa.vn/wp-content/uploads/2023/05/z2944732805980_28b0e73c1b3e0e390e8e356bdb914948-526x400.jpg)
                
                **Cách ngâm sâm tươi với rượu:**
                
                *   Làm sạch củ sâm bằng cách lấy bàn chải cọ sạch sẽ cả phần thân và rễ nhỏ.
                *   Sau đó để cho ráo nước rồi tráng lại với rượu.
                *   Sau khi làm sạch _củ nhân sâm_ tươi và chọn loại rượu phù hợp, chúng ta sẽ tiến hành đưa nhân sâm vào bình và cố định. Nếu sử dụng nhiều củ thì dùng tăm hay xiên nhọn cắm vào thân để nối các củ lại với nhau.
                *   Sau đó đổ rượu ngập hết củ sâm và cẩn thận đậy nắp lại.
                *   Rượu sâm ngâm trong khoảng 6 tháng thì có thể dùng được. Ngâm càng lâu, rượu sâm càng thơm ngon và bổ dưỡng.
                
                ### **3.5 Làm đẹp với nhân sâm**
                
                Ngoài những công dụng dành cho sức khỏe, nhân sâm tươi Hàn Quốc cũng là một sản phẩm chăm sóc sắc đẹp tuyệt vời mà có thể bạn chưa biết. Một số cách làm đẹp với nhân sâm tươi:
                
                **Phương pháp làm sạch da với nhân sâm:**
                
                *   Trộn hỗn hợp trà xanh và nhân sâm tươi rồi xay nhuyễn, thêm vào ít nước chanh và trộn đều. Bạn thoa lên toàn thân sau khoảng 5 -10 phút, tác dụng làm sạch da giúp thư giãn rất tốt.
                *   Trước khi thoa hỗn hợp, cần tắm qua nước để làm sạch da, sau khi sử dụng, tắm lại bằng nước sạch rồi thoa kem giữ ẩm để tác dụng tốt hơn.
                *   Với liệu trình này, bạn sẽ có làn da khỏe mạnh, hồng hào và mịn màng hơn.
                
                **Đắp mặt nạ dưỡng da:**
                
                *   Bạn có thể kết hợp với mật ong, sữa tươi hoặc trứng gà, rồi xay nhuyễn, đắp trong vòng 15- 20 phút rồi rửa sạch với nước ấm. Phương pháp này giúp làn da căng mịn,  giảm các vết sạm da, nám da.
                
                **4\. Đối tượng nên và không nên dùng nhân sâm tươi Hàn Quốc**
                --------------------------------------------------------------
                
                ### **4.1 Đối tượng nên sử dụng nhân sâm tươi Hàn Quốc**
                
                Sau đây là những đối tượng được chuyên gia khuyến khích sử dụng nhân sâm:
                
                *   Những bệnh nhân đang làm hóa xạ trị (nên hỏi ý kiến bác sĩ) hoặc trong quá trình hồi phục, cần bồi bổ sức khỏe.
                *   Những người cần cải thiện trí nhớ, tập trung, người lao động trí óc, làm việc căng thẳng.
                *   Những người thường xuyên uống rượu bia.
                *   Phòng chống đột quỵ và bệnh tim mạch cực kỳ tốt.
                *   Những người bị huyết áp thấp cũng nên sử dụng nhân sâm tươi Hàn Quốc.
                *   Nam, nữ giới muốn cải thiện sức khỏe, tăng cường sinh lý và chống lão hóa.
                
                ### **4.2 Đối tượng không nên sử dụng sâm tươi Hàn Quốc**
                
                Sau đây là một số đối tượng không nên sử dụng nhân sâm tươi Hàn Quốc mà bạn cần lưu ý:
                
                *   Người bị thương cảm mạo, phát sốt.
                *   Người bị bệnh gan mật cấp tính.
                *   Người viêm dạ dày và ruột cấp tính, bị nôn mửa, đau bụng, đi ngoài.
                *   Người bị viêm loét dạ dày cấp tính và xuất huyết.
                *   Người bị giãn phế quản, bị lao, ho ra máu.
                *   Người bị cao huyết áp.
                *   Nam giới hay bị di tinh, bị xuất tinh sớm.
                *   Người có bệnh về hệ thống miễn dịch.
                *   Phụ nữ ở thời kỳ mang thai.
                *   Trẻ nhỏ dưới 14 tuổi.
                
                **5\. Lưu ý khi sử dụng nhân sâm tươi Hàn Quốc**
                ------------------------------------------------
                
                *   Khi mua nhân sâm tươi về, bạn nên chế biến hoặc sử dụng càng sớm càng tốt để sâm có chất lượng tốt nhất. Không nên để lâu sẽ khiến sâm hao hụt dần chất dinh dưỡng và dễ bị thối.
                *   Khi dùng bạn nên cắt bỏ phần núm đầu. Vì đó là phần mầm củ sâm, không có lợi cho sức khỏe.
                *   Nếu chưa sơ chế hoặc sử dụng được ngay, bạn nên bảo quản sâm trong ngăn mát tủ lạnh, để củ sâm cùng với rêu ẩm rồi bọc kín trong báo. Cách 2 – 3 ngày bạn thay báo 1 lần. Làm cách này có thể bảo quản được khoảng 7 ngày.
                
                **6\. Hướng dẫn bảo quản nhân sâm tươi**
                ----------------------------------------
                
                *   Sau khi mua về, củ nhân sâm tươi có thể sử dụng từ 2 – 3 ngày, nếu bảo quản đúng cách trong tủ lạnh như trên thì có thể lên đến 1 tháng.
                *   Lưu ý để bảo quản được lâu trong tủ lạnh, bạn nên để ngăn mát, bọc sâm tươi với báo và thay báo mới hàng ngày nhé.
                *   Tại cửa hàng, nhân sâm tươi sẽ được xếp trong một cái hộp lớn cùng với một lớp rêu để giữ độ ẩm cho củ sâm, thời gian bảo quản chưa đến 1 tuần.
                
                **7\. Phân biệt nhân sâm Hàn Quốc** 
                ------------------------------------
                
                Bạn đã biết các dấu hiệu nhận biết nhân sâm Hàn Quốc và Trung Quốc, nhận biết nhân sâm chính hãng dựa theo hình dáng chưa? Cùng tìm hiểu qua phần dưới đây nhé!
                
                ### **7.1 Phân biệt nhân sâm Hàn Quốc và Trung Quốc**
                
                Dưới đây là những khác biệt cơ bản về hình dạng giữa nhân sâm Hàn Quốc và nhân sâm Trung Quốc giúp bạn dễ dàng nhận biết được:
                
                ![](https://toyenkhanhhoa.vn/wp-content/uploads/2023/05/phan-biet-sam-han-quoc-sam-trung-quoc.png)
                
                **Nhân sâm tươi Hàn Quốc**
                
                **Nhân sâm tươi Trung Quốc**
                
                *   Theo hình dáng cả cây thì sâm hàn quốc có 5 lá, đến mùa đông cây héo đi mùa xuân lại nảy mầm mọc lại
                *   Sau khi thu hoạch sâm Hàn Quốc vẫn còn lớp đất bám xung quanh củ sâm – Phần đầu củ sâm Hàn Quốc rắn chắc ,ngắn và tròn
                *   Chân củ sâm Hàn Quốc có màu vàng hoàng thổ và to phân thành chân rõ ràng – Cơ cấu bên trong củ sâm nhìn chắc và chất lượng tốt
                *   Thân và củ sâm Hàn Quốc có hình dáng giống người rõ ràng, trọng lượng nặng hơn
                *   Phần rễ chỉ bám vào chân củ sâm chứ không bám nhiều vào thân củ
                *   Có mùi thơm nức đặc trưng của sâm Hàn Quốc. Khi sử dụng người xung quanh ngửi rất rõ mùi sâm do người dùng thở ra.
                *   Củ sâm tươi hàn quốc thường có mầm mọc từ gốc và nếu trồng xuống vẫn phát triển thành cây sâm.
                
                *   Sâm Trung Quốc khi chưa thu hoạch có 7 lá.
                *   Thân củ sâm được cắt gọt sạch sẽ, không có lớp đất dính xung quanh do được rửa sạch và có thể tẩm hóa chất.
                *   Phần đầu củ sâm hơi mềm và thon dài
                *   Thân củ sâm có màu trắng.
                *   Cơ cấu bên trong củ sâm nhìn xốp, chất lượng kém hơn.
                *   Chân sâm có hình dáng không rõ ràng, cùng kích thước nhưng trọng lượng nhẹ.
                *   Phần rễ bám chủ yếu bám nhiều vào thân củ hơn phần chân sâm.
                *   Có mùi thơm nhẹ của sâm.
                
                ### **7.2 Nhận biết hình dáng cây nhân sâm Hàn Quốc**
                
                Bạn có thể nhận biết được nhân sâm Hàn Quốc dựa trên hình dáng hoa và lá sâm. Cùng tìm hiểu xem những bộ phận này của nhân sâm có gì đặc biệt nhé!
                
                *   **Hoa:** Nhân sâm bắt đầu nở hoa và kết trái từ lúc sâm đạt 3 năm tuổi. Hoa của cây nhân sâm ban đầu sẽ có màu xanh lá tươi, sau đó sẽ chuyển sang màu đỏ khi đã chín. Bên trong hoa sẽ là hạt nhân sâm, thường hạt sẽ được thu hoạch và làm giống. Loại hạt tốt được lựa chọn từ cây sâm 4 năm tuổi trở lên.
                *   **Lá:** Lá nhân sâm mọc trên cuống lá, có hình bàn tay chụm vào. Số lá trên cuốn có thể xác định tuổi của nhân sâm (năm đầu sẽ có 3 lá, năm tiếp theo sẽ có 5 lá).
                *   **Cuống:** Cuống sâm tăng thêm một sau mỗi năm và số lượng sẽ là 6 tương ứng với 6 năm tuổi. Tuy nhiên khi trong điều kiện tốt, củ sâm phát triển mạnh mẽ thì cuống sâm có thể phát triển thêm.
                *   **Phần đầu sâm:** Mỗi năm, phần thân, lá sẽ rụng đi, để lại một vết trên đầu sâm. Đây cũng là phương pháp phổ biến để xác định độ tuổi của sâm.
                *   **Phần thân:** Thực chất là phần thân của củ sâm. Đây là nơi chứa nhiều chất dinh dưỡng nhất của sâm. Rễ chính được chia tiếp ra rễ phụ và các rễ nhỏ hơn.
                *    **Phần chân:** Đây là phần giúp cho cây thu nhận dưỡng chất cùng với phần rễ. Tùy vào đất trồng, điều kiện canh tác hay số tuổi sẽ có từ 2 -5 chân.
                *   **Phần rễ:** Là phần giúp cây hút dưỡng chất, thường được cắt bỏ đi khi chế biến hồng sâm. Bạn có thể tận dụng để làm trà sâm và một số đồ uống bổ dưỡng khác.
                
                ![](https://toyenkhanhhoa.vn/wp-content/uploads/2023/05/ImageForNews_727993_16657580696824858-599x400.webp)
                
                ### **7.3 Cách nhận biết số tuổi của nhân sâm Hàn Quốc**
                
                Chúng ta có thể biết được số tuổi của nhân sâm Hàn Quốc dựa vào số đốt trên củ sâm hoặc có thể dựa vào vân bên trong ruột sâm.
                
                #### **7.3.1. Đếm số đốt trên củ**
                
                Mỗi năm tuổi của củ sâm tươi Hàn Quốc cũng được thể hiện bằng cách sinh thêm một đốt trên phần rễ củ. Cách đếm số đốt trên củ: từ chân củ nếu sinh ra một đốt thì nghĩa là nhân sâm 2 năm tuổi, 2 đốt là 3 năm tuổi,… 5 đốt là sâm 6 năm tuổi. Vì thế, đối với những củ sâm có số đốt càng nhiều thì càng có giá trị và _giá sâm 6 củ Hàn Quốc_ đó càng đắt.
                
                ![](https://toyenkhanhhoa.vn/wp-content/uploads/2023/05/tra-nhan-sam-2-1-e1553228283797.webp)
                
                #### **7.3.2. Dựa vào vân trong ruột củ sâm**
                
                Muốn xác định độ tuổi Sâm Hàn Quốc Loại 6 Củ 1 Kg bằng cách này, bạn dùng dao cắt ngang củ sâm cách về phía đầu khoảng 2cm – 3cm, chờ khoảng 5 phút bạn dùng đầu ngón tay hay lòng bàn tay xoa lên bề mặt vừa cắt. Nhờ các nhựa từ củ sâm mà ta có thể thấy các đường vân nổi lên. Tuy nhiên cần phải phân biệt giữa đường vân năm tuổi với các đường thớ củ (như đường thớ gỗ). Sâm 6 năm là có 5 đường vân.
                
                Đối với sâm trồng từ quá 6 năm tuổi trở lên thì phần củ sẽ bắt đầu bị thối mục, các thành phần bổ dưỡng cũng bị giảm đáng kể. Hiện nay ở Hàn Quốc chỉ thông dụng 3 loại sâm là sâm 4 năm, 5 năm và 6 năm.`,
              });
            }),
          );
        });
      });
    } catch (error) {
      this.logger.error(error.message);
      // throw error;
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
