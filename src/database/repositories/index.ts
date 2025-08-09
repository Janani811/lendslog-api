import { ExpensifyBankAccountRepository } from './ExpensifyBankAccounts.repository';
import { ExpensifyNotificationLogRepository } from './ExpensifyNotification.repository';
import { ExpensifyNotificationTokenRepository } from './ExpensifyNotificationToken.repository';
import { ExpensifyTransactionsRepository } from './ExpensifyTransactions.repository';
import { ExpensifyTransactionsCategoryRepository } from './ExpensifyTransactionsCategory.repository';
import { ExpensifyUserRepository } from './ExpensifyUser.repository';
import { ExpStarredTransactionsRepository } from './ExpStarredTransactions.repository';
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
  ExpensifyTransactionsRepository,
  ExpensifyTransactionsCategoryRepository,
  ExpensifyBankAccountRepository,
  ExpStarredTransactionsRepository,
  ExpensifyNotificationTokenRepository,
  ExpensifyNotificationLogRepository,
];
