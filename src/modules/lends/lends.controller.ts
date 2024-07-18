import { Body, Controller, Get, Post, Request, Response } from '@nestjs/common';

import { LendsService } from './lends.service';
import { AddLend } from './dto/lends.dto';

@Controller('lends')
export class LendsController {
  constructor(public lendsService: LendsService) {}

  @Get()
  async getLends(@Request() req, @Response() res) {
    try {
      // await this.lendsService.create(dto);
      return res.json({
        status: 200,
        message: 'Signup Successfully completed',
      });
    } catch (error) {
      return res.status(403).json({ error: error.message });
    }
  }

  @Post()
  async add(@Body() dto: AddLend, @Response() res) {
    console.log(dto);
    try {
      await this.lendsService.create(dto);
      return res.json({
        status: 200,
        message: 'Signup Successfully completed',
      });
    } catch (error) {
      return res.status(403).json({ error: error.message });
    }
  }
}
