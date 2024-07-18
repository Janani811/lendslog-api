import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { DatabaseModule } from 'src/database/database.module';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { LendsService } from './lends.service';
import { LendsController } from './lends.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [LendsController],
  providers: [LendsService],
})

export class LendsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware) // middleware
      .forRoutes(LendsController);
  }
}
