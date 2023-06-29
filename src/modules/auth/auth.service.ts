import configuration from '@/configs/configuration';
import { Cart } from '@/entities/cart/cart.entity';
import { User } from '@/entities/user/user.entity';
import { $toUserResponse } from '@/utils/mongo';
import {
  CACHE_MANAGER,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcryptjs from 'bcryptjs';
import { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { AuthLoginDto, AuthRegisterDto, AuthVerifyDto } from './auth.dto';
import AuthErrorResponse from './auth.errorMessage';
import { AuthLoginResponse } from './auth.type';

@Injectable()
export class AuthService {
  logger: Logger;
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Cart) private readonly cartRepository: Repository<Cart>,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly mailService: MailService,
  ) {
    this.logger = new Logger(AuthService.name);
  }

  /**
   * It takes a body of type AuthLoginDto, checks if the user exists in the database, and if it does,
   * it returns a token
   * @param {AuthLoginDto} body - AuthLoginDto
   * @returns {
   *   "accessToken":
   * "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsImlhdCI6MTU5MzU4MzU4
   */
  async login(body: AuthLoginDto): Promise<AuthLoginResponse> {
    try {
      this.logger.log(`Login attempt for ${JSON.stringify(body)}`);

      const exist = await this.userRepository.findOne({
        where: { email: body.email, isDeleted: false },
      });

      if (!exist || !this.$comparePassword(body.password, exist.password)) {
        throw new HttpException(
          AuthErrorResponse['incorrect_username_or_password'],
          HttpStatus.UNAUTHORIZED,
        );
      }

      return {
        message: 'Login successful',
        data: $toUserResponse(exist),
        tokens: this.$signTokens({
          email: exist.email,
          id: exist.id,
          roles: exist.roles,
        }),
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  /**
   * The function takes in a body of type AuthRegisterDto, and returns a promise of type
   * AuthRegisterResponse
   * @param {AuthRegisterDto} body - AuthRegisterDto
   * @returns {
   *     message: 'Registration successful',
   *     data: (user),
   *     tokens: this.({ email: user.email, id: user.id }),
   *   }
   */
  async register(body: AuthRegisterDto) {
    try {
      this.logger.log(`Register attempt for ${JSON.stringify(body)}`);

      const exist = !!(await this.userRepository.count({
        where: { email: body.email },
      }));

      if (exist) {
        throw new HttpException(
          AuthErrorResponse['user_already_exist'],
          HttpStatus.CONFLICT,
        );
      }

      const user = await this.userRepository.save({
        ...body,
        name: body.username,
        roles: ['user'],
        password: this.$hashPassword(body.password),
      });

      const cart = await this.cartRepository.findOne({
        where: {
          user: {
            id: user.id,
          },
        },
      });

      if (!cart) {
        this.cartRepository.save({
          user,
          products: [],
        });
      }

      this.mailService.sendMailRegister(user.name, user.email);

      return {
        message: 'Registration successful',
        data: $toUserResponse(user),
        tokens: this.$signTokens({
          email: user.email,
          id: user.id,
          roles: user.roles,
        }),
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async logout(userId: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      this.cacheManager.del(user.email);
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async verify(body: AuthVerifyDto) {
    try {
      this.jwtService.verifyAsync(body.token, {
        secret: configuration().jwt.mail_token_secret,
      });
      return {
        message: 'Verification successful',
      };
    } catch (error) {
      throw new HttpException(AuthErrorResponse.invalid_token, 401);
    }
  }

  async refreshToken(email: string, id: string, token?: string) {
    if (!token) {
      throw new HttpException(AuthErrorResponse.invalid_token, 401);
    }

    try {
      const refreshToken = await this.cacheManager.get(email);
      if (refreshToken !== token) {
        throw new HttpException(AuthErrorResponse.invalid_token, 401);
      }

      const tokens = this.$signTokens({ email, id });

      return tokens;
    } catch (error) {
      throw error;
    }
  }

  $comparePassword(password: string, hash: string) {
    return bcryptjs.compareSync(password, hash);
  }

  $hashPassword(password: string) {
    return bcryptjs.hashSync(password, 10);
  }

  $signTokens(payload: { [key: string]: string[] | string }) {
    const config = configuration();
    const accessToken = this.jwtService.sign(payload, {
      secret: config.jwt.access_token_secret,
      expiresIn: config.jwt.access_token_expires_in,
      algorithm: 'HS256',
      header: {
        kid: 'sim1',
        alg: 'HS256',
        typ: 'JWT',
      },
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: config.jwt.refresh_token_secret,
      expiresIn: config.jwt.refresh_token_expires_in,
      algorithm: 'HS256',
      header: {
        kid: 'sim1',
        alg: 'HS256',
        typ: 'JWT',
      },
    });
    this.cacheManager.set(payload.email as string, refreshToken, {
      ttl: config.jwt.refresh_token_expires_in,
    });
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      exp: config.jwt.access_token_expires_in,
    };
  }

  $signTokenVerifyAccount(payload: { email: string }) {
    const config = configuration();
    const token = this.jwtService.sign(payload, {
      secret: config.jwt.mail_token_secret,
      expiresIn: config.jwt.mail_token_expires_in,
    });

    return token;
  }
}
