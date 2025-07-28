import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  planId?: string;
  status?: string;
}

export interface UsageReport {
  period: string;
  totalWorkflows: number;
  totalOverages: number;
  totalOverageAmount: number;
  averageUsage: number;
  peakUsage: number;
  userBreakdown: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    workflows: number;
    overages: number;
    overageAmount: number;
  }>;
}

export interface BillingReport {
  period: string;
  totalRevenue: number;
  totalOverages: number;
  totalOverageAmount: number;
  planBreakdown: Array<{
    planId: string;
    userCount: number;
    revenue: number;
    overages: number;
  }>;
  userBreakdown: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    planId: string;
    baseAmount: number;
    overageAmount: number;
    totalAmount: number;
  }>;
}

export interface AuditReport {
  period: string;
  totalActions: number;
  actionBreakdown: Array<{
    action: string;
    count: number;
    percentage: number;
  }>;
  userBreakdown: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    actions: number;
    lastAction: Date;
  }>;
  recentActions: Array<{
    id: string;
    userId: string;
    userName: string;
    action: string;
    details: any;
    timestamp: Date;
  }>;
}

export interface AnalyticsReport {
  period: string;
  userGrowth: {
    totalUsers: number;
    newUsers: number;
    activeUsers: number;
    churnRate: number;
  };
  usageMetrics: {
    totalWorkflows: number;
    averageWorkflowsPerUser: number;
    totalOverages: number;
    averageOveragesPerUser: number;
  };
  revenueMetrics: {
    totalRevenue: number;
    averageRevenuePerUser: number;
    revenueGrowth: number;
  };
  planDistribution: Array<{
    planId: string;
    userCount: number;
    percentage: number;
  }>;
}

@Injectable()
export class ReportingService {
  private readonly logger = new Logger(ReportingService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Generate usage report
   */
  async generateUsageReport(filters: ReportFilters): Promise<UsageReport> {
    const { startDate, endDate, userId, planId } = filters;

    // Build where clause
    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }
    if (userId) {
      whereClause.userId = userId;
    }

    // Get workflows
    const workflows = await this.prisma.workflow.findMany({
      where: whereClause,
      include: {
        owner: true,
      },
    });

    // Get overages
    const overages = await this.prisma.overage.findMany({
      where: {
        ...whereClause,
        ...(planId && { user: { subscription: { planId } } }),
      },
      include: {
        user: true,
      },
    });

    // Calculate metrics
    const totalWorkflows = workflows.length;
    const totalOverages = overages.length;
    const totalOverageAmount = overages.reduce(
      (sum, overage) => sum + overage.amount,
      0,
    );

    // Group by user
    const userWorkflows = this.groupBy(workflows, 'userId');
    const userOverages = this.groupBy(overages, 'userId');

    const userBreakdown = Object.keys(userWorkflows).map((userId) => {
      const userWorkflowList = userWorkflows[userId];
      const userOverageList = userOverages[userId] || [];
      const user = userWorkflowList[0]?.owner;

      return {
        userId,
        userName: user?.name || user?.email || 'Unknown',
        userEmail: user?.email || 'Unknown',
        workflows: userWorkflowList.length,
        overages: userOverageList.length,
        overageAmount: userOverageList.reduce(
          (sum, overage) => sum + overage.amount,
          0,
        ),
      };
    });

    // Calculate averages
    const averageUsage = totalWorkflows / Math.max(userBreakdown.length, 1);
    const peakUsage = Math.max(...userBreakdown.map((u) => u.workflows), 0);

    return {
      period: this.getPeriodString(startDate, endDate),
      totalWorkflows,
      totalOverages,
      totalOverageAmount,
      averageUsage: Math.round(averageUsage * 100) / 100,
      peakUsage,
      userBreakdown,
    };
  }

  /**
   * Generate billing report
   */
  async generateBillingReport(filters: ReportFilters): Promise<BillingReport> {
    const { startDate, endDate, userId, planId } = filters;

    // Build where clause
    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }
    if (userId) {
      whereClause.userId = userId;
    }

    // Get overages
    const overages = await this.prisma.overage.findMany({
      where: {
        ...whereClause,
        ...(planId && { user: { subscription: { planId } } }),
      },
      include: {
        user: {
          include: {
            subscription: true,
          },
        },
      },
    });

    // Get users with subscriptions
    const users = await this.prisma.user.findMany({
      where: {
        ...(userId && { id: userId }),
        subscription: {
          ...(planId && { planId }),
        },
      },
      include: {
        subscription: true,
        overages: {
          where: whereClause,
        },
      },
    });

    // Calculate metrics
    const totalOverageAmount = overages.reduce(
      (sum, overage) => sum + overage.amount,
      0,
    );
    const totalRevenue = totalOverageAmount; // In HubSpot Marketplace, this is the overage revenue

