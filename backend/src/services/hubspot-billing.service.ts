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
  private readonly UNIT_PRICE = 1.00; // $1 per overage unit

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
    const hubspotResponse = await this.createHubSpotBillingRecord(billingRecord);

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

    this.logger.log(`Successfully reported overage ${overageId} to HubSpot: $${billingRecord.totalAmount}`);

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
  private async createHubSpotBillingRecord(billingRecord: HubSpotBillingRecord): Promise<any> {
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

    this.logger.log('Sending to HubSpot billing API:', JSON.stringify(hubspotPayload, null, 2));

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));

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

    this.logger.log('Updating HubSpot usage:', JSON.stringify(payload, null, 2));

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));

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
      .filter(o => o.billed)
      .reduce((sum, o) => sum + (o.amount * this.UNIT_PRICE), 0);

    const totalUnbilled = overages
      .filter(o => !o.billed)
      .reduce((sum, o) => sum + (o.amount * this.UNIT_PRICE), 0);

    return {
      userId: user.id,
      hubspotPortalId: user.hubspotPortalId,
      totalBilled,
      totalUnbilled,
      overageCount: overages.length,
      billedCount: overages.filter(o => o.billed).length,
      unbilledCount: overages.filter(o => !o.billed).length,
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
      unbilledOverages.map(o => o.id)
    );

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    this.logger.log(`Billing processing complete: ${successCount} successful, ${failureCount} failed`);

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
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Simulate validation (assume valid if it's a non-empty string)
      const isValid = Boolean(portalId && portalId.length > 0);
      
      this.logger.log(`HubSpot portal validation: ${isValid ? 'SUCCESS' : 'FAILED'}`);
      
      return isValid;
    } catch (error) {
      this.logger.error(`HubSpot portal validation failed:`, error);
      return false;
    }
  }

  async updateUserPlansForPortal(portalId: string, newPlanId: string): Promise<void> {
    // Find all users with this portalId
    const users = await this.prisma.user.findMany({ where: { hubspotPortalId: portalId } });
    for (const user of users) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { planId: newPlanId, isTrialActive: false } as any, // End trial if upgrading/downgrading
      });
      this.logger.log(`Updated user ${user.email} (${user.id}) to plan ${newPlanId} via HubSpot webhook.`);
    }
  }
} 