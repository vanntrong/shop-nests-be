import { User } from '@/decorators';
import { UserExtractFromToken } from '@/types/common';
import { Body, Controller, Post } from '@nestjs/common';
import { AuthLoginDto, AuthRegisterDto, AuthVerifyDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: AuthLoginDto) {
    return this.authService.login(body);
  }

  @Post('register')
  async register(@Body() body: AuthRegisterDto) {
    return this.authService.register(body);
  }

  @Post('verify')
  async verify(@Body() body: AuthVerifyDto) {
    return this.authService.verify(body);
  }

  @Post('refresh-token')
  async refreshToken(@User() user: UserExtractFromToken) {
    return this.authService.refreshToken(user.email, user.id, user.rfToken);
  }
}
