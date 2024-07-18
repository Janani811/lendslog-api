import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { LendsRepository } from 'src/database/repositories/Lends.Repository';

@Injectable()
export class LendsService {
  constructor(private lendsRepository: LendsRepository) {}

  // get all lends
  async getAll(data) {
    try {
      return await this.lendsRepository.getAll(data);
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  // create lend
  async create(dto: any) {
    try {
      await this.lendsRepository.addLend(dto);
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
}
