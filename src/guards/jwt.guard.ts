import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('access-token') {
  isPrivateRoute = false;

  constructor({ isPrivateRoute = false } = {}) {
    super();
    this.isPrivateRoute = isPrivateRoute;
  }

  canActivate(context: ExecutionContext) {
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    return super.canActivate(context);
  }

  handleRequest(err, user) {
    // You can throw an exception based on either "info" or "err" arguments

    if (err || !user) {
      throw err || new UnauthorizedException();
    }

    if (this.isPrivateRoute && (!user || !user.roles.includes('admin'))) {
      throw new ForbiddenException();
    }

    return user;
  }
}
