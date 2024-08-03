import { Inject } from '@nestjs/common';

import { DB } from '../database.constants';
import { Database } from '../types/Database';

import { InsertNotification, notification } from '../schemas/schema';
import { and, eq, sql } from 'drizzle-orm';

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
    });
  }
}
