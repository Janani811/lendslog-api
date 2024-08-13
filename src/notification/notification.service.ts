import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as firebase from 'firebase-admin';

import { NotificationRepository } from 'src/database/repositories/Notification.repository';
import { NotificationTokenRepository } from 'src/database/repositories/NotificationToken.repository';

import { UpdateNotificationToken } from 'src/database/schemas/schema';

@Injectable()
export class NotificationService {
  constructor(
    private notificationRepository: NotificationRepository,
    private notificationTokenRepository: NotificationTokenRepository,
  ) {}
  acceptPushNotification = async (
    us_id: number,
    token: string,
  ): Promise<UpdateNotificationToken> => {
    try {
      // update existing device as inactive
      // await this.notificationTokenRepository.update({
      //   ntto_user_id: user.us_id
      // },
      // {
      //   ntto_status: 0,
      // });

      // save to db
      const [notification_token] = await this.notificationTokenRepository.add({
        ntto_user_id: us_id,
        ntto_status: 1,
        ntto_token: token,
      });
      return notification_token;
    } catch (error) {
      throw new HttpException(error.message || 'Something went wrong', HttpStatus.BAD_REQUEST);
    }
  };
  disablePushNotification = async (us_id: number, token: string): Promise<void> => {
    try {
      await this.notificationTokenRepository.update(
        { us_id, token },
        {
          ntto_status: 0,
        },
      );
    } catch (error) {
      throw new HttpException(error.message || 'Something went wrong', HttpStatus.BAD_REQUEST);
    }
  };
  sendPush = async (token: string, title: string, body: string) => {
    try {
      await firebase.messaging().send({
        notification: { title, body },
        token,
        android: { priority: 'high' },
        data: { screen: '/dashboard/notification' },
      });
    } catch (error) {
      console.log(error);
      throw new HttpException(error.message || 'Something went wrong', HttpStatus.BAD_REQUEST);
    }
  };

  async getAll(data: { nt_user_id: number }) {
    try {
      const todayNotifications = await this.notificationRepository.getAll(data, 'today');
      const olderNotifications = await this.notificationRepository.getAll(data, 'older');
      return { todayNotifications, olderNotifications };
    } catch (e) {
      throw new HttpException(e.message || 'Something went wrong', HttpStatus.BAD_REQUEST);
    }
  }
}
