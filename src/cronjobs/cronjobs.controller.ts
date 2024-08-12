import { Controller, Get } from '@nestjs/common';

import { CronjobsService } from './cronjobs.service';

@Controller('crons')
export class CronjobsController {
  constructor(private readonly cronjobsService: CronjobsService) {}

  @Get()
  async getHello() {
    await this.cronjobsService.openForBusiness();
    await this.cronjobsService.generateNotifications();
    await this.cronjobsService.sendNotification();
  }
}
