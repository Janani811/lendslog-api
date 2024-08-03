import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as firebase from 'firebase-admin';

import { NotificationRepository } from 'src/database/repositories/Notification.repository';

@Injectable()
export class NotificationService {
  constructor(private notificationRepository: NotificationRepository) {}
  //   acceptPushNotification = async (
  //     user: any,
  //     notification_dto: NotificationDto,
  //   ): Promise<NotificationToken> => {
  //     await this.notificationTokenRepo.update(
  //       { user: { id: user.id } },
  //       {
  //         status: 'INACTIVE',
  //       },
  //     );
  //     // save to db
  //     const notification_token = await this.notificationTokenRepo.save({
  //       user: user,
  //       device_type: notification_dto.device_type,
  //       notification_token: notification_dto.notification_token,
  //       status: 'ACTIVE',
  //     });
  //     return notification_token;
  //   };
  //   disablePushNotification = async (user: any, update_dto: UpdateNotificationDto): Promise<void> => {
  //     try {
  //       await this.notificationTokenRepo.update(
  //         { user: { id: user.id }, device_type: update_dto.device_type },
  //         {
  //           status: 'INACTIVE',
  //         },
  //       );
  //     } catch (error) {
  //       return error;
  //     }
  //   };
  sendPush = async (user?: any, title?: string, body?: string): Promise<void> => {
    try {
      console.log(user, body, title);
      //   const notification = await this.notificationTokenRepo.findOne({
      //     where: { user: { id: user.id }, status: 'ACTIVE' },
      //   });
      const notification = true;
      if (notification) {
        // await this.notificationsRepo.save({
        //   notification_token: notification,
        //   title,
        //   body,
        //   status: 'ACTIVE',
        //   created_by: user.username,
        // });
        await firebase
          .messaging()
          .send({
            notification: { title: 'Nest Js', body: 'Hello from backend' },
            token:
              'fldm30m9Rq-9xhZtTjmqh4:APA91bHuuXLuX2k3-3-MkWJYZG2L9hmRjiaNEBcoIciJjmtTyYHjCN3UTifNLaKnR9ATyMdABc-Duy4GpEDdWgfsSI7EOBAkC7cepCAXTG3m0jwpnwJIOeOfGON5udtGPQsMdyYyyhXu',
            android: { priority: 'high' },
          })
          .catch((error: any) => {
            console.error(error);
          });
      }
    } catch (error) {
      return error;
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
