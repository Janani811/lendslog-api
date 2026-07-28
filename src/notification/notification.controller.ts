import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Put,
  Request,
  Response,
} from '@nestjs/common';

import { NotificationService } from './notification.service';
import { ExpensifyNotificationService } from '../modules/expensify/expensify-notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(
    private notificationService: NotificationService,
    private expensifyNotificationService: ExpensifyNotificationService,
  ) {}

  // get all lends
  @Get('all')
  async getAllLends(@Request() req, @Response() res) {
    try {
      const { todayNotifications, olderNotifications } = await this.notificationService.getAll({
        nt_user_id: req.user.us_id,
      });
      return res.status(200).json({ todayNotifications, olderNotifications });
    } catch (error) {
      return res.status(403).json({ error: error.message });
    }
  }

  @Put('push/enable')
  @HttpCode(HttpStatus.OK)
  async enablePush(@Body() body: { token: string }, @Request() req) {
    try {
      return await this.notificationService.acceptPushNotification(req.user.us_id, body.token);
    } catch (error) {
      console.error(error);
    }
  }

  @Put('push/disable')
  @HttpCode(HttpStatus.OK)
  async disablePush(@Body() body: { token: string }, @Request() req) {
    try {
      return await this.notificationService.disablePushNotification(req.user.us_id, body.token);
    } catch (error) {
      console.error(error);
    }
  }

  // Test-only route: sends an Expo push directly, auth'd via a static token
  // instead of a user JWT, so it can be hit without going through login.
  @Post('test-send')
  @HttpCode(HttpStatus.OK)
  async testSend(
    @Headers('x-test-token') testToken: string,
    @Body() body: { to: string; title: string; body: string; data?: Record<string, unknown> },
  ) {
    if (!process.env.NOTIFICATION_TEST_TOKEN || testToken !== process.env.NOTIFICATION_TEST_TOKEN) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const receipts = await this.expensifyNotificationService.sendNotifications([
      {
        to: body.to,
        title: body.title,
        body: body.body,
        data: body.data,
        sound: 'default',
        priority: 'high',
      },
    ]);
    return { receipts };
  }
}