    // Group by plan
    const planGroups = this.groupBy(users, 'subscription.planId');
    const planBreakdown = Object.keys(planGroups).map((planId) => {
      const planUsers = planGroups[planId];
      const planOverages = planUsers.flatMap((user) => user.overages);
      const planRevenue = planOverages.reduce(
        (sum, overage) => sum + overage.amount,
        0,
      );

      return {
        planId,
        userCount: planUsers.length,
        revenue: planRevenue,
        overages: planOverages.length,
      };
    });

    // User breakdown
    const userBreakdown = users.map((user) => {
      const userOverages = user.overages;
      const overageAmount = userOverages.reduce(
        (sum, overage) => sum + overage.amount,
        0,
      );
      const baseAmount = 0; // Base subscription is handled by HubSpot

      return {
        userId: user.id,
        userName: user.name || user.email,
        userEmail: user.email,
        planId: user.subscription?.planId || 'unknown',
        baseAmount,
        overageAmount,
        totalAmount: baseAmount + overageAmount,
      };
    });

    return {
      period: this.getPeriodString(startDate, endDate),
      totalRevenue,
      totalOverages: overages.length,
      totalOverageAmount,
      planBreakdown,
      userBreakdown,
    };
  }

  /**
   * Generate audit report
   */
  async generateAuditReport(filters: ReportFilters): Promise<AuditReport> {
    const { startDate, endDate, userId } = filters;

    // Build where clause
    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }
    if (userId) {
      whereClause.userId = userId;
    }

    // Get audit logs
    const auditLogs = await this.prisma.auditLog.findMany({
      where: whereClause,
      include: {
        user: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Calculate metrics
    const totalActions = auditLogs.length;

    // Action breakdown
    const actionGroups = this.groupBy(auditLogs, 'action');
    const actionBreakdown = Object.keys(actionGroups).map((action) => {
      const count = actionGroups[action].length;
      const percentage = (count / totalActions) * 100;

      return {
        action,
        count,
        percentage: Math.round(percentage * 100) / 100,
      };
    });

    // User breakdown
    const userGroups = this.groupBy(auditLogs, 'userId');
    const userBreakdown = Object.keys(userGroups).map((userId) => {
      const userLogs = userGroups[userId];
      const user = userLogs[0]?.user;
      const lastAction = userLogs[0]?.timestamp;

      return {
        userId,
        userName: user?.name || user?.email || 'Unknown',
        userEmail: user?.email || 'Unknown',
        actions: userLogs.length,
        lastAction,
      };
    });

    // Recent actions
    const recentActions = auditLogs.slice(0, 50).map((log) => ({
      id: log.id,
      userId: log.userId || 'unknown',
      userName: log.user?.name || log.user?.email || 'Unknown',
      action: log.action,
      details: log.newValue,
      timestamp: log.timestamp,
    }));

    return {
      period: this.getPeriodString(startDate, endDate),
      totalActions,
      actionBreakdown,
      userBreakdown,
      recentActions,
    };
  }

  /**
   * Generate analytics report
   */
  async generateAnalyticsReport(
    filters: ReportFilters,
  ): Promise<AnalyticsReport> {
    const { startDate, endDate } = filters;

    // Get all users
    const allUsers = await this.prisma.user.findMany({
      include: {
        subscription: true,
        workflows: true,
        overages: {
          where:
            startDate && endDate
              ? {
                  createdAt: {
                    gte: startDate,
                    lte: endDate,
                  },
                }
              : {},
        },
      },
    });

    // Get previous period for growth calculation
    const previousStartDate = startDate
      ? new Date(
          startDate.getTime() - (endDate!.getTime() - startDate.getTime()),
        )
      : null;
    const previousEndDate = startDate ? new Date(startDate.getTime()) : null;

    const previousUsers =
      previousStartDate && previousEndDate
        ? await this.prisma.user.findMany({
            where: {
              createdAt: {
                gte: previousStartDate,
                lte: previousEndDate,
              },
            },
          })
        : [];

    // Calculate metrics
    const totalUsers = allUsers.length;
    const newUsers =
      startDate && endDate
        ? allUsers.filter(
            (user) => user.createdAt >= startDate && user.createdAt <= endDate,
          ).length
        : 0;
    const activeUsers = allUsers.filter(
      (user) => user.workflows.length > 0,
    ).length;
    const previousTotalUsers = previousUsers.length;
    const churnRate =
      previousTotalUsers > 0
        ? ((previousTotalUsers - totalUsers) / previousTotalUsers) * 100
        : 0;

    const totalWorkflows = allUsers.reduce(
      (sum, user) => sum + user.workflows.length,
      0,
    );
    const averageWorkflowsPerUser =
      totalUsers > 0 ? totalWorkflows / totalUsers : 0;
    const totalOverages = allUsers.reduce(
      (sum, user) => sum + user.overages.length,
      0,
    );
    const averageOveragesPerUser =
      totalUsers > 0 ? totalOverages / totalUsers : 0;

    const totalRevenue = allUsers.reduce(
      (sum, user) =>
        sum +
        user.overages.reduce(
          (overageSum, overage) => overageSum + overage.amount,
          0,
        ),
      0,
    );
    const averageRevenuePerUser =
      totalUsers > 0 ? totalRevenue / totalUsers : 0;
    const previousRevenue = previousUsers.length > 0 ? 0 : 0; // Simplified for demo
    const revenueGrowth =
      previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    // Plan distribution
    const planGroups = this.groupBy(allUsers, 'subscription.planId');
    const planDistribution = Object.keys(planGroups).map((planId) => {
      const userCount = planGroups[planId].length;
      const percentage = (userCount / totalUsers) * 100;

      return {
        planId: planId || 'unknown',
        userCount,
        percentage: Math.round(percentage * 100) / 100,
      };
    });

    return {
      period: this.getPeriodString(startDate, endDate),
      userGrowth: {
        totalUsers,
        newUsers,
        activeUsers,
        churnRate: Math.round(churnRate * 100) / 100,
      },
      usageMetrics: {
        totalWorkflows,
        averageWorkflowsPerUser:
          Math.round(averageWorkflowsPerUser * 100) / 100,
        totalOverages,
        averageOveragesPerUser: Math.round(averageOveragesPerUser * 100) / 100,
      },
      revenueMetrics: {
        totalRevenue,
        averageRevenuePerUser: Math.round(averageRevenuePerUser * 100) / 100,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      },
      planDistribution,
    };
  }

  /**
   * Export report to CSV
   */
  async exportToCSV(report: any, reportType: string): Promise<string> {
    const headers = this.getCSVHeaders(reportType);
    const rows = this.convertToCSVRows(report, reportType);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');
    return csvContent;
  }

  /**
   * Export report to JSON
   */
  async exportToJSON(report: any): Promise<string> {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Export report to Excel (simplified - returns CSV for now)
   */
  async exportToExcel(report: any, reportType: string): Promise<string> {
    // In a real implementation, you would use a library like 'xlsx'
    // For now, we'll return CSV format
    return this.exportToCSV(report, reportType);
  }

  /**
   * Generate comprehensive dashboard data
   */
  async generateDashboardData(userId?: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const filters: ReportFilters = {
      startDate: thirtyDaysAgo,
      endDate: now,
      userId,
    };

    const [usageReport, billingReport, auditReport, analyticsReport] =
      await Promise.all([
        this.generateUsageReport(filters),
        this.generateBillingReport(filters),
        this.generateAuditReport(filters),
        this.generateAnalyticsReport(filters),
      ]);

    return {
      usageReport,
      billingReport,
      auditReport,
      analyticsReport,
      generatedAt: now,
    };
  }

  /**
   * Helper methods
   */
  private groupBy(array: any[], key: string): Record<string, any[]> {
    return array.reduce((groups, item) => {
      const groupKey = key.includes('.')
        ? key.split('.').reduce((obj, k) => obj?.[k], item)
        : item[key];
      const group = groupKey || 'unknown';
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }

  private getPeriodString(startDate?: Date, endDate?: Date): string {
    if (!startDate || !endDate) {
      return 'All Time';
    }
    return `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`;
  }

  private getCSVHeaders(reportType: string): string[] {
    switch (reportType) {
      case 'usage':
        return [
          'Period',
          'Total Workflows',
          'Total Overages',
          'Total Overage Amount',
          'Average Usage',
          'Peak Usage',
        ];
      case 'billing':
        return [
          'Period',
          'Total Revenue',
          'Total Overages',
          'Total Overage Amount',
        ];
      case 'audit':
        return ['Period', 'Total Actions'];
      case 'analytics':
        return [
          'Period',
          'Total Users',
          'New Users',
          'Active Users',
          'Churn Rate',
          'Total Workflows',
          'Total Overages',
          'Total Revenue',
        ];
      default:
        return [];
    }
  }

  private convertToCSVRows(report: any, reportType: string): string[][] {
    switch (reportType) {
      case 'usage':
        return [
          [
            report.period,
            report.totalWorkflows.toString(),
            report.totalOverages.toString(),
            report.totalOverageAmount.toString(),
            report.averageUsage.toString(),
            report.peakUsage.toString(),
          ],
        ];
      case 'billing':
        return [
          [
            report.period,
            report.totalRevenue.toString(),
            report.totalOverages.toString(),
            report.totalOverageAmount.toString(),
          ],
        ];
      case 'audit':
        return [[report.period, report.totalActions.toString()]];
      case 'analytics':
        return [
          [
            report.period,
            report.userGrowth.totalUsers.toString(),
            report.userGrowth.newUsers.toString(),
            report.userGrowth.activeUsers.toString(),
            report.userGrowth.churnRate.toString(),
            report.usageMetrics.totalWorkflows.toString(),
            report.usageMetrics.totalOverages.toString(),
            report.revenueMetrics.totalRevenue.toString(),
          ],
        ];
      default:
        return [];
    }
  }
}
