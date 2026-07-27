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
      console.log('********* Pending Notification Reminder Completed ********');
    } catch (error) {
      console.error(error);
    }
  }

  @Get('recurring-transactions')
  async runRecurringTransactionsCron() {
    try {
      console.log('********* Recurring Transaction Reminder Cron Initiated ********');
      await this.cronjobsService.sendRecurringTransactionReminders();
      console.log('********* Recurring Transaction Reminder Cron Completed ********');
    } catch (error) {
      console.error(error);
    }
  }
}
