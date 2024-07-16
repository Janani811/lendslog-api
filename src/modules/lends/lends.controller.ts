import { Body, Controller, Get, Post, Request, Response } from '@nestjs/common';

import { LendsService } from './lends.service';

@Controller('lends')
export class LendsController {
  constructor(public lendsService: LendsService) {}

  @Get()
  async getLends(@Request() req, @Response() res) {}

  @Post()
  async add(@Body() dto: any, @Response() res) {
    console.log(dto)
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
