import { and, eq, sql } from 'drizzle-orm';
import { Inject } from '@nestjs/common';

import { DB } from '../database.constants';
import { Database } from '../types/Database';

import { InsertExpensifyNotificationToken, expNotificationToken } from '../schemas/schema';

export class ExpensifyNotificationTokenRepository {
  constructor(
    @Inject(DB)
    private readonly dbObject: Database,
  ) {}

  async add(data: InsertExpensifyNotificationToken) {
    return await this.dbObject.db.insert(expNotificationToken).values(data).returning();
  }
  async getAll(args: { user_id: number }, type: string) {
    return this.dbObject.db.query.expNotificationToken.findMany({
      where: and(
        eq(expNotificationToken.exp_ntto_user_id, args.user_id),
        type == 'today'
          ? sql`DATE(nt_created_at) = CURRENT_DATE`
          : sql`DATE(nt_created_at) != CURRENT_DATE`,
      ),
    });
  }
  async update(args: { us_id: number; token: string }, data: any) {
    return await this.dbObject.db
      .update(expNotificationToken)
      .set(data)
      .where(
        and(
          eq(expNotificationToken.exp_ntto_user_id, Number(args.us_id)),
          eq(expNotificationToken.exp_ntto_token, args.token),
        ),
      )
      .returning();
  }
}
