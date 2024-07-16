import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/database/database.module';
import { LendsService } from './lends.service';
import { LendsController } from './lends.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [LendsController],
  providers: [LendsService],
})
export class LendsModule {}
