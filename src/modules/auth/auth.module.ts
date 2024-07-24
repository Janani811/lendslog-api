import { Global, MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';

import { DatabaseModule } from '../../database/database.module';

import { AuthController } from './auth.controller';
import { AuthMiddleware } from './middleware/auth.middleware';

import { AuthService } from './auth.service';
import { TwilioService } from './twilio.service';

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
  controllers: [AuthController],
  providers: [JwtService, AuthService, AuthMiddleware, TwilioService],
  exports: [JwtService, AuthService, AuthMiddleware],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/signup', method: RequestMethod.POST },
        { path: 'auth/send-otp', method: RequestMethod.POST },
        { path: 'auth/verify-otp', method: RequestMethod.POST },
      )
      .forRoutes(AuthController);
  }
}
