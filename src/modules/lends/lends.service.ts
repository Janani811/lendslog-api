import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as moment from 'moment';

import { InstallmentTimelineRepository } from 'src/database/repositories/InstallmentTimelines.repository';
import { LendsRepository } from '../../database/repositories/Lends.repository';

import { PaymentTerm, Status } from '../../../utils/enums';
import { UserRepository } from 'src/database/repositories/User.repository';
import { NotificationRepository } from 'src/database/repositories/Notification.repository';

@Injectable()
export class LendsService {
  constructor(
    private lendsRepository: LendsRepository,
    private installmentRepository: InstallmentTimelineRepository,
    private userRepository: UserRepository,
    private notificationRepository: NotificationRepository,
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
  // update lend
  async update(dto: any, id: number) {
    try {
      return await this.lendsRepository.updateLend(dto, id);
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
    termAmount,
  }: {
    it_lend_id: number;
    startDate: string;
    totalWeeksOrMonths: number;
    paymentTerm: number;
    termAmount: number;
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
      estimatedInstallmentDates.push({
        it_installment_date: lastDate.toDate(),
        it_lend_id,
        it_term_amount: termAmount,
        it_order: 1,
      });
      for (let i = 2; i <= totalWeeksOrMonths; i++) {
        const currentDate = lastDate.add(count, 'days').toDate();
        lastDate = moment(lastDate, 'YYYY-MM-DD');
        estimatedInstallmentDates.push({
          it_installment_date: currentDate,
          it_lend_id,
          it_term_amount: termAmount,
          it_order: i,
        });
      }
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
  // get today pending installment_timelines
  async getTodayInstallments(user_id: number) {
    try {
      const lends = await this.installmentRepository.getAllPending(user_id);
      const groupedResponse = lends.reduce((acc, installment) => {
        const {
          ld_id,
          ld_borrower_name,
          ld_borrower_phoneno,
          it_id,
          it_installment_date,
          it_installement_status,
          it_term_amount,
        } = installment;

        if (!acc[ld_id]) {
          acc[ld_id] = {
            ld_id,
            ld_borrower_name,
            ld_borrower_phoneno,
            it_term_amount,
            pending_installments: [],
            total_pending_amount: 0,
          };
        }

        acc[ld_id].pending_installments.push({
          it_id,
          it_installment_date,
          it_installement_status,
          it_term_amount,
        });

        if (it_term_amount) {
          acc[ld_id].total_pending_amount += Number(it_term_amount);
        }

        return acc;
      }, {});
      const result = Object.values(groupedResponse);
      return result;
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
}
