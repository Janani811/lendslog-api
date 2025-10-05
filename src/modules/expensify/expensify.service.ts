/* eslint-disable prettier/prettier */
import { Injectable, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';

import {
  CreateBankAccountDto,
  CreateStarredTransactionDto,
  ExpensifySignUpDto,
  TransactionDto,
} from './dto/auth.dto';
import { ExpensifyUserRepository } from 'src/database/repositories/ExpensifyUser.repository';
import { ExpensifyTransactionsRepository } from 'src/database/repositories/ExpensifyTransactions.repository';
import { ExpensifyTransactionsCategoryRepository } from 'src/database/repositories/ExpensifyTransactionsCategory.repository';
import {
  InsertExpensifyBankAccounts,
  InsertExpensifyTransactionCategories,
  InsertExpensifyTransactions,
  SelectExpensifyTransactionCategories,
  SelectExpensifyUser,
} from 'src/database/schemas/schema';
import { ExpensifyBankAccountRepository } from 'src/database/repositories/ExpensifyBankAccounts.repository';
import { ExpStarredTransactionsRepository } from 'src/database/repositories/ExpStarredTransactions.repository';
import { ExpensifyNotificationTokenRepository } from 'src/database/repositories/ExpensifyNotificationToken.repository';

@Injectable()
export class ExpensifyService {
  constructor(
    private usersRepository: ExpensifyUserRepository,
    private expensifyTransactionsRepository: ExpensifyTransactionsRepository,
    private expensifyTransactionsCategoryRepository: ExpensifyTransactionsCategoryRepository,
    private expensifyBankAccountRepository: ExpensifyBankAccountRepository,
    private expStarredTransactionsRepository: ExpStarredTransactionsRepository,
    private expensifyNotificationTokenRepository: ExpensifyNotificationTokenRepository,
  ) {}

  async signup(dto: ExpensifySignUpDto) {
    const existUser = await this.usersRepository.getOne({ id: dto.id });

    if (existUser) {
      throw new HttpException('Your phone number already exists', HttpStatus.BAD_REQUEST);
    }

    try {
      await this.usersRepository.createUser({
        exp_us_name: dto.name,
        exp_us_phone_no: dto.phone,
        exp_us_email: dto.email,
        exp_us_clerk_id: dto.id,
      });
      return;
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  // edit profile
  async editProfile(id: string, dto: ExpensifySignUpDto) {
    try {
      const existUser = await this.usersRepository.getOne({ id });
      if (!existUser) {
        throw new HttpException("Oops!, We can't find you in our database", HttpStatus.BAD_REQUEST);
      }
      let data = {};
      if (dto.delete) {
        data = {
          exp_us_is_deleted: true,
        };
      } else {
        data = {
          exp_us_name: dto.name,
          exp_us_phone_no: dto.phone,
          exp_us_email: dto.email,
        };
      }
      await this.usersRepository.updateUser(data, { exp_us_clerk_id: id });
      const user = await this.usersRepository.getOne({ id });
      return user;
    } catch (e) {
      console.log(e);
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getAllTransactions(
    id: number,
    args: {
      startDate?: string;
      endDate?: string;
      transaction_type?: number;
      transaction_label?: string;
    },
  ) {
    return await this.expensifyTransactionsRepository.getAllTransactions(id, args);
  }
  async getTransaction(id) {
    return await this.expensifyTransactionsRepository.getOne(id);
  }
  async deleteTransaction(id: number) {
    return await this.expensifyTransactionsRepository.deleteTransaction(id);
  }
  async editTransaction(id: number, dto: TransactionDto) {
    return await this.expensifyTransactionsRepository.updateTransaction(id, dto);
  }
  async createTransaction(dto: TransactionDto) {
    const [account] = await this.expensifyBankAccountRepository.getAllBankAccount(
      dto.exp_ts_user_id,
    );
    if (account && !dto.exp_ts_bank_account_id) {
      dto.exp_ts_bank_account_id = account.exp_ba_id;
    }
    return await this.expensifyTransactionsRepository.createTransaction(dto);
  }
  async getAllCategories(id: number) {
    return await this.expensifyTransactionsCategoryRepository.getAllCategories(id);
  }

  async createAccount(dto: CreateBankAccountDto) {
    return await this.expensifyBankAccountRepository.createBankAccount(dto);
  }
  async findAllAccount(userId: number) {
    return await this.expensifyBankAccountRepository.getAllBankAccount(userId);
  }
  async findAccount(accountId: number, userId: number) {
    return await this.expensifyBankAccountRepository.getAccountDetailsWithGroupedTransactionsById(
      accountId,
      userId,
    );
  }
  async updateAccount(id: number, dto: InsertExpensifyBankAccounts) {
    return await this.expensifyBankAccountRepository.updateBankAccount(dto, id);
  }
  async removeAccount(id: number, userId: number) {
    return await this.expensifyBankAccountRepository.deleteBankAccount(id, userId);
  }

  async starTransaction(dto: CreateStarredTransactionDto) {
    return await this.expStarredTransactionsRepository.starTransaction(dto);
  }
  async unstarTransaction(userId: number, transactionId: number) {
    return await this.expStarredTransactionsRepository.unstarTransaction(userId, transactionId);
  }
  async getUserStarredTransactions(userId: number) {
    return await this.expStarredTransactionsRepository.getUserStarredTransactions(userId);
  }
  async isTransactionStarred(userId: number, transactionId: number) {
    return await this.expStarredTransactionsRepository.isTransactionStarred(userId, transactionId);
  }
  async reorderCategories(categories: Partial<SelectExpensifyTransactionCategories>[]) {
    return await this.expensifyTransactionsCategoryRepository.reorderCategories(categories);
  }
  async createCategory(dto: InsertExpensifyTransactionCategories, userId: number) {
    return await this.expensifyTransactionsCategoryRepository.createCategory(dto, userId);
  }
  async updateCategory(dto: InsertExpensifyTransactionCategories, userId: number, id: number) {
    return await this.expensifyTransactionsCategoryRepository.updateCategory(dto, userId, {
      id: id,
    });
  }
  async deleteCategory(id: number, userId: number) {
    return await this.expensifyTransactionsCategoryRepository.deleteCategory(id, userId);
  }
  acceptPushNotification = async (us_id: number, data: { token: string }) => {
    try {
      // update existing device as inactive
      const notificationTokenEntry = await this.expensifyNotificationTokenRepository.getOne({
        exp_ntto_user_id: us_id,
        exp_ntto_token: data.token,
      });

      if (notificationTokenEntry) {
        await this.expensifyNotificationTokenRepository.update(
          { us_id, token: data.token },
          {
            exp_ntto_status: 1,
          },
        );
      } else {
        await this.expensifyNotificationTokenRepository.add({
          exp_ntto_user_id: us_id,
          exp_ntto_status: 1,
          exp_ntto_token: data.token,
        });
      }
    } catch (error) {
      console.log(error);
      throw new HttpException(error.message || 'Something went wrong', HttpStatus.BAD_REQUEST);
    }
  };
  disablePushNotification = async (us_id: number, token: string): Promise<void> => {
    try {
      await this.expensifyNotificationTokenRepository.update(
        { us_id, token },
        {
          exp_ntto_status: 0,
        },
      );
    } catch (error) {
      throw new HttpException(error.message || 'Something went wrong', HttpStatus.BAD_REQUEST);
    }
  };
  async updatePreference(user_id: number, dto: Partial<SelectExpensifyUser>) {
    try {
      const existUser = await this.usersRepository.getOne({ user_id: user_id });
      if (!existUser) {
        throw new HttpException("Oops!, We can't find you in our database", HttpStatus.BAD_REQUEST);
      }
      await this.usersRepository.updateUser(dto, { exp_user_id: user_id });
    } catch (e) {
      console.log(e);
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
  async changeSettings(exp_us_id: number, dto: SelectExpensifyUser) {
    await this.updatePreference(exp_us_id, dto);
  }
  async fetchProfile(id: number) {
    try {
      const user = (await this.usersRepository.getOne({
        user_id: id,
      })) as unknown as SelectExpensifyUser & { reminder_status: number; reminder_time: string };
      const notificationTokenEntry = await this.expensifyNotificationTokenRepository.getOne({
        exp_ntto_user_id: id,
      });

      if (!user) {
        return null;
      }
      user.reminder_status = notificationTokenEntry?.exp_ntto_status;
      user.reminder_time = notificationTokenEntry?.exp_ntto_time;

      return user;
    } catch (e) {
      throw new BadRequestException(e);
    }
  }
  async bulkTransactions(transactions: InsertExpensifyTransactions[]) {
    try {
      await this.expensifyTransactionsRepository.save(transactions);
      return true;
    } catch (e) {
      console.log(e);
      throw new BadRequestException(e);
    }
  }
}
