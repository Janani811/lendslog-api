import { and, eq, sql } from 'drizzle-orm';
import { Inject } from '@nestjs/common';

import { DB } from '../database.constants';
import { Database } from '../types/Database';

import { InsertNotificationToken, notificationToken } from '../schemas/schema';

export class NotificationTokenRepository {
  constructor(
    @Inject(DB)
    private readonly dbObject: Database,
  ) {}

  async add(data: InsertNotificationToken) {
    return await this.dbObject.db.insert(notificationToken).values(data).returning();
  }
  async getAll(args: { nt_user_id: number }, type: string) {
    return this.dbObject.db.query.notification.findMany({
      where: and(
        eq(notificationToken.ntto_user_id, args.nt_user_id),
        type == 'today'
          ? sql`DATE(nt_created_at) = CURRENT_DATE`
          : sql`DATE(nt_created_at) != CURRENT_DATE`,
      ),
    });
  }
  async update(args: { us_id: number; token: string }, data: any) {
    return await this.dbObject.db
      .update(notificationToken)
      .set(data)
      .where(
        and(
          eq(notificationToken.ntto_user_id, Number(args.us_id)),
          eq(notificationToken.ntto_token, args.token),
        ),
      )
      .returning();
  }
}
