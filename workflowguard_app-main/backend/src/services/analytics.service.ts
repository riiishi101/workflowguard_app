import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UsageTrend {
  period: string;
  totalWorkflows: number;
  totalOverages: number;
  revenue: number;
  userCount: number;
}

export interface UserAnalytics {
  userId: string;
  email: string;
  planId: string;
  totalWorkflows: number;
  totalOverages: number;
  totalRevenue: number;
  overageFrequency: number;
  avgOveragesPerMonth: number;
  lastOverageDate?: Date;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface RevenueAnalytics {
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  topRevenueUsers: Array<{
    userId: string;
    email: string;
    revenue: number;
  }>;
  revenueByPlan: Array<{
    planId: string;
    revenue: number;
    userCount: number;
  }>;
}

export interface PredictiveAnalytics {
  predictedOverages: number;
  predictedRevenue: number;
  highRiskUsers: string[];
  recommendedUpgrades: Array<{
    userId: string;
    email: string;
    currentPlan: string;
    recommendedPlan: string;
    reason: string;
  }>;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get comprehensive usage analytics
   */
  async getUsageAnalytics(periodMonths: number = 12): Promise<UsageTrend[]> {
    const trends: UsageTrend[] = [];
    const now = new Date();

    for (let i = periodMonths - 1; i >= 0; i--) {
      const periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const period = periodStart.toISOString().slice(0, 7); // YYYY-MM format

      // Get workflows created in this period
      const workflows = await this.prisma.workflow.findMany({
        where: {
          createdAt: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
      });

      // Get overages in this period
      const overages = await this.prisma.overage.findMany({
        where: {
          periodStart: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
      });

      // Get unique users in this period
      const users = await this.prisma.user.findMany({
        where: {
          createdAt: {
            lte: periodEnd,
          },
        },
      });

      const revenue = overages.reduce((sum, overage) => sum + (overage.amount * 1.00), 0);

      trends.push({
        period,
        totalWorkflows: workflows.length,
        totalOverages: overages.length,
        revenue,
        userCount: users.length,
      });
    }

    return trends;
  }

  /**
   * Get user-specific analytics
   */
  async getUserAnalytics(): Promise<UserAnalytics[]> {
    const users = await this.prisma.user.findMany({
      include: {
        workflows: true,
        overages: true,
        subscription: true,
      },
    });

    return users.map(user => {
      const totalWorkflows = user.workflows.length;
      const totalOverages = user.overages.length;
      const totalRevenue = user.overages.reduce((sum, o) => sum + (o.amount * 1.00), 0);

      // Calculate overage frequency
      const overageFrequency = totalOverages;
      const monthsSinceCreation = Math.max(1, this.getMonthsBetween(user.createdAt, new Date()));
      const avgOveragesPerMonth = totalOverages / monthsSinceCreation;

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (avgOveragesPerMonth > 2) riskLevel = 'high';
      else if (avgOveragesPerMonth > 0.5) riskLevel = 'medium';

      const lastOverage = user.overages.length > 0 
        ? user.overages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        : null;

      return {
        userId: user.id,
        email: user.email,
        planId: user.subscription?.planId || 'unknown',
        totalWorkflows,
        totalOverages,
        totalRevenue,
        overageFrequency,
        avgOveragesPerMonth,
        lastOverageDate: lastOverage?.createdAt,
        riskLevel,
      };
    });
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(): Promise<RevenueAnalytics> {
    const overages = await this.prisma.overage.findMany({
      include: {
        user: {
          include: {
            subscription: true,
          },
        },
      },
    });

    const totalRevenue = overages.reduce((sum, o) => sum + (o.amount * 1.00), 0);

    // Calculate monthly revenue (current month)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyOverages = overages.filter(o => 
      o.periodStart >= monthStart && o.periodStart <= monthEnd
    );
    const monthlyRevenue = monthlyOverages.reduce((sum, o) => sum + (o.amount * 1.00), 0);

    // Calculate revenue growth (compare with previous month)
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const prevMonthOverages = overages.filter(o => 
      o.periodStart >= prevMonthStart && o.periodStart <= prevMonthEnd
    );
    const prevMonthRevenue = prevMonthOverages.reduce((sum, o) => sum + (o.amount * 1.00), 0);

    const revenueGrowth = prevMonthRevenue > 0 
      ? ((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 
      : 0;

    // Top revenue users
    const userRevenue = new Map<string, number>();
    overages.forEach(overage => {
      const current = userRevenue.get(overage.userId) || 0;
      userRevenue.set(overage.userId, current + (overage.amount * 1.00));
    });

    const topRevenueUsers = Array.from(userRevenue.entries())
      .map(([userId, revenue]) => {
        const user = overages.find(o => o.userId === userId)?.user;
        return {
          userId,
          email: user?.email || 'Unknown',
          revenue,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Revenue by plan
    const planRevenue = new Map<string, { revenue: number; userCount: number }>();
    overages.forEach(overage => {
      const planId = overage.user.subscription?.planId || 'unknown';
      const current = planRevenue.get(planId) || { revenue: 0, userCount: 0 };
      current.revenue += overage.amount * 1.00;
      current.userCount = 1; // Will be recalculated
      planRevenue.set(planId, current);
    });

    // Count unique users per plan
    const users = await this.prisma.user.findMany({
      include: { subscription: true },
    });
    users.forEach(user => {
      const planId = user.subscription?.planId || 'unknown';
      const current = planRevenue.get(planId);
      if (current) {
        current.userCount = (current.userCount || 0) + 1;
        planRevenue.set(planId, current);
      }
    });

    const revenueByPlan = Array.from(planRevenue.entries()).map(([planId, data]) => ({
      planId,
      revenue: data.revenue,
      userCount: data.userCount,
    }));

    return {
      totalRevenue,
      monthlyRevenue,
      revenueGrowth,
      topRevenueUsers,
      revenueByPlan,
    };
  }

  /**
   * Get predictive analytics
   */
  async getPredictiveAnalytics(): Promise<PredictiveAnalytics> {
    const users = await this.getUserAnalytics();
    const overages = await this.prisma.overage.findMany();

    // Predict overages based on historical patterns
    const recentOverages = overages.filter(o => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return o.createdAt >= threeMonthsAgo;
    });

    const avgMonthlyOverages = recentOverages.length / 3;
    const predictedOverages = Math.round(avgMonthlyOverages * 1.2); // 20% growth assumption
    const predictedRevenue = predictedOverages * 1.00; // $1 per overage

    // Identify high-risk users
    const highRiskUsers = users
      .filter(user => user.riskLevel === 'high')
      .map(user => user.userId);

    // Recommend plan upgrades
    const recommendedUpgrades = users
      .filter(user => {
        const avgOverages = user.avgOveragesPerMonth;
        const currentPlan = user.planId;
        
        // Recommend upgrade if user has frequent overages
        if (currentPlan === 'starter' && avgOverages > 1) return true;
        if (currentPlan === 'professional' && avgOverages > 3) return true;
        
        return false;
      })
      .map(user => {
        const currentPlan = user.planId;
        let recommendedPlan = 'professional';
        let reason = 'Frequent overages detected';

        if (currentPlan === 'starter') {
          recommendedPlan = 'professional';
          reason = 'High overage frequency - upgrade recommended';
        } else if (currentPlan === 'professional') {
          recommendedPlan = 'enterprise';
          reason = 'Very high overage frequency - enterprise plan recommended';
        }

        return {
          userId: user.userId,
          email: user.email,
          currentPlan,
          recommendedPlan,
          reason,
        };
      });

    return {
      predictedOverages,
      predictedRevenue,
      highRiskUsers,
      recommendedUpgrades,
    };
  }

  /**
   * Get business intelligence dashboard data
   */
  async getBusinessIntelligence() {
    const [usageTrends, userAnalytics, revenueAnalytics, predictiveAnalytics] = await Promise.all([
      this.getUsageAnalytics(6), // Last 6 months
      this.getUserAnalytics(),
      this.getRevenueAnalytics(),
      this.getPredictiveAnalytics(),
    ]);

    // Calculate key metrics
    const totalUsers = userAnalytics.length;
    const activeUsers = userAnalytics.filter(u => u.totalWorkflows > 0).length;
    const usersWithOverages = userAnalytics.filter(u => u.totalOverages > 0).length;
    const conversionRate = totalUsers > 0 ? (usersWithOverages / totalUsers) * 100 : 0;

    // Plan distribution
    const planDistribution = userAnalytics.reduce((acc, user) => {
      acc[user.planId] = (acc[user.planId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      overview: {
        totalUsers,
        activeUsers,
        usersWithOverages,
        conversionRate: Math.round(conversionRate * 100) / 100,
        totalRevenue: revenueAnalytics.totalRevenue,
        monthlyRevenue: revenueAnalytics.monthlyRevenue,
        revenueGrowth: Math.round(revenueAnalytics.revenueGrowth * 100) / 100,
      },
      usageTrends,
      userAnalytics,
      revenueAnalytics,
      predictiveAnalytics,
      planDistribution,
      topPerformers: revenueAnalytics.topRevenueUsers.slice(0, 5),
      riskAssessment: {
        highRiskUsers: userAnalytics.filter(u => u.riskLevel === 'high').length,
        mediumRiskUsers: userAnalytics.filter(u => u.riskLevel === 'medium').length,
        lowRiskUsers: userAnalytics.filter(u => u.riskLevel === 'low').length,
      },
    };
  }

  /**
   * Get custom date range analytics
   */
  async getCustomRangeAnalytics(startDate: Date, endDate: Date) {
    const overages = await this.prisma.overage.findMany({
      where: {
        periodStart: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          include: {
            subscription: true,
          },
        },
      },
    });

    const workflows = await this.prisma.workflow.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalRevenue = overages.reduce((sum, o) => sum + (o.amount * 1.00), 0);
    const uniqueUsers = new Set(overages.map(o => o.userId)).size;

    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      metrics: {
        totalOverages: overages.length,
        totalWorkflows: workflows.length,
        totalRevenue,
        uniqueUsers,
        avgRevenuePerUser: uniqueUsers > 0 ? totalRevenue / uniqueUsers : 0,
      },
      overages,
      workflows,
    };
  }

  private getMonthsBetween(startDate: Date, endDate: Date): number {
    return (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
           (endDate.getMonth() - startDate.getMonth());
  }
} 