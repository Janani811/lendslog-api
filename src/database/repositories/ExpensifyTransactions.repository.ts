import { Inject } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DB } from '../database.constants';
import { Database } from '../types/Database';

import { expTransactions, InsertExpensifyTransactions } from '../schemas/schema';

export class ExpensifyTransactions {
  constructor(
    @Inject(DB)
    private readonly dbObject: Database,
  ) {}

  async getOne(args: { id?: number }) {
    return await this.dbObject.db.query.expTransactions.findFirst({
      where: (expTransactions, { eq }) => {
        const conditions: any = [];
        if (args && args.id) conditions.push(eq(expTransactions.exp_ts_id, args.id));
        return and(conditions);
      },
    });
  }
  async createTransaction(data: any) {
    return await this.dbObject.db.insert(expTransactions).values(data).returning();
  }
  async updateTransaction(data: Partial<InsertExpensifyTransactions>, args: { id: number }) {
    return await this.dbObject.db
      .update(expTransactions)
      .set(data)
      .where(eq(expTransactions.exp_ts_id, args.id))
      .returning();
  }
}
