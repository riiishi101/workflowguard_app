import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface PerformanceMetrics {
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  requestRate: number;
  errorRate: number;
  responseTime: number;
  databaseConnections: number;
  websocketConnections: number;
}

export interface UserActivityMetrics {
  timestamp: Date;
  activeUsers: number;
  newUsers: number;
  workflowOperations: number;
  syncOperations: number;
  apiCalls: number;
}

export interface BusinessMetrics {
  timestamp: Date;
  totalUsers: number;
  activeSubscriptions: number;
  trialConversions: number;
  revenue: number;
  workflowsCreated: number;
  versionsCreated: number;
}

@Injectable()
export class PerformanceMonitorService {
  private readonly logger = new Logger(PerformanceMonitorService.name);
  private metricsBuffer: PerformanceMetrics[] = [];
  private userActivityBuffer: UserActivityMetrics[] = [];
  private businessMetricsBuffer: BusinessMetrics[] = [];
  private readonly MAX_BUFFER_SIZE = 1000;

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Record performance metrics
   */
  async recordPerformanceMetrics(metrics: Partial<PerformanceMetrics>) {
    const fullMetrics: PerformanceMetrics = {
      timestamp: new Date(),
      cpuUsage: metrics.cpuUsage || 0,
      memoryUsage: metrics.memoryUsage || 0,
      activeConnections: metrics.activeConnections || 0,
      requestRate: metrics.requestRate || 0,
      errorRate: metrics.errorRate || 0,
      responseTime: metrics.responseTime || 0,
      databaseConnections: metrics.databaseConnections || 0,
      websocketConnections: metrics.websocketConnections || 0,
    };

    this.metricsBuffer.push(fullMetrics);

    // Emit event for real-time monitoring
    this.eventEmitter.emit('performance.metrics', fullMetrics);

    // Flush buffer if it's getting too large
    if (this.metricsBuffer.length >= this.MAX_BUFFER_SIZE) {
      await this.flushPerformanceMetrics();
    }
  }

  /**
   * Record user activity metrics
   */
  async recordUserActivity(metrics: Partial<UserActivityMetrics>) {
    const fullMetrics: UserActivityMetrics = {
      timestamp: new Date(),
      activeUsers: metrics.activeUsers || 0,
      newUsers: metrics.newUsers || 0,
      workflowOperations: metrics.workflowOperations || 0,
      syncOperations: metrics.syncOperations || 0,
      apiCalls: metrics.apiCalls || 0,
    };

    this.userActivityBuffer.push(fullMetrics);

    // Emit event for real-time monitoring
    this.eventEmitter.emit('user.activity', fullMetrics);

    // Flush buffer if it's getting too large
    if (this.userActivityBuffer.length >= this.MAX_BUFFER_SIZE) {
      await this.flushUserActivityMetrics();
    }
  }

  /**
   * Record business metrics
   */
  async recordBusinessMetrics(metrics: Partial<BusinessMetrics>) {
    const fullMetrics: BusinessMetrics = {
      timestamp: new Date(),
      totalUsers: metrics.totalUsers || 0,
      activeSubscriptions: metrics.activeSubscriptions || 0,
      trialConversions: metrics.trialConversions || 0,
      revenue: metrics.revenue || 0,
      workflowsCreated: metrics.workflowsCreated || 0,
      versionsCreated: metrics.versionsCreated || 0,
    };

    this.businessMetricsBuffer.push(fullMetrics);

    // Emit event for real-time monitoring
    this.eventEmitter.emit('business.metrics', fullMetrics);

    // Flush buffer if it's getting too large
    if (this.businessMetricsBuffer.length >= this.MAX_BUFFER_SIZE) {
      await this.flushBusinessMetrics();
    }
  }

  /**
   * Get current system performance metrics
   */
  async getCurrentPerformanceMetrics(): Promise<PerformanceMetrics> {
    const startTime = Date.now();

    // Get system metrics
    const cpuUsage = process.cpuUsage();
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    // Calculate CPU usage percentage
    const cpuUsagePercent = (cpuUsage.user + cpuUsage.system) / (uptime * 1000) * 100;

    // Calculate memory usage percentage
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    // Get database connection count
    const dbConnections = await this.getDatabaseConnectionCount();

    // Get WebSocket connection count
    const wsConnections = await this.getWebSocketConnectionCount();

    const metrics: PerformanceMetrics = {
      timestamp: new Date(),
      cpuUsage: Math.round(cpuUsagePercent * 100) / 100,
      memoryUsage: Math.round(memoryUsagePercent * 100) / 100,
      activeConnections: 0, // This would need to be tracked by the HTTP server
      requestRate: 0, // This would need to be tracked by request interceptors
      errorRate: 0, // This would need to be tracked by error handlers
      responseTime: Date.now() - startTime,
      databaseConnections: dbConnections,
      websocketConnections: wsConnections,
    };

    return metrics;
  }

  /**
   * Get current user activity metrics
   */
  async getCurrentUserActivityMetrics(): Promise<UserActivityMetrics> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get active users (users with activity in the last hour)
    const activeUsers = await this.prisma.user.count({
      where: {
        lastActiveAt: {
          gte: oneHourAgo,
        },
      },
    });

    // Get new users (users created in the last day)
    const newUsers = await this.prisma.user.count({
      where: {
        createdAt: {
          gte: oneDayAgo,
        },
      },
    });

    // Get workflow operations (in the last hour)
    const workflowOperations = await this.prisma.auditLog.count({
      where: {
        timestamp: {
          gte: oneHourAgo,
        },
        action: {
          in: ['workflow_created', 'workflow_updated', 'workflow_deleted'],
        },
      },
    });

