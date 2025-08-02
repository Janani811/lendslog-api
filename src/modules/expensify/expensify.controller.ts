import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';

import { ExpensifyService } from './expensify.service';

import { verifyWebhook } from '@clerk/backend/webhooks';
import { UserJSON } from '@clerk/backend';
import * as Express from 'express';
import { ExpressWithUser } from './type';
import {
  InsertExpensifyBankAccounts,
  InsertExpensifyTransactionCategories,
  SelectExpensifyTransactionCategories,
} from 'src/database/schemas/schema';
import {
  CreateBankAccountDto,
  CreateStarredTransactionDto,
  TransactionDto,
  UpdateBankAccountDto,
} from './dto/auth.dto';

@Controller('expensify')
export class ExpensifyController {
  constructor(private expensifyService: ExpensifyService) {}

  @Post('clerk/webhook')
  async getAll(@Req() req: Express.Request, @Res() res: Express.Response) {
    try {
      const headers = {
        get: (key: string) => {
          const foundKey = Object.keys(req.headers).find(
            (k) => k.toLowerCase() === key.toLowerCase(),
          );
          if (!foundKey) return null;
          const val = req.headers[foundKey];
          if (Array.isArray(val)) return val.join(',');
          return val;
        },
      };

      const fetchLikeRequest: any = {
        headers: headers,
        method: req.method,
        body: req.body,
        url: req.originalUrl,
        text: async () => {
          if (!req.body) {
            throw new Error('Raw body missing');
          }
          return req.body.toString('utf8');
        },
      };
      const evt = await verifyWebhook(fetchLikeRequest, {
        signingSecret: process.env.CLERK_WEBHOOK_SIGNING_SECRET,
      });
      const { id, phone_numbers, email_addresses, first_name } = evt.data as unknown as UserJSON;
      const eventType = evt.type;

      if (!id) {
        return res.status(400).json({ error: 'Missing Clerk user id or email in webhook payload' });
      }

      switch (eventType) {
        case 'user.created':
          const email = email_addresses?.[0]?.email_address;
          const phone = phone_numbers?.[0]?.phone_number;
          const name = first_name;
          await this.expensifyService.signup({ phone, name, email, id });
          return res.status(201).json({ message: 'User created successfully' });
        case 'user.updated':
          await this.expensifyService.editProfile(id, { phone, name, email });
          return res.status(200).json({ message: 'User updated successfully' });
        case 'user.deleted':
          await this.expensifyService.editProfile(id, { delete: true });
          return res.status(200).json({ message: 'User deleted successfully' });
        default:
          break;
      }
      return res.status(200).json({ message: 'User response received' });
    } catch (error) {
      console.log(error);
      return res.status(403).json({ error: error.message });
    }
  }
  @Get('transactions')
  async getTransactions(@Req() req: ExpressWithUser, @Res() res: Express.Response) {
    try {
      const {
        user: { exp_us_id },
        query,
      } = req;
      const { startDate, endDate } = query as { startDate: string; endDate: string };
      const data = await this.expensifyService.getAllTransactions(exp_us_id, {
        startDate,
        endDate,
      });
      return res.status(200).json(data);
    } catch (error) {
      console.log(error);
      return res.status(403).json({ error: error.message });
    }
  }
  @Post('transactions')
  async createTransaction(
    @Req() req: ExpressWithUser,
    @Res() res: Express.Response,
    @Body() body: TransactionDto,
  ) {
    try {
      const {
        user: { exp_us_id },
      } = req;
      body.exp_ts_user_id = exp_us_id;

      if (body.exp_tc_id === undefined || body.exp_tt_id === undefined) {
        return res.status(400).json({ error: 'Missing required fields: exp_tc_id or exp_tt_id' });
      }

      const insertBody = body;
      await this.expensifyService.createTransaction(insertBody);
      return res.status(200).json({ message: 'Successfully added' });
    } catch (error) {
      console.log(error);
      return res.status(403).json({ error: error.message });
    }
  }
  @Get('transaction/:id')
  async getTransaction(@Req() req: ExpressWithUser, @Res() res: Express.Response) {
    try {
      const { params } = req;
      const { id } = params as unknown as { id: number };
      const [data] = await this.expensifyService.getTransaction(id);
      return res.status(200).json(data);
    } catch (error) {
      console.log(error);
      return res.status(403).json({ error: error.message });
    }
  }
  @Put('transaction/:id')
  async editTransaction(
    @Req() req: ExpressWithUser,
    @Res() res: Express.Response,
    @Body() body: TransactionDto,
  ) {
    try {
      const {
        params,
        user: { exp_us_id },
      } = req;
      const { id } = params as unknown as { id: number };

      if (body.exp_tc_id === undefined || body.exp_tt_id === undefined) {
        return res.status(400).json({ error: 'Missing required fields: exp_tc_id or exp_tt_id' });
      }

      body.exp_ts_user_id = exp_us_id;

      const insertBody = body;
      await this.expensifyService.editTransaction(id, insertBody);
      return res.status(200).json({ message: 'Updated successfully' });
    } catch (error) {
      console.log(error);
      return res.status(403).json({ error: error.message });
    }
  }
  @Delete('transaction/:id')
  deleteTransaction(@Param('id', ParseIntPipe) id: number) {
    return this.expensifyService.deleteTransaction(id);
  }

