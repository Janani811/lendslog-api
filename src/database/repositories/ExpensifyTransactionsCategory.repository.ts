import { Inject } from '@nestjs/common';
import { and, eq, isNull, or } from 'drizzle-orm';

import { DB } from '../database.constants';
import { Database } from '../types/Database';

import { expTransactionCategories, InsertExpensifyTransactionCategories } from '../schemas/schema';

export class ExpensifyTransactionsCategoryRepository {
  constructor(
    @Inject(DB)
    private readonly dbObject: Database,
  ) {}

  async getOne(args: { id?: number }) {
    return await this.dbObject.db.query.expTransactionCategories.findFirst({
      where: (expTransactionCategories, { eq }) => {
        const conditions: any = [];
        if (args && args.id) conditions.push(eq(expTransactionCategories.exp_tc_id, args.id));
        return and(conditions);
      },
    });
  }
  async createTransaction(data: any) {
    return await this.dbObject.db.insert(expTransactionCategories).values(data).returning();
  }
  async updateTransaction(
    data: Partial<InsertExpensifyTransactionCategories>,
    args: { id: number },
  ) {
    return await this.dbObject.db
      .update(expTransactionCategories)
      .set(data)
      .where(eq(expTransactionCategories.exp_tc_id, args.id))
      .returning();
  }

  async getAllCategories(id: number) {
    const conditions = [
      eq(expTransactionCategories.exp_tc_user_id, id),
      isNull(expTransactionCategories.exp_tc_user_id),
    ];
    return await this.dbObject.db.query.expTransactionCategories.findMany({
      where: or(...conditions),
    });
  }
}
