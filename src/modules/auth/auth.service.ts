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

import { UserRepository } from 'src/database/repositories/User.repository';

import { TwilioService } from './twilio.service';

import { SignInDto, SignUpDto } from './dto/auth.dto';
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
         id:id
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

    const existUser = await this.usersRepository.getOne({ email: dto.email });

    if (existUser) {
      throw new HttpException('Your email already exists', HttpStatus.BAD_REQUEST);
    }

    try {
      const salt = await bcrypt.genSalt(10);
      const hashPass = await bcrypt.hash(dto.password, 10);
      await this.usersRepository.createUser({
        us_name: dto.name,
        us_email: dto.email,
        us_password: hashPass,
        us_password_salt: salt,
        us_phone_no: dto.phone
      });
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  async login(dto: SignInDto) {
    const user = await this.usersRepository.getOne({ email: dto.email });

    if (!user) {
      throw new ForbiddenException('User not found');
    }
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

  async sendVerificationOTP(phoneNumber: string): Promise<string> {
    try {
      const { response } = await this.twilioService.sendOtp(phoneNumber)
      return response;
    } catch (e) {
      throw new ForbiddenException('Failed to send OTP');
    }
  }
  async verifyOTP(phone: string,code: string): Promise<string> {
    try {
      const { response } = await this.twilioService.verifyOtp(phone,code)
      return response;
    } catch (e) {
      throw new ForbiddenException('OTP verification failed');
    }
  }

  // async editProfile(id: number, data: UpdateUserDto) {
  //   try {
  //     const user = await this.usersRepository.updateUser(id, data);
  //     return user;
  //   } catch (error) {
  //     throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
  //   }
  // }
}
