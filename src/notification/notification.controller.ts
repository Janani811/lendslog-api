import { Controller, Get, Request, Response } from '@nestjs/common';

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
}
