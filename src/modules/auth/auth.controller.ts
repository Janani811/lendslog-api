import { Body, Controller, Get, Post, Request, Response } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendVerifyDto, SignInDto, SignUpDto, VerifyDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('me')
  async getProfile(@Request() req, @Response() res) {
    try {
      const user = await this.authService.fetchProfile(req.user.us_id);
      res.status(200).json({
        status: true,
        user: {
          ...user,
        },
      });
    } catch (error) {
      return res.status(403).json({ error: error.message });
    }
  }

  @Post('signup')
  async signup(@Body() dto: SignUpDto, @Response() res) {
    try {
      await this.authService.signup(dto);
      return res.json({
        status: 200,
        message: 'Signup Successfully completed',
      });
    } catch (error) {
      return res.status(403).json({ error: error.message });
    }
  }

  @Post('login')
  async signin(@Body() dto: SignInDto, @Request() req, @Response() res) {
    try {
      const { user, jwtToken }: any = await this.authService.login(dto);
      req.user = user;
      return res.json({
        status: 200,
        message: 'Signed In Successfully',
        jwtToken,
        user,
      });
    } catch (error) {
      return res.status(403).json({ error: error.message });
    }
  }
  @Post('send-otp')
  async sendVerify(
    @Body() dto: SendVerifyDto,
    @Request() req,
    @Response() res,
  ) {
    try {
      const response: any = await this.authService.sendVerificationOTP(
        dto.phone,
      );
      console.log(response);
      return res.json({
        status: 200,
        message: 'Your OTP has been sent successfully',
      });
    } catch (error) {
      return res.status(403).json({ error: error.message });
    }
  }
  @Post('verify-otp')
  async verify(@Body() dto: VerifyDto, @Request() req, @Response() res) {
    try {
      return res.status(403).json({ error: 'Invalid OTP' });
      const response: any = await this.authService.verifyOTP(
        dto.phone,
        dto.code,
      );
      if (response && !response.valid) {
        return res.status(403).json({ error: 'Invalid OTP' });
      }
      console.log(response);
      return res.json({ status: 200, message: 'OTP verified successfully' });
    } catch (error) {
      return res.status(403).json({ error: error.message });
    }
  }

  // @Put('edit-profile')
  // async editProfile(@Body() dto: UpdateUserDto, @Request() req, @Response() res) {
  //   try {
  //     const user = await this.authService.editProfile(req.user.us_id, dto);
  //     return res.json({ status: 200, message: 'Profile updated successfully', user });
  //   } catch (error) {
  //     return res.status(403).json({ error: error.message });
  //   }
  // }
}
