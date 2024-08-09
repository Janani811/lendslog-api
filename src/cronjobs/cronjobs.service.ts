import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationRepository } from 'src/database/repositories/Notification.repository';
import { UserRepository } from 'src/database/repositories/User.repository';

@Injectable()
export class CronjobsService {
  constructor(
    private userRepository: UserRepository,
    private notificationRepository: NotificationRepository,
  ) {}
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async openForBusiness() {
    console.log('Delicious cakes is open for business...');
  }
  @Cron('0 55 13 * * *')
  async generateNotifications() {
    const users = await this.userRepository.getUserWithLendsCount();
    for (let i = 0; i < users.length; i++) {
      await this.notificationRepository.add({
        nt_text: 'The total pending payments is ',
        nt_pending_count: users[i].pending_installment_count,
        nt_user_id: users[i].us_id,
      });
    }
  }
}
