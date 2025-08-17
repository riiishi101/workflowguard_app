import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getUserAnalytics(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    try {
      // Get user's workflows and activities
      const workflows = await this.prisma.workflow.findMany({
        where: {
          ownerId: userId,
          createdAt: { gte: startDate, lte: endDate },
        },
        include: {
          versions: true,
        },
      });

      const auditLogs = await this.prisma.auditLog.findMany({
        where: {
          userId: userId,
          timestamp: { gte: startDate, lte: endDate },
        },
      });

      // Calculate analytics
      const analytics = {
        workflowMetrics: this.calculateWorkflowMetrics(workflows),
        activityMetrics: this.calculateActivityMetrics(auditLogs),
        performanceMetrics: this.calculatePerformanceMetrics(
          workflows,
          auditLogs,
        ),
        complianceMetrics: this.calculateComplianceMetrics(
          workflows,
          auditLogs,
        ),
        trends: this.calculateTrends(workflows, auditLogs, startDate, endDate),
      };

      return analytics;
    } catch (error) {
      throw new HttpException(
        `Failed to get analytics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private calculateWorkflowMetrics(workflows: any[]): any {
    const totalWorkflows = workflows.length;
    const totalVersions = workflows.reduce(
      (sum, w) => sum + w.versions.length,
      0,
    );
    const activeWorkflows = workflows.filter(
      (w) => w.versions.length > 0,
    ).length;
    const averageVersionsPerWorkflow =
      totalWorkflows > 0 ? totalVersions / totalWorkflows : 0;

    return {
      totalWorkflows,
      totalVersions,
      activeWorkflows,
      averageVersionsPerWorkflow:
        Math.round(averageVersionsPerWorkflow * 100) / 100,
      workflowUtilization:
        totalWorkflows > 0 ? (activeWorkflows / totalWorkflows) * 100 : 0,
    };
  }

  private calculateActivityMetrics(auditLogs: any[]): any {
    const totalActivities = auditLogs.length;
    const uniqueActions = new Set(auditLogs.map((log) => log.action)).size;
    const mostFrequentAction = this.getMostFrequentAction(auditLogs);
    const activityByDay = this.groupActivityByDay(auditLogs);

    return {
      totalActivities,
      uniqueActions,
      mostFrequentAction,
      activityByDay,
      averageDailyActivities:
        totalActivities / Math.max(activityByDay.length, 1),
    };
  }

  private calculatePerformanceMetrics(workflows: any[], auditLogs: any[]): any {
    const rollbackCount = auditLogs.filter((log) =>
      log.action.includes('rollback'),
    ).length;
    const backupCount = auditLogs.filter((log) =>
      log.action.includes('backup'),
    ).length;
    const changeCount = auditLogs.filter((log) =>
      log.action.includes('change'),
    ).length;

    const performanceScore = Math.min(
      100,
      Math.max(0, backupCount * 20 + changeCount * 10 - rollbackCount * 15),
    );

    return {
      rollbackCount,
      backupCount,
      changeCount,
      performanceScore,
      efficiencyRatio: backupCount > 0 ? changeCount / backupCount : 0,
    };
  }

  private calculateComplianceMetrics(workflows: any[], auditLogs: any[]): any {
    const hasCompleteAuditTrail = auditLogs.length > 0;
    const hasVersionHistory = workflows.some((w) => w.versions.length > 0);
    const hasUserAttribution = auditLogs.every((log) => log.userId);
    const hasTimestampTracking = auditLogs.every((log) => log.timestamp);

    const complianceScore =
      [
        hasCompleteAuditTrail,
        hasVersionHistory,
        hasUserAttribution,
        hasTimestampTracking,
      ].filter(Boolean).length * 25; // 25 points each

    return {
      hasCompleteAuditTrail,
      hasVersionHistory,
      hasUserAttribution,
      hasTimestampTracking,
      complianceScore,
      complianceLevel:
        complianceScore >= 75
          ? 'High'
          : complianceScore >= 50
            ? 'Medium'
            : 'Low',
    };
  }

  private calculateTrends(
    workflows: any[],
    auditLogs: any[],
    startDate: Date,
    endDate: Date,
  ): any {
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const workflowsPerDay = workflows.length / Math.max(daysDiff, 1);
    const activitiesPerDay = auditLogs.length / Math.max(daysDiff, 1);

    // Calculate growth rate
    const midPoint = new Date((startDate.getTime() + endDate.getTime()) / 2);
    const earlyWorkflows = workflows.filter(
      (w) => w.createdAt < midPoint,
    ).length;
    const lateWorkflows = workflows.filter(
      (w) => w.createdAt >= midPoint,
    ).length;
    const growthRate =
      earlyWorkflows > 0
        ? ((lateWorkflows - earlyWorkflows) / earlyWorkflows) * 100
        : 0;

    return {
      workflowsPerDay: Math.round(workflowsPerDay * 100) / 100,
      activitiesPerDay: Math.round(activitiesPerDay * 100) / 100,
      growthRate: Math.round(growthRate * 100) / 100,
      trend:
        growthRate > 0
          ? 'increasing'
          : growthRate < 0
            ? 'decreasing'
            : 'stable',
    };
  }

  private getMostFrequentAction(auditLogs: any[]): string {
    const actionCounts = auditLogs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {});

    return (
      Object.entries(actionCounts).sort(
        ([, a], [, b]) => (b as number) - (a as number),
      )[0]?.[0] || 'No activity'
    );
  }

  private groupActivityByDay(auditLogs: any[]): any[] {
    const activityByDay = auditLogs.reduce((acc, log) => {
      const date = log.timestamp.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(activityByDay).map(([date, count]) => ({
      date,
      count,
    }));
  }

  // Enterprise reporting features
  async generateEnterpriseReport(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    try {
      const analytics = await this.getUserAnalytics(userId, startDate, endDate);

      // Add enterprise-specific metrics
      const enterpriseMetrics = {
        ...analytics,
        enterpriseFeatures: {
          automatedBackups: await this.getAutomatedBackupCount(
            userId,
            startDate,
            endDate,
          ),
          approvalWorkflows: await this.getApprovalWorkflowCount(
            userId,
            startDate,
            endDate,
          ),
          complianceReports: await this.getComplianceReportCount(
            userId,
            startDate,
            endDate,
          ),
          webhookDeliveries: await this.getWebhookDeliveryCount(
            userId,
            startDate,
            endDate,
          ),
        },
        recommendations: this.generateEnterpriseRecommendations(analytics),
      };

      return enterpriseMetrics;
    } catch (error) {
      throw new HttpException(
        `Failed to generate enterprise report: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async getAutomatedBackupCount(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    return this.prisma.auditLog.count({
      where: {
        userId: userId,
        action: 'automated_backup_created',
        timestamp: { gte: startDate, lte: endDate },
      },
    });
  }

  private async getApprovalWorkflowCount(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    return this.prisma.approvalRequest.count({
      where: {
        requestedBy: userId,
        createdAt: { gte: startDate, lte: endDate },
      },
    });
  }

  private async getComplianceReportCount(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    return this.prisma.auditLog.count({
      where: {
        userId: userId,
        action: 'compliance_report_generated',
        timestamp: { gte: startDate, lte: endDate },
      },
    });
  }

  private async getWebhookDeliveryCount(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    return this.prisma.auditLog.count({
      where: {
        userId: userId,
        action: { contains: 'webhook' },
        timestamp: { gte: startDate, lte: endDate },
      },
    });
  }

  private generateEnterpriseRecommendations(analytics: any): string[] {
    const recommendations = [];

    // Performance recommendations
    if (analytics.performanceMetrics.performanceScore < 70) {
      recommendations.push(
        'Consider implementing more automated backups to improve performance score',
      );
    }

    if (analytics.performanceMetrics.efficiencyRatio < 0.5) {
      recommendations.push(
        'Optimize workflow change frequency to improve efficiency',
      );
    }

    // Compliance recommendations
    if (analytics.complianceMetrics.complianceScore < 75) {
      recommendations.push(
        'Enhance audit trail completeness for better compliance',
      );
    }

    // Growth recommendations
    if (analytics.trends.growthRate < 10) {
      recommendations.push(
        'Consider expanding workflow protection to more automations',
      );
    }

    return recommendations;
  }
}
