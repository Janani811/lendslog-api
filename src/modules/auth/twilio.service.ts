import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Twilio } from 'twilio';

@Injectable()
export class TwilioService {
  private twilioClient: Twilio;

  constructor(private readonly configService: ConfigService) {
    const accountSid = configService.get('TWILIO_ACCOUNT_SID');
    const authToken = configService.get('TWILIO_AUTH_TOKEN');

    this.twilioClient = new Twilio(accountSid, authToken);
  }

  async sendOtp(phoneNumber: string) {
    const serviceSid = this.configService.get('TWILIO_VERIFICATION_SERVICE_SID');

    let response: any = null;
    await this.twilioClient.verify.v2
      .services(serviceSid)
      .verifications.create({ to: phoneNumber, channel: 'sms' })
      .then((verification) => (response = verification));
    console.log(response);
    return { response };
  }

  async verifyOtp(phoneNumber: string, code: string) {
    const serviceSid = this.configService.get('TWILIO_VERIFICATION_SERVICE_SID');
    let response: any = null;
    await this.twilioClient.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to: phoneNumber, code: code })
      .then((verification) => (response = verification));
    return { response };
  }
}
