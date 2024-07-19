import { Body, Controller, Get, Post, Request, Response } from '@nestjs/common';

import { LendsService } from './lends.service';
import { AddLend } from './dto/lends.dto';

@Controller('lends')
export class LendsController {
  constructor(public lendsService: LendsService) {}

  // get all lends
  @Get('all')
  async getAllLends(@Request() req, @Response() res) {
    try {
      const lends = await this.lendsService.getAll({
        ld_lender_id: req.user.us_id,
      });
      return res.status(200).json(lends);
    } catch (error) {
      return res.status(403).json({ error: error.message });
    }
  }

  // create lend
  @Post()
  async add(@Request() req, @Response() res, @Body() dto: AddLend) {
    try {
      console.log(dto);
      const temp_amount: number =
        Number(dto.ld_lend_amount * (dto.ld_interest_rate / 100)) * 10;
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
      await this.lendsService.create({
        ...dto,
        ld_lender_id: req.user.us_id,
        ld_interest_amount: ld_interest_amount,
        ld_total_weeks_or_month: Number(dto.ld_total_weeks_or_month),
        ld_lend_amount: Number(dto.ld_lend_amount),
        ld_principal_repayment: ld_principal_repayment,
        ld_start_date: new Date(dto.ld_start_date),
      });
      return res.status(200).json({
        message: 'Lend added successfully',
      });
    } catch (error) {
      return res.status(403).json({ error: error.message });
    }
  }
}
