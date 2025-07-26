import { Inject } from '@nestjs/common';
import { and, eq, or } from 'drizzle-orm';

import { DB } from '../database.constants';
import { Database } from '../types/Database';

import { expBankAccounts, InsertExpensifyBankAccounts } from '../schemas/schema';

export class ExpensifyBankAccountRepository {
  constructor(
    @Inject(DB)
    private readonly dbObject: Database,
  ) {}

  async getOne(id: number) {
    return await this.dbObject.db.query.expBankAccounts.findFirst({
      where: (expBankAccounts, { eq }) => {
        const conditions: any = [];
        if (id) conditions.push(eq(expBankAccounts.exp_ba_user_id, id));
        return and(conditions);
      },
    });
  }
  async createBankAccount(data: any) {
    return await this.dbObject.db.insert(expBankAccounts).values(data).returning();
  }
  async updateBankAccount(data: InsertExpensifyBankAccounts, id: number) {
    return await this.dbObject.db
      .update(expBankAccounts)
      .set(data)
      .where(eq(expBankAccounts.exp_ba_id, id))
      .returning();
  }
  async deleteBankAccount(id: number) {
    return await this.dbObject.db.delete(expBankAccounts).where(eq(expBankAccounts.exp_ba_id, id));
  }

  async getAllBankAccount(id: number) {
    const conditions = [eq(expBankAccounts.exp_ba_user_id, id)];
    return await this.dbObject.db.query.expBankAccounts.findMany({
      where: or(...conditions),
    });
  }
}
