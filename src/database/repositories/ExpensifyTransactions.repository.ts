import { Inject } from '@nestjs/common';
import { and, desc, eq, gte, ilike, lt } from 'drizzle-orm';

import { DB } from '../database.constants';
import { Database } from '../types/Database';

import {
  expBankAccounts,
  expStarredTransactions,
  expTransactionCategories,
  expTransactions,
  expTransactionTypes,
  InsertExpensifyTransactions,
} from '../schemas/schema';
import { TransactionDto } from 'src/modules/expensify/dto/auth.dto';
import { ExpStarredTransactionsRepository } from './ExpStarredTransactions.repository';

export class ExpensifyTransactionsRepository {
  constructor(
    @Inject(DB)
    private readonly dbObject: Database,
    private expStarredTransactionsRepository: ExpStarredTransactionsRepository,
  ) {}

  async getOne(id: number) {
    return await this.dbObject.db
      .select({
        exp_ts_id: expTransactions.exp_ts_id,
        exp_ts_title: expTransactions.exp_ts_title,
        exp_ts_date: expTransactions.exp_ts_date,
        exp_ts_note: expTransactions.exp_ts_note,
        exp_ts_time: expTransactions.exp_ts_time,
        exp_ts_amount: expTransactions.exp_ts_amount,
        exp_ts_created_at: expTransactions.exp_ts_created_at,
        exp_ts_updated_at: expTransactions.exp_ts_updated_at,
        exp_ts_category: expTransactionCategories.exp_tc_label,
        exp_ts_transaction_type: expTransactionTypes.exp_tt_label,
        exp_tc_id: expTransactionCategories.exp_tc_id,
        exp_tt_id: expTransactionTypes.exp_tt_id,
        exp_st_id: expStarredTransactions.exp_st_id,
        exp_tc_icon: expTransactionCategories.exp_tc_icon,
        exp_tc_icon_bg_color: expTransactionCategories.exp_tc_icon_bg_color,
        exp_ts_bank_account_id: expTransactions.exp_ts_bank_account_id,
      })
      .from(expTransactions)
      .innerJoin(
        expTransactionTypes,
        eq(expTransactions.exp_ts_transaction_type, expTransactionTypes.exp_tt_id),
      )
      .innerJoin(
        expTransactionCategories,
        eq(expTransactions.exp_ts_category, expTransactionCategories.exp_tc_id),
      )
      .leftJoin(
        expStarredTransactions,
        eq(expTransactions.exp_ts_id, expStarredTransactions.exp_st_transaction_id),
      )
      .orderBy(desc(expTransactions.exp_ts_date))
      .where(eq(expTransactions.exp_ts_id, id))
      .limit(1);
  }
  async createTransaction(data: TransactionDto) {
    const isStarred = data.exp_st_id;
    delete data.exp_st_id;
    const transaction = data as unknown as InsertExpensifyTransactions;
    const [row] = await this.dbObject.db.insert(expTransactions).values(transaction).returning();
    if (isStarred) {
      await this.expStarredTransactionsRepository.starTransaction({
        exp_st_user_id: transaction.exp_ts_user_id,
        exp_st_transaction_id: row.exp_ts_id,
      });
    }
  }
  async save(transactions: InsertExpensifyTransactions[]) {
    await this.dbObject.db.transaction(async (tx) => {
      await Promise.all(
        transactions.map(async (item) => {
          await tx.insert(expTransactions).values(item).returning();
        }),
      );
    });
    return true;
  }
  async updateTransaction(id: number, data: TransactionDto) {
    const isStarred = data.exp_st_id;
    delete data.exp_st_id;
    const transaction = data as unknown as InsertExpensifyTransactions;
    await this.dbObject.db
      .update(expTransactions)
      .set(data)
      .where(eq(expTransactions.exp_ts_id, id))
      .returning();
    if (isStarred) {
      await this.expStarredTransactionsRepository.starTransaction({
        exp_st_user_id: transaction.exp_ts_user_id,
        exp_st_transaction_id: id,
      });
    } else {
      await this.expStarredTransactionsRepository.unstarTransaction(transaction.exp_ts_user_id, id);
    }
  }

  async getAllTransactions(
    userId: number,
    args: {
      startDate?: string;
      endDate?: string;
      accountId?: number;
      transaction_type?: number;
      transaction_label?: string;
    },
  ) {
    const conditions = [eq(expTransactions.exp_ts_user_id, userId)];
    if (args.startDate && args.endDate) {
      conditions.push(
        gte(expTransactions.exp_ts_date, args.startDate),
        lt(expTransactions.exp_ts_date, args.endDate),
      );
    }
    if (args.accountId) {
      conditions.push(eq(expTransactions.exp_ts_bank_account_id, args.accountId));
    }
    if (args.transaction_type) {
      conditions.push(eq(expTransactions.exp_ts_transaction_type, args.transaction_type));
    }
    if (args.transaction_label) {
      conditions.push(ilike(expTransactions.exp_ts_title, `%${args.transaction_label}%`));
    }
    return await this.dbObject.db
      .select({
        exp_ts_id: expTransactions.exp_ts_id,
        exp_ts_title: expTransactions.exp_ts_title,
        exp_ts_date: expTransactions.exp_ts_date,
        exp_ts_note: expTransactions.exp_ts_note,
        exp_ts_time: expTransactions.exp_ts_time,
        exp_ts_amount: expTransactions.exp_ts_amount,
        exp_ts_category: expTransactionCategories.exp_tc_label,
        exp_ts_transaction_type: expTransactionTypes.exp_tt_label,
        exp_tc_id: expTransactionCategories.exp_tc_id,
        exp_tc_icon: expTransactionCategories.exp_tc_icon,
        exp_tc_icon_bg_color: expTransactionCategories.exp_tc_icon_bg_color,
        exp_tt_id: expTransactionTypes.exp_tt_id,
        exp_ba_id: expBankAccounts.exp_ba_id,
        exp_ba_name: expBankAccounts.exp_ba_name,
      })
      .from(expTransactions)
      .innerJoin(
        expTransactionTypes,
        eq(expTransactions.exp_ts_transaction_type, expTransactionTypes.exp_tt_id),
      )
      .innerJoin(
        expBankAccounts,
        eq(expTransactions.exp_ts_bank_account_id, expBankAccounts.exp_ba_id),
      )
      .innerJoin(
        expTransactionCategories,
        eq(expTransactions.exp_ts_category, expTransactionCategories.exp_tc_id),
      )
      .orderBy(desc(expTransactions.exp_ts_date))
      .where(and(...conditions));
  }
  async deleteTransaction(id: number) {
    await this.dbObject.db.delete(expTransactions).where(eq(expTransactions.exp_ts_id, id));
  }
}
