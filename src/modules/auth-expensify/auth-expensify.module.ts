import { Global, MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';

import { DatabaseModule } from '../../database/database.module';

import { AuthExpensifyController } from './auth-expensify.controller';
import { AuthExpensifyMiddleware } from './middleware/auth-expensify.middleware';

import { AuthExpensifyService } from './auth-expensify.service';
import { TwilioService } from '../auth/twilio.service';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      // signOptions: { expiresIn: process.env.JWT_EXPIRY },
    }),
    DatabaseModule,
    PassportModule,
  ],
  controllers: [AuthExpensifyController],
  providers: [JwtService, AuthExpensifyService, AuthExpensifyMiddleware, TwilioService],
  exports: [JwtService, AuthExpensifyService, AuthExpensifyMiddleware],
})
export class AuthExpensifyModule implements NestModule {
  constructor(private config: ConfigService) {}
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthExpensifyMiddleware)
      .exclude(
        { path: 'auth-expensify/login', method: RequestMethod.POST },
        { path: 'auth-expensify/signup', method: RequestMethod.POST },
        { path: 'auth-expensify/send-otp', method: RequestMethod.POST },
        { path: 'auth-expensify/verify-otp', method: RequestMethod.POST },
      )
      .forRoutes(AuthExpensifyController);
  }
}
