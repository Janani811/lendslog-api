import { Inject } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DB } from '../database.constants';
import { Database } from '../types/Database';

import { expensifyUsers, InsertExpensifyUser } from '../schemas/schema';

export class ExpensifyUserRepository {
  constructor(
    @Inject(DB)
    private readonly dbObject: Database,
  ) {}

  async getOne(args: { id?: string; phone?: string; user_id?: number }) {
    return await this.dbObject.db.query.expensifyUsers.findFirst({
      where: (expensifyUsers, { eq }) => {
        const conditions: any = [];
        if (args && args.id) conditions.push(eq(expensifyUsers.exp_us_clerk_id, args.id));
        if (args && args.user_id) conditions.push(eq(expensifyUsers.exp_us_id, args.user_id));
        if (args && args.phone) conditions.push(eq(expensifyUsers.exp_us_phone_no, args.phone));
        return and(conditions);
      },
    });
  }
  async createUser(data: any) {
    return await this.dbObject.db.insert(expensifyUsers).values(data).returning();
  }
  async updateUser(
    data: Partial<InsertExpensifyUser>,
    args: { exp_us_phone_no?: string; exp_us_clerk_id?: string; exp_user_id?: number },
  ) {
    return await this.dbObject.db
      .update(expensifyUsers)
      .set(data)
      .where(
        and(
          args.exp_us_clerk_id
            ? eq(expensifyUsers.exp_us_clerk_id, args.exp_us_clerk_id)
            : undefined,
          args.exp_us_phone_no
            ? eq(expensifyUsers.exp_us_phone_no, args.exp_us_phone_no)
            : undefined,
          args.exp_user_id ? eq(expensifyUsers.exp_us_id, args.exp_user_id) : undefined,
        ),
      )
      .returning();
  }
}
