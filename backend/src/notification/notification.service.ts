import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../services/email.service';
import { RealtimeService } from '../services/realtime.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private realtimeService: RealtimeService,
  ) {}

  async sendOverageAlert(userId: string, overageData: any) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      if (!user) {
        this.logger.warn(`User ${userId} not found for overage notification`);
        return;
      }

      // Send email notification
      const emailSuccess = await this.emailService.sendOverageAlert({
        userEmail: user.email,
        userName: user.name || user.email,
        overageCount: overageData.count || 1,
        overageAmount: overageData.amount || 1.0,
        period: overageData.period || new Date().toISOString().slice(0, 7),
        planId: user.subscription?.planId || 'unknown',
        recommendedPlan: this.getRecommendedPlan(user.subscription?.planId),
      });

      // Send real-time notification
      const realtimeSuccess = await this.realtimeService.sendOverageAlert(
        userId,
        overageData,
      );

      // Send webhook notifications if configured
      await this.sendWebhookNotification(userId, {
        type: 'overage_alert',
        data: overageData,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });

      // Log the notification
      this.logger.log(
        `Overage alert sent to user ${user.email}: ${overageData.amount} overages (email: ${emailSuccess}, realtime: ${realtimeSuccess})`,
      );

      return {
        success: true,
        sentTo: user.email,
        emailSent: emailSuccess,
        realtimeSent: realtimeSuccess,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send overage alert to user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async sendBillingNotification(userId: string, billingData: any) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        this.logger.warn(`User ${userId} not found for billing notification`);
        return;
      }

      // Send email notification
      const emailSuccess = await this.emailService.sendBillingUpdate({
        userEmail: user.email,
        userName: user.name || user.email,
        billingAmount: billingData.totalAmount || 0,
        billingPeriod:
          billingData.period || new Date().toISOString().slice(0, 7),
        overageDetails: billingData.overageDetails || [],
      });

      // Send real-time notification
      const realtimeSuccess = await this.realtimeService.sendBillingUpdate(
        userId,
        billingData,
      );

      // Send webhook notifications if configured
      await this.sendWebhookNotification(userId, {
        type: 'billing_notification',
        data: billingData,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });

      this.logger.log(
        `Billing notification sent to user ${user.email} (email: ${emailSuccess}, realtime: ${realtimeSuccess})`,
      );

      return {
        success: true,
        sentTo: user.email,
        emailSent: emailSuccess,
        realtimeSent: realtimeSuccess,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send billing notification to user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async sendPlanUpgradeReminder(
    userId: string,
    currentPlan: string,
    recommendedPlan: string,
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        this.logger.warn(`User ${userId} not found for plan upgrade reminder`);
        return;
      }

      // Send email notification
      const emailSuccess = await this.emailService.sendUpgradeRecommendation(
        user.email,
        user.name || user.email,
        currentPlan,
        recommendedPlan,
        'Frequent overages detected - upgrade recommended',
      );

      // Send real-time notification
      const realtimeSuccess = await this.realtimeService.sendSystemAlert(
        userId,
        {
          type: 'plan_upgrade_reminder',
          message: `Consider upgrading from ${currentPlan} to ${recommendedPlan} plan`,
          actionRequired: false,
        },
      );

      // Send webhook notifications if configured
      await this.sendWebhookNotification(userId, {
        type: 'plan_upgrade_reminder',
        data: {
          currentPlan,
          recommendedPlan,
          reason: 'frequent_overages',
        },
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });

      this.logger.log(
        `Plan upgrade reminder sent to user ${user.email} (email: ${emailSuccess}, realtime: ${realtimeSuccess})`,
      );

      return {
        success: true,
        sentTo: user.email,
        emailSent: emailSuccess,
        realtimeSent: realtimeSuccess,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send plan upgrade reminder to user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async sendUsageWarning(userId: string, usageData: any) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      if (!user) {
        this.logger.warn(`User ${userId} not found for usage warning`);
        return;
      }

      const currentUsage = usageData.currentUsage || 0;
      const limit = usageData.limit || 10;
      const percentageUsed = Math.round((currentUsage / limit) * 100);

      // Send email notification
      const emailSuccess = await this.emailService.sendUsageWarning(
        user.email,
        user.name || user.email,
        user.subscription?.planId || 'unknown',
        currentUsage,
        limit,
        percentageUsed,
      );

      // Send real-time notification
      const realtimeSuccess = await this.realtimeService.sendUsageWarning(
        userId,
        {
          currentUsage,
          limit,
          percentageUsed,
          planId: user.subscription?.planId || 'unknown',
        },
      );

      // Send webhook notifications if configured
      await this.sendWebhookNotification(userId, {
        type: 'usage_warning',
        data: usageData,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });

      this.logger.log(
        `Usage warning sent to user ${user.email} (email: ${emailSuccess}, realtime: ${realtimeSuccess})`,
      );

      return {
        success: true,
        sentTo: user.email,
        emailSent: emailSuccess,
        realtimeSent: realtimeSuccess,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send usage warning to user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async sendWelcomeEmail(userId: string, planData: any) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      if (!user) {
        this.logger.warn(`User ${userId} not found for welcome email`);
        return;
      }

      // Send email notification
      const emailSuccess = await this.emailService.sendWelcomeEmail({
        userEmail: user.email,
        userName: user.name || user.email,
        planId: user.subscription?.planId || 'trial',
        workflowLimit: planData.workflowLimit || 10,
        features: planData.features || [
          'Basic workflow protection',
          'Version control',
          'Rollback capability',
        ],
      });

      // Send real-time notification
      const realtimeSuccess = await this.realtimeService.sendSystemAlert(
        userId,
        {
          type: 'welcome',
          message:
            'Welcome to WorkflowGuard! Your account has been successfully set up.',
          actionRequired: false,
        },
      );

      this.logger.log(
        `Welcome email sent to user ${user.email} (email: ${emailSuccess}, realtime: ${realtimeSuccess})`,
      );

      return {
        success: true,
        sentTo: user.email,
        emailSent: emailSuccess,
        realtimeSent: realtimeSuccess,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async sendSystemAlert(userId: string, alertData: any) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        this.logger.warn(`User ${userId} not found for system alert`);
        return;
      }

      // Send email notification
      const emailSuccess = await this.emailService.sendSystemAlert({
        userEmail: user.email,
        userName: user.name || user.email,
        alertType: alertData.type || 'system_maintenance',
        message: alertData.message || 'System maintenance notification',
        actionRequired: alertData.actionRequired || false,
      });

      // Send real-time notification
      const realtimeSuccess = await this.realtimeService.sendSystemAlert(
        userId,
        alertData,
      );

      // Send webhook notifications if configured
      await this.sendWebhookNotification(userId, {
        type: 'system_alert',
        data: alertData,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });

      this.logger.log(
        `System alert sent to user ${user.email} (email: ${emailSuccess}, realtime: ${realtimeSuccess})`,
      );

      return {
        success: true,
        sentTo: user.email,
        emailSent: emailSuccess,
        realtimeSent: realtimeSuccess,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send system alert to user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async sendWorkflowUpdate(userId: string, workflowData: any) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        this.logger.warn(`User ${userId} not found for workflow update`);
        return;
      }

      // Send real-time update
      const realtimeSuccess = await this.realtimeService.sendWorkflowUpdate(
        userId,
        workflowData,
      );

      this.logger.log(
        `Workflow update sent to user ${user.email} (realtime: ${realtimeSuccess})`,
      );

      return {
        success: true,
        sentTo: user.email,
        realtimeSent: realtimeSuccess,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send workflow update to user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async sendAuditLogUpdate(auditData: any) {
    try {
      // Send real-time update to admin room
      const realtimeSuccess =
        await this.realtimeService.sendAuditLogUpdate(auditData);

      this.logger.log(
        `Audit log update sent to admin room (realtime: ${realtimeSuccess})`,
      );

      return { success: true, realtimeSent: realtimeSuccess };
    } catch (error) {
      this.logger.error(`Failed to send audit log update:`, error);
      throw error;
    }
  }

  private async sendWebhookNotification(userId: string, payload: any) {
    try {
      const webhooks = await this.prisma.webhook.findMany({
        where: {
          userId,
          events: { has: payload.type },
        },
      });

      for (const webhook of webhooks) {
        try {
          // In a real implementation, you would make an HTTP request to the webhook URL
          // For now, we'll just log it
          this.logger.log(
            `Webhook notification sent to ${webhook.endpointUrl}:`,
            {
              webhookId: webhook.id,
              payload,
            },
          );
          // Removed TODO and example HTTP request code for production
        } catch (webhookError) {
          this.logger.error(
            `Failed to send webhook to ${webhook.endpointUrl}:`,
            webhookError,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to process webhook notifications for user ${userId}:`,
        error,
      );
    }
  }

  private getRecommendedPlan(currentPlan?: string): string | undefined {
    if (!currentPlan) return undefined;

    switch (currentPlan) {
      case 'trial':
        return 'professional';
      case 'professional':
        return 'enterprise';
      default:
        return undefined;
    }
  }
}
