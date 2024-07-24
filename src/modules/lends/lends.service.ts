import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as moment from 'moment';

import { InstallmentTimelineRepository } from 'src/database/repositories/InstallmentTimelines.repository';
import { LendsRepository } from '../../database/repositories/Lends.repository';

import { PaymentTerm, Status } from 'utils/enums';

@Injectable()
export class LendsService {
  constructor(
    private lendsRepository: LendsRepository,
    private installmentRepository: InstallmentTimelineRepository,
  ) {}

  // get all lends
  async getAll(data) {
    try {
      const allLends = await this.lendsRepository.getAll(data);
      allLends.map((lend: any) => {
        let paidCount: number = 0,
          paidAmount: number = 0,
          pendingAmount: number = 0;
        lend.installmentTimelines.map((installment: any) => {
          if (installment.it_installement_status == Status.Completed) {
            paidCount = paidCount + 1;
          }
        });
        if (paidCount > 0) {
          paidAmount =
            (Number(lend.ld_interest_amount) + Number(lend.ld_principal_repayment)) * paidCount;
          pendingAmount =
            Number(lend.ld_lend_amount) +
            Number(lend.ld_interest_amount * lend.ld_total_weeks_or_month) -
            Number(paidAmount);
        }
        lend.ld_paid_amount = paidAmount.toFixed(2) || 0;
        lend.ld_pending_amount = Number(pendingAmount).toFixed(2) || 0;
        lend.ld_paid_weeks = paidCount || 0;
        lend.ld_pending_weeks = lend.ld_total_weeks_or_month - paidCount || 0;
        lend.ld_lend_amount = Number(lend.ld_lend_amount).toFixed(2);
      });
      const weekLends = allLends.filter((lend) => lend.ld_payment_term === PaymentTerm.Week);
      const monthLends = allLends.filter((lend) => lend.ld_payment_term === PaymentTerm.Month);
      return { allLends, weekLends, monthLends };
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  // get all lends
  async getOne(data) {
    try {
      return await this.lendsRepository.getOne(data);
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  // create lend
  async create(dto: any) {
    try {
      return await this.lendsRepository.addLend(dto);
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  // create installment timelines
  async createInstallementTimeLines({
    it_lend_id,
    startDate,
    totalWeeksOrMonths,
    paymentTerm,
  }: {
    it_lend_id: number;
    startDate: string;
    totalWeeksOrMonths: number;
    paymentTerm: number;
  }) {
    try {
      // create lends Installment logs
      let count = 0;
      if (paymentTerm == PaymentTerm.Week) {
        count = 7; // constant days in week
      } else {
        count = 31; // constant days in month
      }
      const estimatedInstallmentDates = [];
      let lastDate = moment(new Date(startDate), 'YYYY-MM-DD');
      estimatedInstallmentDates.push({ it_installment_date: lastDate.toDate(), it_lend_id });
      for (let i = 0; i < totalWeeksOrMonths - 1; i++) {
        const currentDate = lastDate.add(count, 'days').toDate();
        lastDate = moment(lastDate, 'YYYY-MM-DD');
        estimatedInstallmentDates.push({ it_installment_date: currentDate, it_lend_id });
      }
      console.log(estimatedInstallmentDates, estimatedInstallmentDates.length);
      await this.installmentRepository.addInstallmentTimelines(estimatedInstallmentDates);
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  // get all installment timelines
  async getAllInstallments(data: { it_lend_id: number }) {
    try {
      return await this.installmentRepository.getAll(data);
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
}
