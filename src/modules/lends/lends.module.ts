import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import moment from 'moment';

import { DatabaseModule } from '../../database/database.module';

import { AuthMiddleware } from '../auth/middleware/auth.middleware';

import { LendsService } from './lends.service';
import { LendsController } from './lends.controller';
import { NotificationService } from '../../notification/notification.service';

@Module({
  imports: [DatabaseModule],
  controllers: [LendsController],
  providers: [
    LendsService,
    NotificationService,
    {
      provide: 'MomentWrapper',
      useValue: moment,
    },
  ],
})
export class LendsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware) // middleware
      .forRoutes(LendsController);
  }
}
