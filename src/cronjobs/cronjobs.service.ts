import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CronjobsService {
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  openForBusiness() {
    console.log('Delicious cakes is open for business...');
  }
}
