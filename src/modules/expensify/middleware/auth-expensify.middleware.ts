import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { ExpensifyService } from '../expensify.service';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { ExpensifyUserRepository } from 'src/database/repositories/ExpensifyUser.repository';

@Injectable()
export class AuthExpensifyMiddleware implements NestMiddleware {
  clerkClient;
  constructor(
    private readonly authService: ExpensifyService,
    private config: ConfigService,
    private jwtService: JwtService,
    private usersRepository: ExpensifyUserRepository,
  ) {
    this.clerkClient = createClerkClient({
      publishableKey: this.config.get('EXPENSIFY_CLERK_PUBLISHABLE_KEY'),
      secretKey: this.config.get('EXPENSIFY_CLERK_SECRET_KEY'),
    });
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeaders = req.headers.authorization;
    const bearerToken = authHeaders?.startsWith('Bearer ') ? authHeaders.substring(7) : null;
    if (bearerToken) {
      let decoded = null;
      try {
        decoded = await verifyToken(bearerToken, {
          secretKey: this.config.get('EXPENSIFY_CLERK_SECRET_KEY'),
        });
      } catch (e) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      if (!decoded) {
        throw new UnauthorizedException('Invalid session');
      }

      const clerkUser = await this.clerkClient.users.getUser(decoded.sub);

      if (!clerkUser) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      const user = await this.usersRepository.getOne({ id: clerkUser.id });
      (req as any).user = user;

      req['user'] = user;
      next();
    } else {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
  }
}
