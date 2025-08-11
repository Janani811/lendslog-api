import { Global, MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';

import { ExpensifyController } from './expensify.controller';
import { AuthExpensifyMiddleware } from './middleware/auth-expensify.middleware';

import { ExpensifyService } from './expensify.service';
import { ConfigService } from '@nestjs/config';
import { ExpensifyNotificationService } from './expensify-notification.service';

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [ExpensifyController],
  providers: [ExpensifyService, AuthExpensifyMiddleware, ExpensifyNotificationService],
  exports: [ExpensifyService, AuthExpensifyMiddleware],
})
export class ExpensifyModule implements NestModule {
  constructor(private config: ConfigService) {}
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthExpensifyMiddleware)
      .exclude({ path: 'expensify/clerk/webhook', method: RequestMethod.POST })
      .forRoutes(ExpensifyController);
  }
}
