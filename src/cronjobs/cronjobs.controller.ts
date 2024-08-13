import { Controller, Get, Request, Response } from '@nestjs/common';

import { CronjobsService } from './cronjobs.service';

@Controller('crons')
export class CronjobsController {
  constructor(private readonly cronjobsService: CronjobsService) {}

  @Get()
  async runCron() {
    try {
      console.log('runCron');
      // res.status(200).json('Cron initiaited');
      await this.cronjobsService.openForBusiness();
      await this.cronjobsService.generateNotifications();
      await this.cronjobsService.sendNotification();
    } catch (error) {
      console.error(error);
    }
  }
}
