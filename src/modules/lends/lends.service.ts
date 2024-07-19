import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as moment from 'moment';

import { InstallmentTimelineRepository } from 'src/database/repositories/InstallmentTimelines.repository';
import { LendsRepository } from 'src/database/repositories/Lends.Repository';

import { PaymentTerm } from 'utils/enums';

@Injectable()
export class LendsService {
  constructor(
    private lendsRepository: LendsRepository,
    private installmentRepository: InstallmentTimelineRepository,
  ) {}

  // get all lends
  async getAll(data) {
    try {
      return await this.lendsRepository.getAll(data);
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
