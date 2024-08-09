import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Put,
  Request,
  Response,
} from '@nestjs/common';

import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

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
}
