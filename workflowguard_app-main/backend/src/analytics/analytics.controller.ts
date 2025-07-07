import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from '../services/analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UsageTrend, UserAnalytics, RevenueAnalytics, PredictiveAnalytics } from '../services/analytics.service';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get comprehensive business intelligence dashboard
   * Admin only - provides overview of all key metrics
   */
  @Get('business-intelligence')
  @Roles('admin')
  async getBusinessIntelligence() {
    return this.analyticsService.getBusinessIntelligence();
  }

  /**
   * Get usage analytics trends
   * Admin only - shows usage patterns over time
   */
  @Get('usage-trends')
  @Roles('admin')
  async getUsageTrends(@Query('months') months?: string): Promise<UsageTrend[]> {
    const periodMonths = months ? parseInt(months, 10) : 12;
    return this.analyticsService.getUsageAnalytics(periodMonths);
  }

  /**
   * Get user analytics
   * Admin only - detailed user performance and risk assessment
   */
  @Get('user-analytics')
  @Roles('admin')
  async getUserAnalytics(): Promise<UserAnalytics[]> {
    return this.analyticsService.getUserAnalytics();
  }

  /**
   * Get revenue analytics
   * Admin only - revenue trends and top performers
   */
  @Get('revenue-analytics')
  @Roles('admin')
  async getRevenueAnalytics(): Promise<RevenueAnalytics> {
    return this.analyticsService.getRevenueAnalytics();
  }

  /**
   * Get predictive analytics
   * Admin only - forecasting and upgrade recommendations
   */
  @Get('predictive-analytics')
  @Roles('admin')
  async getPredictiveAnalytics(): Promise<PredictiveAnalytics> {
    return this.analyticsService.getPredictiveAnalytics();
  }

  /**
   * Get custom date range analytics
   * Admin only - flexible date range reporting
   */
  @Get('custom-range')
  @Roles('admin')
  async getCustomRangeAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format. Use ISO 8601 format (YYYY-MM-DD)');
    }

    return this.analyticsService.getCustomRangeAnalytics(start, end);
  }

  /**
   * Get user's own analytics (limited view)
   * Users can see their own performance metrics
   */
  @Get('my-analytics')
  async getMyAnalytics(@Request() req: RequestWithUser) {
    const userAnalytics = await this.analyticsService.getUserAnalytics();
    const myAnalytics = userAnalytics.find(ua => ua.userId === req.user.id);
    
    if (!myAnalytics) {
      throw new Error('User analytics not found');
    }

    return {
      ...myAnalytics,
      // Remove sensitive information for user view
      riskLevel: undefined,
      avgOveragesPerMonth: undefined,
    };
  }

  /**
   * Get revenue summary for admin dashboard
   * Quick revenue overview
   */
  @Get('revenue-summary')
  @Roles('admin')
  async getRevenueSummary() {
    const revenueAnalytics = await this.analyticsService.getRevenueAnalytics();
    
    return {
      totalRevenue: revenueAnalytics.totalRevenue,
      monthlyRevenue: revenueAnalytics.monthlyRevenue,
      revenueGrowth: revenueAnalytics.revenueGrowth,
      topRevenueUsers: revenueAnalytics.topRevenueUsers.slice(0, 5),
    };
  }

  /**
   * Get risk assessment summary
   * Admin only - overview of user risk levels
   */
  @Get('risk-assessment')
  @Roles('admin')
  async getRiskAssessment() {
    const userAnalytics = await this.analyticsService.getUserAnalytics();
    
    const highRiskUsers = userAnalytics.filter(u => u.riskLevel === 'high');
    const mediumRiskUsers = userAnalytics.filter(u => u.riskLevel === 'medium');
    const lowRiskUsers = userAnalytics.filter(u => u.riskLevel === 'low');

    return {
      totalUsers: userAnalytics.length,
      highRiskUsers: {
        count: highRiskUsers.length,
        users: highRiskUsers.map(u => ({ userId: u.userId, email: u.email, avgOveragesPerMonth: u.avgOveragesPerMonth })),
      },
      mediumRiskUsers: {
        count: mediumRiskUsers.length,
        users: mediumRiskUsers.map(u => ({ userId: u.userId, email: u.email, avgOveragesPerMonth: u.avgOveragesPerMonth })),
      },
      lowRiskUsers: {
        count: lowRiskUsers.length,
      },
    };
  }

  /**
   * Get upgrade recommendations
   * Admin only - users who should be recommended for plan upgrades
   */
  @Get('upgrade-recommendations')
  @Roles('admin')
  async getUpgradeRecommendations() {
    const predictiveAnalytics = await this.analyticsService.getPredictiveAnalytics();
    
    return {
      recommendations: predictiveAnalytics.recommendedUpgrades,
      totalRecommendations: predictiveAnalytics.recommendedUpgrades.length,
    };
  }
} 