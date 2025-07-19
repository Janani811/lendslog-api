import { Global, MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';

import { AuthExpensifyController } from './auth-expensify.controller';
import { AuthExpensifyMiddleware } from './middleware/auth-expensify.middleware';

import { AuthExpensifyService } from './auth-expensify.service';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [AuthExpensifyController],
  providers: [AuthExpensifyService, AuthExpensifyMiddleware],
  exports: [AuthExpensifyService, AuthExpensifyMiddleware],
})
export class ExpensifyModule implements NestModule {
  constructor(private config: ConfigService) {}
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthExpensifyMiddleware)
      .exclude(
        { path: 'expensify/clerk/webhook', method: RequestMethod.POST },
        { path: 'expensify/login', method: RequestMethod.POST },
        { path: 'expensify/signup', method: RequestMethod.POST },
        { path: 'expensify/send-otp', method: RequestMethod.POST },
        { path: 'expensify/verify-otp', method: RequestMethod.POST },
      )
      .forRoutes(AuthExpensifyController);
  }
}
