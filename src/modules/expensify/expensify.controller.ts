import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
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
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import moment from 'moment';

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
      const { startDate, endDate, transaction_type, search } = query as {
        startDate: string;
        endDate: string;
        transaction_type?: 'all' | 'income' | 'expense';
        search?: string;
      };
      const data = await this.expensifyService.getAllTransactions(exp_us_id, {
        startDate,
        endDate,
        transaction_type:
          transaction_type === 'income' ? 2 : transaction_type === 'expense' ? 1 : undefined,
        transaction_label: search ? search : undefined,
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
  @Get('export-excel')
  async exportTransactions(@Req() req: ExpressWithUser, @Res() res: Express.Response) {
    const {
      user: { exp_us_id },
      query,
    } = req;
    const {
      startDate,
      endDate,
      format = 'xlsx',
      transaction_type = 'all',
    } = query as {
      startDate: string;
      endDate: string;
      format?: 'xlsx' | 'csv';
      transaction_type?: 'all' | 'income' | 'expense';
    };

    const transactions = await this.expensifyService.getAllTransactions(exp_us_id, {
      startDate,
      endDate,
      transaction_type:
        transaction_type === 'income' ? 2 : transaction_type === 'expense' ? 1 : undefined,
    });

    if (!transactions || transactions.length === 0) {
      return res
        .status(204)
        .json({ message: 'No transactions found for the selected date range.' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(
      `Transactions Report (${moment(startDate).format('DD-MM-YYYY')} - ${moment(endDate).format('DD-MM-YYYY')})`,
    );

    worksheet.columns = [
      { header: 'No', key: 'id', width: 5 },
      { header: 'Account Name', key: 'account_name', width: 15 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Transactions Type', key: 'transactions_type', width: 10 },
      { header: 'Usage', key: 'title', width: 20 },
      { header: 'Amount', key: 'amount', width: 15 },
    ];

    transactions.forEach((t, index) => {
      worksheet.addRow({
        id: index + 1,
        title: t.exp_ts_title,
        amount: t.exp_ts_amount,
        category: t.exp_ts_category || '',
        transactions_type: t.exp_ts_transaction_type || '',
        date: t.exp_ts_date
          ? `${moment(`${t.exp_ts_date} ${t.exp_ts_time}`, 'YYYY-MM-DD hh:mm a').format(
              'DD/MM/YYYY hh:mm A',
            )}`
          : '',
        account_name: t.exp_ba_name,
      });
    });

    worksheet.getRow(1).font = { bold: true };

    const fileName = `transactions-${moment().format('DD-MM-YYYY_HH-mm-ss')}.${format === 'csv' ? 'csv' : 'xlsx'}`;

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      const buffer = await workbook.csv.writeBuffer();
      res.end(buffer);
    } else {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      const buffer = await workbook.xlsx.writeBuffer();
      res.end(buffer);
    }
  }

  @Get('export-pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename=transactions.pdf')
  async exportTransactionsAsPDF(@Req() req: ExpressWithUser, @Res() res: Express.Response) {
    const {
      user: { exp_us_id },
      query,
    } = req;
    const {
      startDate,
      endDate,
      transaction_type = 'all',
    } = query as {
      startDate: string;
      endDate: string;
      format?: 'xlsx' | 'csv';
      transaction_type?: 'all' | 'income' | 'expense';
    };

    const transactions = await this.expensifyService.getAllTransactions(exp_us_id, {
      startDate,
      endDate,
      transaction_type:
        transaction_type === 'income' ? 2 : transaction_type === 'expense' ? 1 : undefined,
    });

    if (!transactions || transactions.length === 0) {
      return res
        .status(204)
        .json({ message: 'No transactions found for the selected date range.' });
    }

    const doc = new PDFDocument({
      bufferPages: true,
      size: 'A3',
      margin: 35,
    });

    doc.pipe(res);

    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor('black')
      .text(
        `Transactions Report (${moment(startDate).format('DD/MM/YYYY')} - ${moment(endDate).format('DD/MM/YYYY')})`,
        { align: 'center' },
      );
    doc.moveDown();

    doc
      .font('Helvetica')
      .fontSize(12)
      .table({
        columnStyles: ['40', '*', '*', '*', '*', '*', '*'],
        rowStyles: (row) =>
          row === 0
            ? {
                backgroundColor: '#ccc',
                border: 1,
              }
            : {},
        data: [
          [
            {
              text: 'No',
              font: 'Helvetica-Bold',
            },
            {
              text: 'Account Name',
              font: 'Helvetica-Bold',
            },
            {
              text: 'Date',
              font: 'Helvetica-Bold',
            },
            {
              text: 'Category',
              font: 'Helvetica-Bold',
            },
            {
              text: 'Transaction Type',
              font: 'Helvetica-Bold',
            },
            {
              text: 'Usage',
              font: 'Helvetica-Bold',
            },
            {
              text: 'Amount',
              font: 'Helvetica-Bold',
            },
          ],
          ...transactions.map((t, index) => [
            String(index + 1),
            t.exp_ba_name,
            moment(t.exp_ts_date).format('DD/MM/YYYY') + ' ' + t.exp_ts_time || '',
            t.exp_ts_category || '',
            t.exp_ts_transaction_type || '',
            t.exp_ts_title,
            t.exp_ts_amount,
          ]),
        ],
      });

    doc.end();
  }
  @Post('enable-notification')
  async enablePush(
    @Body() body: { token: string; time: string },
    @Req() req: ExpressWithUser,
    @Res() res: Express.Response,
  ) {
    try {
      const {
        user: { exp_us_id },
      } = req;
      await this.expensifyService.acceptPushNotification(exp_us_id, body);
      return res.status(200).json({ message: 'Enabled successfully' });
    } catch (error) {
      console.error(error);
      return res.status(401).json({ error: error.message });
    }
  }

  @Put('disable-notification')
  async disablePush(
    @Body() body: { token: string },
    @Req() req: ExpressWithUser,
    @Res() res: Express.Response,
  ) {
    try {
      const {
        user: { exp_us_id },
      } = req;
      await this.expensifyService.disablePushNotification(exp_us_id, body.token);
      return res.status(200).json({ message: 'Enabled successfully' });
    } catch (error) {
      console.error(error);
      return res.status(401).json({ error: error.message });
    }
  }
  @Post('setting-changes')
  async setCurrency(@Body() dto, @Req() req: ExpressWithUser, @Res() res: Express.Response) {
    try {
      const {
        user: { exp_us_id },
      } = req;
      await this.expensifyService.changeSettings(exp_us_id, dto);
      return res.status(200).json({ message: 'Enabled successfully' });
    } catch (error) {
      console.error(error);
      return res.status(401).json({ error: error.message });
    }
  }
}
