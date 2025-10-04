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
    const selectedAcc = await this.dbObject.db.query.expBankAccounts.findFirst({
      where: (expBankAccounts, { eq }) => {
        return and(
          eq(expBankAccounts.exp_ba_id, data.exp_ts_bank_account_id),
          eq(expBankAccounts.exp_ba_is_active, 1),
        );
      },
    });
    if (!selectedAcc) {
      throw new Error('Your bank account not active');
    }
    const transaction = data as unknown as InsertExpensifyTransactions;

    const currentBalance = parseFloat(selectedAcc.exp_ba_balance) || 0;
    const transactionAmount = parseFloat(data.exp_ts_amount) || 0;

    const amount =
      data.exp_tt_id === 1
        ? currentBalance - transactionAmount
        : currentBalance + transactionAmount;
    await this.dbObject.db
      .update(expBankAccounts)
      .set({
        exp_ba_balance: amount.toFixed(2),
      })
      .where(eq(expBankAccounts.exp_ba_id, selectedAcc.exp_ba_id))
      .returning();

    const [row] = await this.dbObject.db.insert(expTransactions).values(transaction).returning();
    if (isStarred) {
      await this.expStarredTransactionsRepository.starTransaction({
        exp_st_user_id: transaction.exp_ts_user_id,
        exp_st_transaction_id: row.exp_ts_id,
      });
    }
  }
  async save(transactions: InsertExpensifyTransactions[]) {
    const selectedAcc = await this.dbObject.db.query.expBankAccounts.findFirst({
      where: (expBankAccounts, { eq }) => {
        return and(
          eq(expBankAccounts.exp_ba_id, transactions[0].exp_ts_bank_account_id),
          eq(expBankAccounts.exp_ba_is_active, 1),
        );
      },
    });
    if (!selectedAcc) {
      throw new Error('Your bank account not active');
    }
    const currentBalance = parseFloat(selectedAcc.exp_ba_balance) || 0;

    const totalTransactionAmount = transactions.reduce((sum, tx) => {
      const amount = Number(tx.exp_ts_amount) || 0;
      return tx.exp_ts_transaction_type === 1 ? sum - amount : sum + amount;
    }, 0);

    const newBalance = (currentBalance + totalTransactionAmount).toFixed(2);

    await this.dbObject.db.transaction(async (tx) => {
      await tx.insert(expTransactions).values(transactions).returning();
      await tx
        .update(expBankAccounts)
        .set({ exp_ba_balance: newBalance })
        .where(eq(expBankAccounts.exp_ba_id, selectedAcc.exp_ba_id))
        .returning();
    });

    return true;
  }
  async updateTransaction(id: number, data: TransactionDto) {
    const isStarred = data.exp_st_id;
    delete data.exp_st_id;

    const existingTransaction = await this.dbObject.db.query.expTransactions.findFirst({
      where: (expTransactions, { eq }) => eq(expTransactions.exp_ts_id, id),
    });

    if (!existingTransaction) {
      throw new Error('Transaction not found');
    }

    const transaction = data as unknown as InsertExpensifyTransactions;

    const oldAccountId = existingTransaction.exp_ts_bank_account_id;
    const newAccountId = transaction.exp_ts_bank_account_id;

    const currAcc = await this.dbObject.db.query.expBankAccounts.findFirst({
      where: (expBankAccounts, { eq }) =>
        and(eq(expBankAccounts.exp_ba_id, oldAccountId), eq(expBankAccounts.exp_ba_is_active, 1)),
    });

    const newAcc = await this.dbObject.db.query.expBankAccounts.findFirst({
      where: (expBankAccounts, { eq }) =>
        and(eq(expBankAccounts.exp_ba_id, newAccountId), eq(expBankAccounts.exp_ba_is_active, 1)),
    });

    if (!currAcc || !newAcc) {
      throw new Error('Bank account not found or inactive');
    }

    const oldAmount = parseFloat(existingTransaction.exp_ts_amount) || 0;
    const newAmount = parseFloat(transaction.exp_ts_amount as any) || 0;

    const isExpense = transaction.exp_ts_transaction_type === 1;

    const oldType = existingTransaction.exp_ts_transaction_type;
    const newType = data.exp_tt_id;

    await this.dbObject.db.transaction(async (tx) => {
      await tx
        .update(expTransactions)
        .set(data)
        .where(eq(expTransactions.exp_ts_id, id))
        .returning();

      if (oldAccountId === newAccountId) {
        let balanceChange = parseFloat(currAcc.exp_ba_balance);

        if (oldType === newType) {
          if (newType === 1) {
            balanceChange += oldAmount - newAmount;
          } else {
            balanceChange += newAmount - oldAmount;
          }
        } else {
          if (newType === 1) {
            balanceChange -= oldAmount + newAmount;
          } else {
            balanceChange += oldAmount + newAmount;
          }
        }

        await tx
          .update(expBankAccounts)
          .set({
            exp_ba_balance: balanceChange.toFixed(2),
          })
          .where(eq(expBankAccounts.exp_ba_id, oldAccountId))
          .returning();
      } else {
        const oldAccountAdjustment =
          existingTransaction.exp_ts_transaction_type === 1
            ? parseFloat(currAcc.exp_ba_balance) + oldAmount
            : parseFloat(currAcc.exp_ba_balance) - oldAmount;
        const newAccountAdjustment = isExpense
          ? parseFloat(newAcc.exp_ba_balance) - newAmount
          : parseFloat(newAcc.exp_ba_balance) + newAmount;

        await tx
          .update(expBankAccounts)
          .set({
            exp_ba_balance: oldAccountAdjustment.toFixed(2),
          })
          .where(eq(expBankAccounts.exp_ba_id, oldAccountId))
          .returning();

        await tx
          .update(expBankAccounts)
          .set({
            exp_ba_balance: newAccountAdjustment.toFixed(2),
          })
          .where(eq(expBankAccounts.exp_ba_id, newAccountId))
          .returning();
      }
    });

    if (isStarred) {
      await this.expStarredTransactionsRepository.starTransaction({
        exp_st_user_id: transaction.exp_ts_user_id,
        exp_st_transaction_id: id,
      });
    } else {
      await this.expStarredTransactionsRepository.unstarTransaction(transaction.exp_ts_user_id, id);
    }

    return true;
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
      .orderBy(desc(expTransactions.exp_ts_created_at))
      .where(and(...conditions));
  }

  async deleteTransaction(id: number) {
    const existingTransaction = await this.dbObject.db.query.expTransactions.findFirst({
      where: (expTransactions, { eq }) => eq(expTransactions.exp_ts_id, id),
    });

    if (!existingTransaction) {
      throw new Error('Transaction not found');
    }

    const accountId = existingTransaction.exp_ts_bank_account_id;

    const account = await this.dbObject.db.query.expBankAccounts.findFirst({
      where: (expBankAccounts, { eq }) =>
        and(eq(expBankAccounts.exp_ba_id, accountId), eq(expBankAccounts.exp_ba_is_active, 1)),
    });

    if (!account) {
      throw new Error('Bank account not found or inactive');
    }

    const currentBalance = parseFloat(account.exp_ba_balance);
    const isExpense = existingTransaction.exp_ts_transaction_type === 1;
    const transactionAmount = parseFloat(existingTransaction.exp_ts_amount);

    const updatedBalance = isExpense
      ? currentBalance + transactionAmount
      : currentBalance - transactionAmount;

    await this.dbObject.db.transaction(async (tx) => {
      await tx.delete(expTransactions).where(eq(expTransactions.exp_ts_id, id)).returning();

      await tx
        .update(expBankAccounts)
        .set({
          exp_ba_balance: updatedBalance.toFixed(2),
        })
        .where(eq(expBankAccounts.exp_ba_id, accountId))
        .returning();
    });

    return true;
  }
}
