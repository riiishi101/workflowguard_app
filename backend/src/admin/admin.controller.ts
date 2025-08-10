import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserSignupService } from '../notifications/user-signup.service';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private userSignupService: UserSignupService) {}

  @Get('signup-stats')
  async getSignupStats(@Query('days') days?: string) {
    const daysNumber = days ? parseInt(days, 10) : 30;
    return await this.userSignupService.getUserSignupStats(daysNumber);
  }
}
