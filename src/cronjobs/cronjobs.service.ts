import { Injectable } from '@nestjs/common';
import { ExpoPushMessage } from 'expo-server-sdk';
import { ExpensifyNotificationTokenRepository } from 'src/database/repositories/ExpensifyNotificationToken.repository';
// import { Cron, CronExpression } from '@nestjs/schedule';

import { NotificationRepository } from 'src/database/repositories/Notification.repository';
import { UserRepository } from 'src/database/repositories/User.repository';
import { ExpensifyNotificationService } from 'src/modules/expensify/expensify-notification.service';

import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class CronjobsService {
  constructor(
    private userRepository: UserRepository,
    private notificationRepository: NotificationRepository,
    private notificationService: NotificationService,
    private expensifyNotificationTokenRepository: ExpensifyNotificationTokenRepository,
    private expensifyNotificationService: ExpensifyNotificationService,
  ) {}
  // @Cron('40 2 * * *')
  // async openForBusiness() {
  //   try {
  //     console.log('Delicious cakes is open for business...');
  //   } catch (error) {
  //     throw error;
  //   }
  // }
  // @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async generateNotifications() {
    try {
      console.log('********* Generate Notifications Initiated ********');
      const users = await this.userRepository.getUserWithLendsCount();
      for (let i = 0; i < users.length; i++) {
        await this.notificationRepository.add({
          nt_text: 'The total pending payments is ',
          nt_pending_count: users[i].pending_installment_count,
          nt_user_id: users[i].us_id,
        });
      }
      console.log('********* Generate Notifications Completed ********');
    } catch (error) {
      throw error;
    }
  }
  // @Cron('0,15,30,45 55 01 * * *')
  // @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async sendNotification() {
    try {
      console.log('********* Send Notification Initiated ********');
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
      console.log('********* Send Notifications Completed ********');
    } catch (error) {
      throw error;
    }
  }
  async expensifySendNotification() {
    const count = 200;
    let record = [];
    let iteration = 1;
    try {
      console.log('********* Send Expo Notification Initiated ********');

      do {
        const messages: ExpoPushMessage[] = [];
        record = await this.expensifyNotificationTokenRepository.getAll(count, iteration * count);
        if (!record.length) {
          break;
        }
        for (let i = 0; i < record.length; i++) {
          const notificationTokens = record[i].token;
          const title = 'Today Reminder';
          const body = `You have expenses to log for today. Don't forget to keep your budget on track!`;
          messages.push({
            to: notificationTokens,
            title,
            sound: 'default',
            body,
            priority: 'high',
          });
        }
        await this.expensifyNotificationService.sendNotifications(messages);
        iteration = iteration + 1;
      } while (record.length > 0);
      console.log('********* Send Notifications Completed ********');
      return true;
    } catch (error) {
      throw error;
    }
  }
}
