import configuration from '@/configs/configuration';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'refresh-token',
) {
  constructor() {
    const config = configuration();
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwt.refresh_token_secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const rfToken = req.headers.authorization?.split(' ')[1];

    if (!rfToken) {
      throw new ForbiddenException('Refresh token is not provided');
    }

    return { ...payload, rfToken };
  }
}
