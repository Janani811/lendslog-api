import { Module } from '@nestjs/common';

import { UserRepository } from 'src/database/repositories/User.repository';
import { DatabaseModule } from 'src/database/database.module';

import { CronjobsService } from './cronjobs.service';
import { NotificationService } from 'src/notification/notification.service';

@Module({
  imports: [DatabaseModule],
  providers: [CronjobsService, UserRepository, NotificationService],
})
export class CronjobsModule {}
