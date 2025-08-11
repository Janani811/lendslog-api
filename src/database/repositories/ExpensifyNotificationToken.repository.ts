import { and, between, eq, sql } from 'drizzle-orm';
import { Inject } from '@nestjs/common';

import { DB } from '../database.constants';
import { Database } from '../types/Database';

import {
  InsertExpensifyNotificationToken,
  SelectExpensifyNotificationToken,
  expNotificationToken,
} from '../schemas/schema';

export class ExpensifyNotificationTokenRepository {
  constructor(
    @Inject(DB)
    private readonly dbObject: Database,
  ) {}

  async add(data: InsertExpensifyNotificationToken) {
    return await this.dbObject.db.insert(expNotificationToken).values(data).returning();
  }
  async getAll(limit: number, offset: number) {
    const results = await this.dbObject.db
      .select({
        token: expNotificationToken.exp_ntto_token,
        userId: expNotificationToken.exp_ntto_user_id,
      })
      .from(expNotificationToken)
      .where(
        and(
          eq(expNotificationToken.exp_ntto_status, 1),
          between(
            sql`TO_TIMESTAMP(${expNotificationToken.exp_ntto_time}, 'HH12:MI AM')::time`,
            sql`CURRENT_TIME::time`,
            sql`(CURRENT_TIME + INTERVAL '20 minutes')::time`,
          ),
        ),
      )
      .limit(limit)
      .offset(offset);

    return results;
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

  async getOne(args: Partial<SelectExpensifyNotificationToken>) {
    const conditions = [];
    Object.keys(args).map((item: keyof InsertExpensifyNotificationToken) => {
      conditions.push(eq(expNotificationToken[item], args[item]));
    });
    return await this.dbObject.db.query.expNotificationToken.findFirst({
      where: and(...conditions),
    });
  }
}
