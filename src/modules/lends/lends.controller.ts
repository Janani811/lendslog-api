import { Body, Controller, Delete, Get, Param, Post, Put, Request, Response } from '@nestjs/common';

import { LendsService } from './lends.service';
import { NotificationService } from '../../notification/notification.service';

import { AddLend, EditLend } from './dto/lends.dto';

import { Status } from 'utils/enums';

@Controller('lends')
export class LendsController {
  constructor(
    private lendsService: LendsService,
    private notificationService: NotificationService,
  ) {}

  // get all lends
  @Get('all')
  async getAllLends(@Request() req, @Response() res) {
    try {
      const { allLends, weekLends, monthLends } = await this.lendsService.getAll({
        ld_lender_id: req.user.us_id,
      });
      // await this.notificationService.sendPush();
      return res.status(200).json({ allLends, weekLends, monthLends });
    } catch (error) {
      return res.status(403).json({ error: error.message });
    }
  }
  // get today or pending installments timelines
  @Get('today-installments')
  async getTodayInstallments(@Request() req, @Response() res) {
    try {
      const lends = await this.lendsService.getTodayInstallments(req.user.us_id);
      return res.status(200).json({ todayLends: lends });
    } catch (error) {
      return res.status(403).json({ error: error.message });
    }
  }

  @Get(':ld_id')
  async getLend(@Request() req, @Response() res, @Param() param) {
    try {
      const lends = await this.lendsService.getOne({
        ld_id: param.ld_id,
      });
      if (!lends) {
        return res.status(400).json({ error: 'The requested lend detail was not found' });
      }
      return res.status(200).json(lends);
    } catch (error) {
      return res.status(403).json({ error: error.message });
    }
  }

  @Put(':ld_id/installment')
  async payInstallment(@Request() req, @Response() res, @Param() param, @Body() body) {
    try {
      const data: number[] = body;

      // check if lend exist
      const lend = await this.lendsService.getOne({
        ld_id: param.ld_id,
      });
      // return message if not exist
      if (!lend) {
        return res.status(400).json({ error: 'The requested lend detail was not found' });
      }

      // update installment timeline as completed
      await this.lendsService.updateInstallementTimeLines(
        { it_installement_status: Status.Completed },
        { it_lend_id: param.ld_id, it_ids: data },
      );

      const pendingInstallmentCount = await this.lendsService.getPendingInstallment({
        ld_id: param.ld_id,
        status: Status.Pending,
      });

      if (pendingInstallmentCount === 0) {
        await this.lendsService.update({ ld_lend_status: 2 }, param.ld_id);
      }

      // fetch pending installment lends
      const lendsWithPendingInstallments = await this.lendsService.getTodayInstallments(
        req.user.us_id,
      );
      return res
        .status(200)
        .json({ todayLends: lendsWithPendingInstallments, message: 'Updated successfully' });
    } catch (error) {
      return res.status(403).json({ error: error.message });
    }
  }

  @Delete(':ld_id')
  async deleteLend(@Request() req, @Response() res, @Param() param) {
    try {
      const lends = await this.lendsService.getOne({
        ld_id: param.ld_id,
      });
      if (!lends) {
        return res.status(400).json({ error: 'The requested lend detail was not found' });
      }
      await this.lendsService.updateInstallementTimeLines(
        { it_is_deleted: 1 },
        { it_lend_id: param.ld_id },
      );
      await this.lendsService.update({ ld_is_deleted: 1 }, param.ld_id);
      return res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
      return res.status(403).json({ error: error.message });
    }
  }

  // create lend
  @Post()
  async add(@Request() req, @Response() res, @Body() dto: AddLend) {
    try {
      console.log(dto);
      // console.log(moment(new Date(dto.ld_start_date), 'YYYY-MM-DD').add(7, 'days').toDate());
      const temp_amount: number = Number(dto.ld_lend_amount * (dto.ld_interest_rate / 100)) * 10;
      // calculate interest amount
      const ld_interest_amount: number =
        (temp_amount - dto.ld_lend_amount) / dto.ld_total_weeks_or_month;
      // calculate per term pay on actual lend amount
      const ld_principal_repayment: number =
        Number(temp_amount / dto.ld_total_weeks_or_month) - ld_interest_amount;
      if (!dto.ld_is_nominee) {
        delete dto.ld_nominee_name;
        delete dto.ld_nominee_phoneno;
        delete dto.ld_nominee_address;
        delete dto.ld_nominee_notes;
      }
      if (!dto.ld_is_surety) {
        delete dto.ld_surety_type;
        delete dto.ld_surety_notes;
      }

      // create
      const [lend] = await this.lendsService.create({
        ...dto,
        ld_lender_id: req.user.us_id,
        ld_interest_amount: ld_interest_amount,
        ld_total_weeks_or_month: dto.ld_total_weeks_or_month,
        ld_lend_amount: dto.ld_lend_amount,
        ld_principal_repayment: ld_principal_repayment,
        ld_start_date: new Date(dto.ld_start_date),
        ld_lend_status: 1,
      });

      await this.lendsService.createInstallementTimeLines({
        it_lend_id: lend.ld_id,
        startDate: lend.ld_start_date,
        totalWeeksOrMonths: Number(lend.ld_total_weeks_or_month),
        paymentTerm: lend.ld_payment_term,
        termAmount: ld_principal_repayment + ld_interest_amount,
      });
      return res.status(200).json({
        message: 'Lend added successfully',
      });
    } catch (error) {
      return res.status(403).json({ error: error.message });
    }
  }

  // edit lend
  @Put(':ld_id')
  async edit(@Request() req, @Response() res, @Body() dto: EditLend, @Param() param) {
    try {
      const ld_id = param.ld_id;

      if (!dto.ld_is_nominee) {
        delete dto.ld_nominee_name;
        delete dto.ld_nominee_phoneno;
        delete dto.ld_nominee_address;
        delete dto.ld_nominee_notes;
      }
      if (!dto.ld_is_surety) {
        delete dto.ld_surety_type;
        delete dto.ld_surety_notes;
      }

      // create
      await this.lendsService.update(
        {
          ...dto,
        },
        ld_id,
      );

      const lend = await this.lendsService.getOne({
        ld_id: param.ld_id,
      });

      return res.status(200).json({
        message: 'Lend update successfully',
        lend,
      });
    } catch (error) {
      console.log(error);
      return res.status(403).json({ error: error.message });
    }
  }

  // get all installment timelines of specific lend
  @Get('installments/:it_lend_id')
  async getAllInstallments(@Request() req, @Response() res, @Param() params) {
    try {
      const lends = await this.lendsService.getAllInstallments({
        it_lend_id: params.it_lend_id,
      });
      return res.status(200).json(lends);
    } catch (error) {
      return res.status(403).json({ error: error.message });
    }
  }
}
