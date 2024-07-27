/* eslint-disable prettier/prettier */
import {
  Injectable,
  ForbiddenException,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { UserRepository } from '../../database/repositories/User.repository';

import { TwilioService } from './twilio.service';

import { SignInDto, SignUpDto, UpdateUserDto } from './dto/auth.dto';
// import { users } from 'src/database/schemas/schema';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    private usersRepository: UserRepository,
    private twilioService: TwilioService,
  ) {}

  async fetchProfile(id: number) {
    try {
      const user: any = await this.usersRepository.getOne({
        id: id,
      });
      if (!user) {
        return null;
      }
      delete user.us_password;
      delete user.us_password_salt;
      return user;
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async signup(dto: SignUpDto) {
    const existUser = await this.usersRepository.getOne({ phone: dto.phone });

    if (existUser) {
      throw new HttpException('Your phone number already exists', HttpStatus.BAD_REQUEST);
    }

    try {
      const salt = await bcrypt.genSalt(10);
      const hashPass = await bcrypt.hash(dto.password, 10);
      await this.usersRepository.createUser({
        us_name: dto.name,
        us_password: hashPass,
        us_password_salt: salt,
        us_phone_no: dto.phone,
      });
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  async login(dto: SignInDto) {
    const user = await this.usersRepository.getOne({ phone: dto.phone });

    if (!user) {
      throw new ForbiddenException('User not found');
    }
    if (!user.us_active) throw new ForbiddenException('Your account verification is pending');
    // compare password
    const isMatch = await bcrypt.compare(dto.password, user.us_password);

    if (!isMatch) throw new ForbiddenException('Your Credentials are incorrect');

    delete user.us_password;
    delete user.us_password_salt;
    const jwtToken = await this.signInToken(user);
    return { user: user, jwtToken };
  }

  async signInToken(user): Promise<string> {
    const secret = this.config.get('JWT_SECRET');
    try {
      const token = await this.jwtService.sign(
        { ...user },
        {
          secret: secret,
          // expiresIn: process.env.JWT_EXPIRY,
        },
      );
      return token;
    } catch (e) {
      throw new ForbiddenException('Authentication failed');
    }
  }

  async sendVerificationOTP(phoneNumber: string) {
    try {
      const { response } = await this.twilioService.sendOtp(phoneNumber);
      return response;
    } catch (e) {
      throw new ForbiddenException('Failed to send OTP');
    }
  }
  async verifyOTP(phone: string, code: string) {
    try {
      const { response } = await this.twilioService.verifyOtp(phone, code);
      if (response && !response.valid) {
        throw new ForbiddenException('Invalid OTP');
      }
      await this.usersRepository.updateUser({ us_active: true }, { us_phone_no: phone });
      return response;
    } catch (e) {
      console.log(e);
      throw new ForbiddenException('OTP verification failed');
    }
  }

  // edit profile
  async editProfile(us_id: number, dto: UpdateUserDto) {
    try {
      console.log(dto);
      const existUser = await this.usersRepository.getOne({ id: us_id });
      if (!existUser) {
        throw new HttpException("Oops!, We can't find you in our database", HttpStatus.BAD_REQUEST);
      }
      await this.usersRepository.updateUser(dto, { us_id });
      const user = await this.usersRepository.getOne({ id: us_id });
      return user;
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
}
