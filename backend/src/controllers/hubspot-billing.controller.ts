import { Controller, Post, Get, Body, Param, UseGuards, HttpException, HttpStatus, Req, Res } from '@nestjs/common';
import { HubSpotBillingService } from '../services/hubspot-billing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';
import { Request, Response } from 'express';
import * as crypto from 'crypto';

@Controller('hubspot-billing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HubSpotBillingController {
  constructor(private readonly hubspotBillingService: HubSpotBillingService) {}

  @Post('process-overages')
  @Roles('admin')
  async processOverages(@Body() body: { overageIds?: string[] }) {
    try {
      if (body.overageIds && body.overageIds.length > 0) {
        // Process specific overages
        const results = await this.hubspotBillingService.reportOveragesToHubSpot(body.overageIds);
        return {
          message: 'Overages processed successfully',
          results,
        };
      } else {
        // Process all unbilled overages
        const result = await this.hubspotBillingService.processUnbilledOverages();
        return {
          message: 'All unbilled overages processed',
          ...result,
        };
      }
    } catch (error) {
      throw new HttpException(
        `Failed to process overages: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('user/:userId/billing-summary')
  @Roles('admin')
  async getUserBillingSummary(@Param('userId') userId: string) {
    try {
      const summary = await this.hubspotBillingService.getUserBillingSummary(userId);
      return summary;
    } catch (error) {
      throw new HttpException(
        `Failed to get billing summary: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('validate-connection')
  @Roles('admin')
  async validateConnection(@Body() body: { portalId: string }) {
    try {
      const isValid = await this.hubspotBillingService.validateHubSpotConnection(body.portalId);
      return {
        portalId: body.portalId,
        isValid,
        message: isValid ? 'HubSpot connection validated successfully' : 'Invalid HubSpot portal ID',
      };
    } catch (error) {
      throw new HttpException(
        `Validation failed: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('update-usage')
  @Roles('admin')
  async updateUsage(@Body() body: {
    portalId: string;
    userId: string;
    usageType: string;
    usageAmount: number;
    billingPeriod: string;
  }) {
    try {
      const result = await this.hubspotBillingService.updateHubSpotUsage(body);
      return {
        message: 'Usage updated successfully',
        ...result,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to update usage: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('status')
  @Roles('admin')
  async getBillingStatus() {
    try {
      // Get overall billing system status
      const unbilledOverages = await this.hubspotBillingService.processUnbilledOverages();
      
      return {
        status: 'operational',
        timestamp: new Date().toISOString(),
        unbilledOverages: unbilledOverages.totalProcessed,
        lastProcessed: new Date().toISOString(),
        message: 'HubSpot billing system is operational',
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
        message: 'HubSpot billing system encountered an error',
      };
    }
  }

  @Post('webhook')
  @Public()
  async handleHubSpotBillingWebhook(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    // Validate HubSpot webhook signature
    const signature = req.headers['x-hubspot-signature'] as string;
    const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
    if (!clientSecret) {
      return res.status(500).json({ message: 'HUBSPOT_CLIENT_SECRET not set in environment' });
    }
    const rawBody = JSON.stringify(body);
    const expectedSignature = crypto.createHmac('sha256', clientSecret).update(rawBody).digest('hex');
    if (!signature || signature !== expectedSignature) {
      return res.status(401).json({ message: 'Invalid HubSpot webhook signature' });
    }
    try {
      // Example: HubSpot sends { eventType, portalId, newPlanId }
      const { portalId, newPlanId } = body;
      if (!portalId || !newPlanId) {
        return res.status(400).json({ message: 'Missing portalId or newPlanId in webhook payload' });
      }
      await this.hubspotBillingService.updateUserPlansForPortal(portalId, newPlanId);
      return res.status(200).json({ message: 'Plan updated successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to process webhook', error: error.message });
    }
  }
} 