  @Get('categories')
  async getCategories(@Req() req: ExpressWithUser, @Res() res: Express.Response) {
    try {
      const {
        user: { exp_us_id },
      } = req;
      const data = await this.expensifyService.getAllCategories(exp_us_id);
      return res.status(200).json(data);
    } catch (error) {
      console.log(error);
      return res.status(403).json({ error: error.message });
    }
  }

  @Post('categories')
  async createCategory(
    @Req() req: ExpressWithUser,
    @Res() res: Express.Response,
    @Body() dto: InsertExpensifyTransactionCategories,
  ) {
    try {
      const {
        user: { exp_us_id },
      } = req;
      await this.expensifyService.createCategory(dto, exp_us_id);
      return res.status(200).json({ message: 'Category created successfully' });
    } catch (error) {
      console.log(error);
      return res.status(403).json({ error: error.message });
    }
  }

  @Put('categories/:id')
  async updateCategory(
    @Req() req: ExpressWithUser,
    @Param('id') id: string,
    @Body() dto: InsertExpensifyTransactionCategories,
  ) {
    const {
      user: { exp_us_id },
    } = req;
    return this.expensifyService.updateCategory(dto, exp_us_id, Number(id));
  }

  @Patch('categories/reorder')
  async reorderCategories(@Body() dto: Partial<SelectExpensifyTransactionCategories>[]) {
    return this.expensifyService.reorderCategories(dto);
  }
  @Delete('categories/:id')
  async delete(@Req() req: ExpressWithUser, @Param('id', ParseIntPipe) id: number) {
    const {
      user: { exp_us_id },
    } = req;
    return this.expensifyService.deleteCategory(id, exp_us_id);
  }

  @Post('accounts')
  create(@Body() dto: CreateBankAccountDto, @Req() req: ExpressWithUser) {
    const {
      user: { exp_us_id },
    } = req;
    dto.exp_ba_user_id = exp_us_id;
    return this.expensifyService.createAccount(dto);
  }

  @Get('accounts')
  findAll(@Req() req: ExpressWithUser) {
    const {
      user: { exp_us_id },
    } = req;
    return this.expensifyService.findAllAccount(exp_us_id);
  }

  @Get('accounts/:id')
  findOne(@Req() req: ExpressWithUser, @Param('id', ParseIntPipe) id: number) {
    const {
      user: { exp_us_id },
    } = req;
    return this.expensifyService.findAccount(id, exp_us_id);
  }

  @Put('accounts/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBankAccountDto) {
    const insertDto = dto as unknown as InsertExpensifyBankAccounts;
    return this.expensifyService.updateAccount(id, insertDto);
  }

  @Delete('accounts/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.expensifyService.removeAccount(id);
  }

  @Post('starred')
  async starTransaction(@Body() dto: CreateStarredTransactionDto) {
    return this.expensifyService.starTransaction(dto);
  }

  @Delete('starred/:transactionId')
  async unstarTransaction(
    @Param('transactionId', ParseIntPipe) transactionId: number,
    @Query('userId', ParseIntPipe) userId: number, // or use Auth
  ) {
    return this.expensifyService.unstarTransaction(userId, transactionId);
  }

  @Get('starred')
  async getAllStarred(@Req() req: ExpressWithUser) {
    const {
      user: { exp_us_id },
    } = req;
    return this.expensifyService.getUserStarredTransactions(exp_us_id);
  }

  @Get('starred/:transactionId')
  async isTransactionStarred(
    @Param('transactionId', ParseIntPipe) transactionId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.expensifyService.isTransactionStarred(userId, transactionId);
  }
}
