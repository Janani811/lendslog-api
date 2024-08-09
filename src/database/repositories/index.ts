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
];
