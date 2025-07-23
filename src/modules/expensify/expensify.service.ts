/* eslint-disable prettier/prettier */
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { ExpensifySignUpDto } from './dto/auth.dto';
import { ExpensifyUserRepository } from 'src/database/repositories/ExpensifyUser.repository';

@Injectable()
export class ExpensifyService {
  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    private usersRepository: ExpensifyUserRepository,
    // private twilioService: TwilioService,
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
        }
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
}
