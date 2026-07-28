import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { AuthMiddleware } from '../modules/auth/middleware/auth.middleware';

import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware) // middleware
      .exclude({ path: 'notifications/test-send', method: RequestMethod.POST })
      .forRoutes(NotificationController);
  }
}
