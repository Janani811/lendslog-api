import { Module } from '@nestjs/common';

import { UserRepository } from 'src/database/repositories/User.repository';
import { DatabaseModule } from 'src/database/database.module';

import { CronjobsService } from './cronjobs.service';
import { NotificationService } from 'src/notification/notification.service';
import { CronjobsController } from './cronjobs.controller';
import { ExpensifyNotificationService } from 'src/modules/expensify/expensify-notification.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CronjobsController],
  providers: [CronjobsService, UserRepository, NotificationService, ExpensifyNotificationService],
})
export class CronjobsModule {}
