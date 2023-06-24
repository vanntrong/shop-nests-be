import { Cart } from '@/entities/cart/cart.entity';
import { CartProduct } from '@/entities/cartProduct/cartProduct.entity';
import { Product } from '@/entities/product/product.entity';
import { User } from '@/entities/user/user.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isNil, omit } from 'lodash';
import { Repository } from 'typeorm';
import { UpdateCartDto } from './cart.dto';

@Injectable()
export class CartService {
  logger: Logger;

  constructor(
    @InjectRepository(Cart) private readonly cartRepository: Repository<Cart>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(CartProduct)
    private readonly cartProductRepository: Repository<CartProduct>,
  ) {
    this.logger = new Logger(CartService.name);
  }

  /**
   * This function retrieves a user's cart and its associated products from a database using their user
   * ID.
   * @param {string} userId - The `userId` parameter is a string that represents the unique identifier
   * of a user whose cart is being fetched.
   * @returns This function returns an object with a message and data property. The message property is
   * a string indicating the success of the operation, while the data property contains the cart object
   * fetched from the database, transformed using the `` method.
   */
  async getCart(userId: string) {
    try {
      const cart = await this.cartRepository.findOne({
        where: {
          user: {
            id: userId,
          },
        },
        relations: ['cartProducts', 'cartProducts.product'],
        order: {
          cartProducts: {
            product: {
              name: 'ASC',
            },
          },
        },
      });

      return {
        message: 'Cart fetched successfully',
        data: this.$toResponse(cart),
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  /**
   * This is an async function that updates a user's cart by deleting existing cart products and adding
   * new ones based on the input data.
   * @param {string} userId - A string representing the ID of the user whose cart is being updated.
   * @param {UpdateCartDto} body - The `body` parameter is of type `UpdateCartDto`, which is likely a
   * DTO (Data Transfer Object) that contains information about the updated cart, including an array of
   * `cartProducts` with their respective `id` and `quantity`.
   * @returns The `updateCart` function is returning an object with a `message` and a `data` property.
   * The `message` property is a string that says "Cart updated successfully". The `data` property is
   * an object that contains the updated cart information. The `data` object has two properties: `cart`
   * and `products`. The `cart` property contains all the cart information except for
   */
  async updateCart(userId: string, body: UpdateCartDto) {
    try {
      const cart = await this.cartRepository.findOne({
        where: {
          user: {
            id: userId,
          },
        },
      });

      const products = await Promise.all(
        body.cartProducts.map(async (product) => {
          return this.productRepository.findOne({
            where: {
              id: product.id,
            },
          });
        }),
      );

      const cartProducts = await Promise.all(
        products.map(async (product, index) => {
          const quantity = +body.cartProducts[index].quantity;
          if (quantity === 0) {
            this.cartProductRepository.delete({
              cart: {
                id: cart.id,
              },
              product: {
                id: product.id,
              },
            });
            return null;
          }
          const cartProduct = await this.cartProductRepository.findOne({
            where: {
              cart: {
                id: cart.id,
              },
              product: {
                id: product.id,
              },
            },
            relations: ['product'],
          });

          if (cartProduct) {
            return this.cartProductRepository.save({
              ...cartProduct,
              quantity,
            });
          }

          return this.cartProductRepository.save({
            cart,
            product,
            quantity: +body.cartProducts[index].quantity,
          });
        }),
      );

      return {
        message: 'Cart updated successfully',
        data: {
          ...omit(cart, 'cartProducts'),
          products: cartProducts
            .filter((product) => !isNil(product))
            .map((cartProduct) => {
              return {
                id: cartProduct.product.id,
                quantity: cartProduct.quantity,
                name: cartProduct.product.name,
                price: cartProduct.product.price,
                thumbnailUrl: cartProduct.product.thumbnailUrl,
              };
            }),
        },
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  $toResponse(cart: Cart) {
    return {
      ...omit(cart, 'cartProducts'),
      products: cart.cartProducts.map((cartProduct) => {
        return {
          id: cartProduct.product.id,
          quantity: cartProduct.quantity,
          name: cartProduct.product.name,
          price: cartProduct.product.price,
          thumbnailUrl: cartProduct.product.thumbnailUrl,
          slug: cartProduct.product.slug,
          inventory: cartProduct.product.inventory,
          salePrice: cartProduct.product.salePrice,
          saleEndAt: cartProduct.product.saleEndAt,
        };
      }),
    };
  }
}
