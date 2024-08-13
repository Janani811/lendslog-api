import { Injectable } from '@nestjs/common';
// import { Cron, CronExpression } from '@nestjs/schedule';

import { NotificationRepository } from 'src/database/repositories/Notification.repository';
import { UserRepository } from 'src/database/repositories/User.repository';

import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class CronjobsService {
  constructor(
    private userRepository: UserRepository,
    private notificationRepository: NotificationRepository,
    private notificationService: NotificationService,
  ) {}
  // @Cron('40 2 * * *')
  async openForBusiness() {
    try {
      console.log('Delicious cakes is open for business...');
      return true;
    } catch (error) {
      throw error;
    }
  }
  // @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async generateNotifications() {
    try {
      console.log('Delicious cakes is open for sdd...');
      const users = await this.userRepository.getUserWithLendsCount();
      console.log('users');
      for (let i = 0; i < users.length; i++) {
        console.log('32 line');
        await this.notificationRepository.add({
          nt_text: 'The total pending payments is ',
          nt_pending_count: users[i].pending_installment_count,
          nt_user_id: users[i].us_id,
        });
      }
      return true;
    } catch (error) {
      throw error;
    }
  }
  // @Cron('0,15,30,45 55 01 * * *')
  // @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async sendNotification() {
    try {
      const notificationIds = [];
      console.log('49 line');
      const all = await this.notificationRepository.getTodayNotifications();
      console.log('51 line');
      for (let i = 0; i < all.length; i++) {
        console.log('32 line');
        console.log(`Index = ${i}`, all[i].nt_id, all[i].notificationToken);
        const notificationTokens = all[i].notificationToken;
        const title = 'Today Reminder';
        const body = `${all[i].nt_text}${all[i].nt_pending_count}`;
        notificationIds.push(all[i].nt_id);
        for (let j = 0; j < notificationTokens.length; j++) {
          console.log('59 line');
          await this.notificationService.sendPush(notificationTokens[j].ntto_token, title, body);
        }
      }
      if (notificationIds.length) {
        console.log('64 line');
        await this.notificationRepository.update({ nt_status: 2 }, notificationIds);
      }
      return true;
    } catch (error) {
      throw error;
    }
  }
}
