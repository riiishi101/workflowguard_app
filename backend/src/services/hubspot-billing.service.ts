import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

interface HubSpotBillingRecord {
  userId: string;
  userEmail: string;
  hubspotPortalId: string;
  overageId: string;
  type: string;
  amount: number;
  periodStart: Date;
  periodEnd: Date;
  description: string;
  unitPrice: number;
  totalAmount: number;
}

interface HubSpotUsageUpdate {
  portalId: string;
  userId: string;
  usageType: string;
  usageAmount: number;
  billingPeriod: string;
}

@Injectable()
export class HubSpotBillingService {
  private readonly logger = new Logger(HubSpotBillingService.name);
  private readonly HUBSPOT_API_BASE = 'https://api.hubapi.com';
  private readonly UNIT_PRICE = 1.0; // $1 per overage unit

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  /**
   * Report overages to HubSpot billing system
   */
  async reportOveragesToHubSpot(overageIds: string[]): Promise<any[]> {
    const results = [];

    for (const overageId of overageIds) {
      try {
        const result = await this.reportSingleOverage(overageId);
        results.push({ overageId, success: true, data: result });
      } catch (error) {
        this.logger.error(`Failed to report overage ${overageId}:`, error);
        results.push({ overageId, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Report a single overage to HubSpot
   */
  private async reportSingleOverage(overageId: string): Promise<any> {
    const overage = await this.prisma.overage.findUnique({
      where: { id: overageId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            hubspotPortalId: true,
          },
        },
      },
    });

    if (!overage) {
      throw new Error(`Overage ${overageId} not found`);
    }

    if (!overage.user.hubspotPortalId) {
      throw new Error(`User ${overage.userId} has no HubSpot portal ID`);
    }

    const billingRecord: HubSpotBillingRecord = {
      userId: overage.userId,
      userEmail: overage.user.email,
      hubspotPortalId: overage.user.hubspotPortalId,
      overageId: overage.id,
      type: overage.type,
      amount: overage.amount,
      periodStart: overage.periodStart,
      periodEnd: overage.periodEnd,
      description: `WorkflowGuard ${overage.type} overage - ${overage.amount} units`,
      unitPrice: this.UNIT_PRICE,
      totalAmount: overage.amount * this.UNIT_PRICE,
    };

    // Report to HubSpot billing API
    const hubspotResponse =
      await this.createHubSpotBillingRecord(billingRecord);

    // Mark overage as billed in our system
    await this.prisma.overage.update({
      where: { id: overageId },
      data: { billed: true },
    });

    // Send notification to user
    await this.notificationService.sendBillingNotification(overage.userId, {
      overageId: overage.id,
      amount: overage.amount,
      totalAmount: billingRecord.totalAmount,
      period: `${billingRecord.periodStart.toLocaleDateString()} - ${billingRecord.periodEnd.toLocaleDateString()}`,
      hubspotReference: hubspotResponse.referenceId,
    });

    this.logger.log(
      `Successfully reported overage ${overageId} to HubSpot: $${billingRecord.totalAmount}`,
    );

    return {
      overageId,
      hubspotReference: hubspotResponse.referenceId,
      amount: billingRecord.totalAmount,
      status: 'billed',
    };
  }

  /**
   * Create billing record in HubSpot
   */
  private async createHubSpotBillingRecord(
    billingRecord: HubSpotBillingRecord,
  ): Promise<any> {
    // In a real implementation, you would make an actual API call to HubSpot
    // For now, we'll simulate the response

    const hubspotPayload = {
      portalId: billingRecord.hubspotPortalId,
      userId: billingRecord.userId,
      userEmail: billingRecord.userEmail,
      billingRecord: {
        type: 'usage_overage',
        description: billingRecord.description,
        quantity: billingRecord.amount,
        unitPrice: billingRecord.unitPrice,
        totalAmount: billingRecord.totalAmount,
        billingPeriod: {
          start: billingRecord.periodStart.toISOString(),
          end: billingRecord.periodEnd.toISOString(),
        },
        metadata: {
          overageId: billingRecord.overageId,
          overageType: billingRecord.type,
          source: 'workflowguard',
        },
      },
    };

    this.logger.log(
      'Sending to HubSpot billing API:',
      JSON.stringify(hubspotPayload, null, 2),
    );

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Simulate HubSpot response
    const mockResponse = {
      success: true,
      referenceId: `HS_BILL_${Date.now()}_${billingRecord.overageId}`,
      amount: billingRecord.totalAmount,
      status: 'pending_processing',
      message: 'Billing record created successfully',
    };

    return mockResponse;
  }

  /**
   * Update usage in HubSpot
   */
  async updateHubSpotUsage(usageUpdate: HubSpotUsageUpdate): Promise<any> {
    const payload = {
      portalId: usageUpdate.portalId,
      userId: usageUpdate.userId,
      usage: {
        type: usageUpdate.usageType,
        amount: usageUpdate.usageAmount,
        billingPeriod: usageUpdate.billingPeriod,
        timestamp: new Date().toISOString(),
      },
    };

    this.logger.log(
      'Updating HubSpot usage:',
      JSON.stringify(payload, null, 2),
    );

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      success: true,
      usageId: `HS_USAGE_${Date.now()}`,
      message: 'Usage updated successfully',
    };
  }

  /**
   * Get billing summary for a user
   */
  async getUserBillingSummary(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        hubspotPortalId: true,
      },
    });

    if (!user?.hubspotPortalId) {
      throw new Error('User has no HubSpot portal ID');
    }

