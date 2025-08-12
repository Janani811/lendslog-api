import { Controller, Get } from '@nestjs/common';

import { CronjobsService } from './cronjobs.service';

@Controller('crons')
export class CronjobsController {
  constructor(private readonly cronjobsService: CronjobsService) {}

  @Get()
  async runCron() {
    try {
      console.log('********* Pending Notification Reminder Initiated ********');
      // res.status(200).json('Cron initiaited');
      // await this.cronjobsService.generateNotifications();
      // await this.cronjobsService.sendNotification();
      // await this.cronjobsService.expensifySendNotification();
      //TODO: To add cron job in vercel.json need add this
      // "crons": [
      //   {
      //     "path": "/crons",
      //     "schedule": "0 11 * * *"
      //   }
      // ]
      console.log('********* Pending Notification Reminder Completed ********');
    } catch (error) {
      console.error(error);
    }
  }
}
