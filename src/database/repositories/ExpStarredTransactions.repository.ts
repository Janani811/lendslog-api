import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, getTableColumns } from 'drizzle-orm';
import { DB } from '../database.constants';
import { Database } from '../types/Database';
import { expTransactions, expStarredTransactions } from '../schemas/schema';
import { CreateStarredTransactionDto } from 'src/modules/expensify/dto/auth.dto';

@Injectable()
export class ExpStarredTransactionsRepository {
  constructor(
    @Inject(DB)
    private readonly dbObject: Database,
  ) {}
  async starTransaction(dto: CreateStarredTransactionDto) {
    const exists = await this.dbObject.db
      .select()
      .from(expStarredTransactions)
      .where(
        and(
          eq(expStarredTransactions.exp_st_user_id, dto.exp_st_user_id),
          eq(expStarredTransactions.exp_st_transaction_id, dto.exp_st_transaction_id),
        ),
      )
      .then((res) => res.length > 0);

    if (exists) return { message: 'Already starred' };

    await this.dbObject.db.insert(expStarredTransactions).values(dto);
    return { message: 'Transaction starred' };
  }

  async unstarTransaction(userId: number, transactionId: number) {
    const deleted = await this.dbObject.db
      .delete(expStarredTransactions)
      .where(
        and(
          eq(expStarredTransactions.exp_st_user_id, userId),
          eq(expStarredTransactions.exp_st_transaction_id, transactionId),
        ),
      );

    if (deleted.rowCount === 0) {
      throw new NotFoundException('Starred transaction not found');
    }

    return { message: 'Transaction unstarred' };
  }

  async getUserStarredTransactions(userId: number) {
    return await this.dbObject.db
      .select({
        ...getTableColumns(expTransactions),
        starred: expStarredTransactions.exp_st_created_at,
      })
      .from(expStarredTransactions)
      .innerJoin(
        expTransactions,
        eq(expStarredTransactions.exp_st_transaction_id, expTransactions.exp_ts_id),
      )
      .where(eq(expStarredTransactions.exp_st_user_id, userId));
  }

  async isTransactionStarred(userId: number, transactionId: number) {
    const result = await this.dbObject.db
      .select()
      .from(expStarredTransactions)
      .where(
        and(
          eq(expStarredTransactions.exp_st_user_id, userId),
          eq(expStarredTransactions.exp_st_transaction_id, transactionId),
        ),
      );

    return { isStarred: result.length > 0 };
  }
}
