import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('user')
  async getUserAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: any,
  ) {
    const userId = req.user?.sub || req.user?.id || req.user?.userId;
    if (!userId) {
      throw new HttpException('User ID not found', HttpStatus.UNAUTHORIZED);
    }

    try {
      const start = new Date(
        startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      );
      const end = new Date(endDate || new Date());

      const analytics = await this.analyticsService.getUserAnalytics(
        userId,
        start,
        end,
      );
      return {
        success: true,
        data: analytics,
        message: 'Analytics data retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get analytics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('enterprise-report')
  async getEnterpriseReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: any,
  ) {
    const userId = req.user?.sub || req.user?.id || req.user?.userId;
    if (!userId) {
      throw new HttpException('User ID not found', HttpStatus.UNAUTHORIZED);
    }

    try {
      const start = new Date(
        startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      );
      const end = new Date(endDate || new Date());

      const report = await this.analyticsService.generateEnterpriseReport(
        userId,
        start,
        end,
      );
      return {
        success: true,
        data: report,
        message: 'Enterprise report generated successfully',
      };
    } catch (error) {
      throw new HttpException(
        `Failed to generate enterprise report: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
