import { and, eq, inArray, sql } from 'drizzle-orm';
import { Inject } from '@nestjs/common';

import { DB } from '../database.constants';
import { Database } from '../types/Database';

import { InsertNotification, notification, notificationToken } from '../schemas/schema';

export class NotificationRepository {
  constructor(
    @Inject(DB)
    private readonly dbObject: Database,
  ) {}

  async add(data: InsertNotification) {
    return await this.dbObject.db.insert(notification).values(data).returning();
  }
  async getAll(args: { nt_user_id: number }, type: string) {
    return this.dbObject.db.query.notification.findMany({
      where: and(
        eq(notification.nt_user_id, args.nt_user_id),
        type == 'today'
          ? sql`DATE(nt_created_at) = CURRENT_DATE`
          : sql`DATE(nt_created_at) != CURRENT_DATE`,
      ),
      extras: {
        nt_created_at: sql`TO_CHAR(${notification.nt_created_at},'dd-mm-yyyy')`.as('nt_created_at'),
      },
    });
  }

  async getTodayNotifications() {
    return this.dbObject.db.query.notification.findMany({
      where: and(eq(notification.nt_status, 1), sql`DATE(nt_created_at) = CURRENT_DATE`),
      with: {
        notificationToken: { where: eq(notificationToken.ntto_status, 1) },
      },
    });
  }

  async update(data: any, ids: Array<number>) {
    return await this.dbObject.db
      .update(notification)
      .set(data)
      .where(inArray(notification.nt_id, ids))
      .returning();
  }
}
