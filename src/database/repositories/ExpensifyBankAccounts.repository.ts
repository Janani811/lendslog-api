import { Inject } from '@nestjs/common';
import { and, asc, eq, or } from 'drizzle-orm';

import { DB } from '../database.constants';
import { Database } from '../types/Database';

import { expBankAccounts, expTransactions, InsertExpensifyBankAccounts } from '../schemas/schema';
import { ExpensifyTransactionsRepository } from './ExpensifyTransactions.repository';
import { CreateBankAccountDto } from 'src/modules/expensify/dto/auth.dto';

export class ExpensifyBankAccountRepository {
  constructor(
    @Inject(DB)
    private readonly dbObject: Database,
    private expensifyTransactionsRepository: ExpensifyTransactionsRepository,
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
  async createBankAccount(data: CreateBankAccountDto) {
    const account = data as unknown as InsertExpensifyBankAccounts;
    return await this.dbObject.db.insert(expBankAccounts).values(account).returning();
  }
  async updateBankAccount(data: Partial<InsertExpensifyBankAccounts>, id: number) {
    return await this.dbObject.db
      .update(expBankAccounts)
      .set(data)
      .where(eq(expBankAccounts.exp_ba_id, id))
      .returning();
  }
  async deleteBankAccount(id: number, userId: number) {
    await this.dbObject.db.transaction(async (tx) => {
      await this.dbObject.db.delete(expBankAccounts).where(eq(expBankAccounts.exp_ba_id, id));
      await tx
        .delete(expTransactions)
        .where(
          and(
            eq(expTransactions.exp_ts_bank_account_id, id),
            eq(expTransactions.exp_ts_user_id, userId),
          ),
        )
        .returning();
    });

    return true;
  }

  async getAllBankAccount(id: number) {
    const conditions = [eq(expBankAccounts.exp_ba_user_id, id)];
    return await this.dbObject.db.query.expBankAccounts.findMany({
      where: or(...conditions),
      orderBy: asc(expBankAccounts.exp_ba_id),
    });
  }

  async getAccountDetailsWithGroupedTransactionsById(accountId: number, userId: number) {
    const [account] = await this.dbObject.db
      .select()
      .from(expBankAccounts)
      .where(
        and(eq(expBankAccounts.exp_ba_id, accountId), eq(expBankAccounts.exp_ba_user_id, userId)),
      )
      .limit(1);

    if (!account) {
      throw new Error('Account not found or access denied.');
    }

    const transactions = await this.expensifyTransactionsRepository.getAllTransactions(userId, {
      accountId,
    });

    const groupMap: Record<
      string,
      {
        year: number;
        month: string;
        title: string;
        income: number;
        expense: number;
        data: typeof transactions;
      }
    > = {};

    for (const tx of transactions) {
      const date = new Date(tx.exp_ts_date as string);
      const month = date.toLocaleString('default', { month: 'long' });
      const year = date.getFullYear();
      const key = `${year}-${month}`;

      if (!groupMap[key]) {
        groupMap[key] = {
          year,
          month,
          title: `${month} ${year}`,
          income: 0,
          expense: 0,
          data: [],
        };
      }

      const amount = parseFloat(tx.exp_ts_amount as string);
      if (tx.exp_tt_id === 2) {
        groupMap[key].income += amount;
      } else if (tx.exp_tt_id === 1) {
        groupMap[key].expense += amount;
      }

      groupMap[key].data.push(tx);
    }

    return {
      ...account,
      data: Object.values(groupMap).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return (
          new Date(`${b.month} 1, ${b.year}`).getMonth() -
          new Date(`${a.month} 1, ${a.year}`).getMonth()
        );
      }),
    };
  }
}