    // Get sync operations (in the last hour)
    const syncOperations = await this.prisma.auditLog.count({
      where: {
        timestamp: {
          gte: oneHourAgo,
        },
        action: {
          in: ['workflow_synced', 'workflow_sync_failed'],
        },
      },
    });

    const metrics: UserActivityMetrics = {
      timestamp: now,
      activeUsers,
      newUsers,
      workflowOperations,
      syncOperations,
      apiCalls: 0, // This would need to be tracked by request interceptors
    };

    return metrics;
  }

  /**
   * Get current business metrics
   */
  async getCurrentBusinessMetrics(): Promise<BusinessMetrics> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get total users
    const totalUsers = await this.prisma.user.count();

    // Get active subscriptions
    const activeSubscriptions = await this.prisma.subscription.count({
      where: {
        status: 'active',
      },
    });

    // Get trial conversions (users who upgraded from trial in the last month)
    const trialConversions = await this.prisma.user.count({
      where: {
        subscription: {
          status: 'active',
        },
        trialEndDate: {
          gte: oneMonthAgo,
        },
      },
    });

    // Get workflows created in the last day
    const workflowsCreated = await this.prisma.workflow.count({
      where: {
        createdAt: {
          gte: oneDayAgo,
        },
      },
    });

    // Get versions created in the last day
    const versionsCreated = await this.prisma.workflowVersion.count({
      where: {
        createdAt: {
          gte: oneDayAgo,
        },
      },
    });

    const metrics: BusinessMetrics = {
      timestamp: now,
      totalUsers,
      activeSubscriptions,
      trialConversions,
      revenue: 0, // This would need to be calculated from billing data
      workflowsCreated,
      versionsCreated,
    };

    return metrics;
  }

  /**
   * Get performance metrics for a time range
   */
  async getPerformanceMetrics(
    startDate: Date,
    endDate: Date,
    interval: '1m' | '5m' | '15m' | '1h' | '1d' = '1h',
  ): Promise<PerformanceMetrics[]> {
    // This would query the metrics storage (database, time-series DB, etc.)
    // For now, return empty array
    return [];
  }

  /**
   * Get user activity metrics for a time range
   */
  async getUserActivityMetrics(
    startDate: Date,
    endDate: Date,
    interval: '1m' | '5m' | '15m' | '1h' | '1d' = '1h',
  ): Promise<UserActivityMetrics[]> {
    // This would query the metrics storage
    // For now, return empty array
    return [];
  }

  /**
   * Get business metrics for a time range
   */
  async getBusinessMetrics(
    startDate: Date,
    endDate: Date,
    interval: '1m' | '5m' | '15m' | '1h' | '1d' = '1h',
  ): Promise<BusinessMetrics[]> {
    // This would query the metrics storage
    // For now, return empty array
    return [];
  }

  /**
   * Flush performance metrics to storage
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async flushPerformanceMetrics() {
    if (this.metricsBuffer.length === 0) return;

    try {
      const metrics = [...this.metricsBuffer];
      this.metricsBuffer = [];

      // Store metrics in database or time-series database
      // For now, just log them
      this.logger.debug(`Flushed ${metrics.length} performance metrics`);

      // Emit event for external monitoring systems
      this.eventEmitter.emit('performance.metrics.flushed', metrics);
    } catch (error) {
      this.logger.error('Failed to flush performance metrics', error);
    }
  }

  /**
   * Flush user activity metrics to storage
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async flushUserActivityMetrics() {
    if (this.userActivityBuffer.length === 0) return;

    try {
      const metrics = [...this.userActivityBuffer];
      this.userActivityBuffer = [];

      // Store metrics in database or time-series database
      this.logger.debug(`Flushed ${metrics.length} user activity metrics`);

      // Emit event for external monitoring systems
      this.eventEmitter.emit('user.activity.flushed', metrics);
    } catch (error) {
      this.logger.error('Failed to flush user activity metrics', error);
    }
  }

  /**
   * Flush business metrics to storage
   */
  @Cron(CronExpression.EVERY_HOUR)
  async flushBusinessMetrics() {
    if (this.businessMetricsBuffer.length === 0) return;

    try {
      const metrics = [...this.businessMetricsBuffer];
      this.businessMetricsBuffer = [];

      // Store metrics in database or time-series database
      this.logger.debug(`Flushed ${metrics.length} business metrics`);

      // Emit event for external monitoring systems
      this.eventEmitter.emit('business.metrics.flushed', metrics);
    } catch (error) {
      this.logger.error('Failed to flush business metrics', error);
    }
  }

  /**
   * Get database connection count
   */
  private async getDatabaseConnectionCount(): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT count(*) as count 
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `;
      return Number(result[0].count);
    } catch (error) {
      this.logger.error('Failed to get database connection count', error);
      return 0;
    }
  }

  /**
   * Get WebSocket connection count
   */
  private async getWebSocketConnectionCount(): Promise<number> {
    // This would need to be implemented based on your WebSocket implementation
    // For now, return 0
    return 0;
  }

  /**
   * Health check for the monitoring service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    metrics: {
      bufferSize: number;
      lastFlush: Date;
      errors: number;
    };
  }> {
    return {
      status: 'healthy',
      metrics: {
        bufferSize: this.metricsBuffer.length + this.userActivityBuffer.length + this.businessMetricsBuffer.length,
        lastFlush: new Date(),
        errors: 0,
      },
    };
  }
} 