    const overages = await this.prisma.overage.findMany({
      where: { userId },
      orderBy: { periodStart: 'desc' },
    });

    const totalBilled = overages
      .filter((o) => o.billed)
      .reduce((sum, o) => sum + o.amount * this.UNIT_PRICE, 0);

    const totalUnbilled = overages
      .filter((o) => !o.billed)
      .reduce((sum, o) => sum + o.amount * this.UNIT_PRICE, 0);

    return {
      userId: user.id,
      hubspotPortalId: user.hubspotPortalId,
      totalBilled,
      totalUnbilled,
      overageCount: overages.length,
      billedCount: overages.filter((o) => o.billed).length,
      unbilledCount: overages.filter((o) => !o.billed).length,
    };
  }

  /**
   * Process all unbilled overages
   */
  async processUnbilledOverages(): Promise<any> {
    const unbilledOverages = await this.prisma.overage.findMany({
      where: { billed: false },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            hubspotPortalId: true,
          },
        },
      },
    });

    this.logger.log(`Processing ${unbilledOverages.length} unbilled overages`);

    const results = await this.reportOveragesToHubSpot(
      unbilledOverages.map((o) => o.id),
    );

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    this.logger.log(
      `Billing processing complete: ${successCount} successful, ${failureCount} failed`,
    );

    return {
      totalProcessed: unbilledOverages.length,
      successful: successCount,
      failed: failureCount,
      results,
    };
  }

  /**
   * Validate HubSpot portal connection
   */
  async validateHubSpotConnection(portalId: string): Promise<boolean> {
    try {
      // In a real implementation, you would validate the portal ID with HubSpot
      // For now, we'll simulate a validation check

      this.logger.log(`Validating HubSpot portal: ${portalId}`);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Simulate validation (assume valid if it's a non-empty string)
      const isValid = Boolean(portalId && portalId.length > 0);

      this.logger.log(
        `HubSpot portal validation: ${isValid ? 'SUCCESS' : 'FAILED'}`,
      );

      return isValid;
    } catch (error) {
      this.logger.error(`HubSpot portal validation failed:`, error);
      return false;
    }
  }

  async updateUserPlansForPortal(
    portalId: string,
    newPlanId: string,
  ): Promise<void> {
    try {
      await this.prisma.user.updateMany({
        where: { hubspotPortalId: portalId },
        data: { planId: newPlanId },
      });
      this.logger.log(`Updated plan to ${newPlanId} for portal ${portalId}`);
    } catch (error) {
      this.logger.error(`Failed to update plan for portal ${portalId}:`, error);
      throw error;
    }
  }

  /**
   * Get subscription information for a user
   */
  async getSubscriptionInfo(userId: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscription: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return {
        userId: user.id,
        portalId: user.hubspotPortalId,
        planId: user.planId,
        isTrialActive: user.isTrialActive,
        trialEndDate: user.trialEndDate,
        trialPlanId: user.trialPlanId,
        subscriptionStatus: user.subscription?.status || 'active',
        nextBillingDate: user.subscription?.nextBillingDate,
        createdAt: user.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to get subscription info for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Initiate upgrade process via HubSpot marketplace
   */
  async initiateUpgrade(userId: string, planId: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.hubspotPortalId) {
        throw new Error('User not connected to HubSpot');
      }

      // For HubSpot marketplace, we redirect to HubSpot
      // This method is mainly for logging and validation
      this.logger.log(`Initiating upgrade to ${planId} for user ${userId} (portal: ${user.hubspotPortalId})`);

      return {
        success: true,
        message: 'Upgrade initiated via HubSpot marketplace',
        portalId: user.hubspotPortalId,
        planId,
        redirectUrl: `https://app.hubspot.com/ecosystem/${user.hubspotPortalId}/marketplace/apps`,
      };
    } catch (error) {
      this.logger.error(`Failed to initiate upgrade for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel subscription via HubSpot marketplace
   */
  async cancelSubscription(userId: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.hubspotPortalId) {
        throw new Error('User not connected to HubSpot');
      }

      // For HubSpot marketplace, cancellation is handled by HubSpot
      // This method is mainly for logging and validation
      this.logger.log(`Initiating subscription cancellation for user ${userId} (portal: ${user.hubspotPortalId})`);

      return {
        success: true,
        message: 'Cancellation initiated via HubSpot marketplace',
        portalId: user.hubspotPortalId,
        redirectUrl: `https://app.hubspot.com/ecosystem/${user.hubspotPortalId}/marketplace/apps`,
      };
    } catch (error) {
      this.logger.error(`Failed to cancel subscription for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get billing history for a user
   */
  async getBillingHistory(userId: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          overages: {
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // For HubSpot marketplace, billing history is available in HubSpot
      // This method provides local overage history
      return {
        userId: user.id,
        portalId: user.hubspotPortalId,
        overages: user.overages.map(overage => ({
          id: overage.id,
          type: overage.type,
          amount: overage.amount,
          periodStart: overage.periodStart,
          periodEnd: overage.periodEnd,
          totalAmount: overage.amount * this.UNIT_PRICE,
          isBilled: overage.isBilled,
          createdAt: overage.createdAt,
        })),
        hubspotBillingUrl: user.hubspotPortalId 
          ? `https://app.hubspot.com/ecosystem/${user.hubspotPortalId}/marketplace/apps`
          : null,
      };
    } catch (error) {
      this.logger.error(`Failed to get billing history for user ${userId}:`, error);
      throw error;
    }
  }
}
