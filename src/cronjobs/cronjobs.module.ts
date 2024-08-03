import { Module } from '@nestjs/common';
import { CronjobsService } from './cronjobs.service';
import { UserRepository } from 'src/database/repositories/User.repository';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [CronjobsService, UserRepository],
})
export class CronjobsModule {}
