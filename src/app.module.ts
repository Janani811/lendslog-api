import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { LendsModule } from './modules/lends/lends.module';
import { NotificationModule } from './notification/notification.module';
import { CronjobsModule } from './cronjobs/cronjobs.module';

import { AppController } from './app.controller';

import { AppService } from './app.service';
import { NotificationService } from './notification/notification.service';
import { AuthExpensifyModule } from './modules/auth-expensify/auth-expensify.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    CommonModule,
    AuthModule,
    LendsModule,
    CronjobsModule,
    NotificationModule,
    AuthExpensifyModule,
  ],
  controllers: [AppController],
  providers: [AppService, NotificationService],
})
export class AppModule {}
