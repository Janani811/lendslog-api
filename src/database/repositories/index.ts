import { ExpensifyTransactions } from './ExpensifyTransactions.repository';
import { ExpensifyUserRepository } from './ExpensifyUser.repository';
import { InstallmentTimelineRepository } from './InstallmentTimelines.repository';
import { LendsRepository } from './Lends.repository';
import { NotificationRepository } from './Notification.repository';
import { NotificationTokenRepository } from './NotificationToken.repository';
import { UserRepository } from './User.repository';

export const repositories = [
  UserRepository,
  LendsRepository,
  InstallmentTimelineRepository,
  NotificationRepository,
  NotificationTokenRepository,
  ExpensifyUserRepository,
  ExpensifyTransactions,
];
