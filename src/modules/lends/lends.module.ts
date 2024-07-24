import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';

import { AuthMiddleware } from '../auth/middleware/auth.middleware';

import { LendsService } from './lends.service';
import { LendsController } from './lends.controller';
import { NotificationService } from '../../notification/notification.service';

@Module({
  imports: [DatabaseModule],
  controllers: [LendsController],
  providers: [LendsService, NotificationService],
})
export class LendsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware) // middleware
      .forRoutes(LendsController);
  }
}
