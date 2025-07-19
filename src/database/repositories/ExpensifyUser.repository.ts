import { Inject } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DB } from '../database.constants';
import { Database } from '../types/Database';

import { expensify_users, InsertExpensifyUser } from '../schemas/schema';

export class ExpensifyUserRepository {
  constructor(
    @Inject(DB)
    private readonly dbObject: Database,
  ) {}

  async getOne(args: { id?: string; phone?: string }) {
    return await this.dbObject.db.query.expensify_users.findFirst({
      where: (expensify_users, { eq }) => {
        const conditions: any = [];
        if (args && args.id) conditions.push(eq(expensify_users.exp_us_clerk_id, args.id));
        if (args && args.phone) conditions.push(eq(expensify_users.exp_us_phone_no, args.phone));
        return and(conditions);
      },
    });
  }
  async createUser(data: any) {
    return await this.dbObject.db.insert(expensify_users).values(data).returning();
  }
  async updateUser(
    data: Partial<InsertExpensifyUser>,
    args: { exp_us_phone_no?: string; exp_us_clerk_id?: string },
  ) {
    return await this.dbObject.db
      .update(expensify_users)
      .set(data)
      .where(
        args.exp_us_clerk_id
          ? eq(expensify_users.exp_us_clerk_id, args.exp_us_clerk_id)
          : eq(expensify_users.exp_us_phone_no, args.exp_us_phone_no),
      )
      .returning();
  }
}
