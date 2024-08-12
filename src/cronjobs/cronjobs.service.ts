import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

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
  @Cron('40 2 * * *')
  async openForBusiness() {
    console.log('Delicious cakes is open for business...');
  }
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async generateNotifications() {
    console.log('Delicious cakes is open for sdd...');
    const users = await this.userRepository.getUserWithLendsCount();
    for (let i = 0; i < users.length; i++) {
      await this.notificationRepository.add({
        nt_text: 'The total pending payments is ',
        nt_pending_count: users[i].pending_installment_count,
        nt_user_id: users[i].us_id,
      });
    }
  }
  // @Cron('0,15,30,45 55 01 * * *')
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async sendNotification() {
    const notificationIds = [];
    const all = await this.notificationRepository.getTodayNotifications();
    for (let i = 0; i < all.length; i++) {
      const notificationTokens = all[i].notificationToken;
      const title = 'Today Reminder';
      const body = `${all[i].nt_text}${all[i].nt_pending_count}`;
      notificationIds.push(all[i].nt_id);
      for (let j = 0; j < notificationTokens.length; j++) {
        await this.notificationService.sendPush(notificationTokens[j].ntto_token, title, body);
      }
    }
    if (notificationIds.length) {
      await this.notificationRepository.update({ nt_status: 2 }, notificationIds);
    }
  }
}
