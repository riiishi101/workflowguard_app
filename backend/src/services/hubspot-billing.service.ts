import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  HubSpotBillingResponse,
  SubscriptionStatus,
  HubSpotSubscriptionInfo,
  CancelSubscriptionResponse,
  HubSpotPaymentResponse,
  HubSpotInvoiceResponse,
} from '../types/hubspot-billing.types';

export interface HubSpotBillingConfig {
  appId: string;
  clientId: string;
  clientSecret: string;
  billingApiUrl: string;
}

export interface BillingPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
}

// Using SubscriptionStatus from types/hubspot-billing.types.ts

@Injectable()
export class HubSpotBillingService {
  constructor(private prisma: PrismaService) {}

  // Get user's subscription status from HubSpot
  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      if (!user?.hubspotAccessToken) {
        throw new HttpException(
          'HubSpot not connected',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Call HubSpot API to get subscription status
      const response = await fetch(
        `${process.env.HUBSPOT_BILLING_API_URL}/subscriptions/${user.hubspotPortalId}`,
        {
          headers: {
            Authorization: `Bearer ${user.hubspotAccessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new HttpException(
          'Failed to fetch subscription status',
          HttpStatus.BAD_REQUEST,
        );
      }

      const data = (await response.json()) as HubSpotBillingResponse;
      return {
        isActive: data.status === 'active',
        planId: data.plan_id,
        currentPeriodEnd: new Date(data.current_period_end),
        nextBillingDate: new Date(data.next_billing_date),
        status: data.status,
      };
    } catch (error) {
      console.error(
        'HubSpot Billing Service - Error getting subscription status:',
        error,
      );
      throw new HttpException(
        'Failed to get subscription status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Create a new subscription through HubSpot
  async createSubscription(
    userId: string,
    planId: string,
  ): Promise<HubSpotSubscriptionInfo> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user?.hubspotAccessToken) {
        throw new HttpException(
          'HubSpot not connected',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Create subscription through HubSpot API
      const response = await fetch(
        `${process.env.HUBSPOT_BILLING_API_URL}/subscriptions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${user.hubspotAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan_id: planId,
            portal_id: user.hubspotPortalId,
            user_id: userId,
          }),
        },
      );

      if (!response.ok) {
        throw new HttpException(
          'Failed to create subscription',
          HttpStatus.BAD_REQUEST,
        );
      }

      const subscription = (await response.json()) as HubSpotSubscriptionInfo;

      // Update local database
      await this.prisma.subscription.upsert({
        where: { userId },
        update: {
          planId: planId,
          status: 'active',
          nextBillingDate: new Date(subscription.next_billing_date),
        },
        create: {
          userId,
          planId: planId,
          status: 'active',
          nextBillingDate: new Date(subscription.next_billing_date),
        },
      });

      return subscription;
    } catch (error) {
      console.error(
        'HubSpot Billing Service - Error creating subscription:',
        error,
      );
      throw new HttpException(
        'Failed to create subscription',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Cancel subscription through HubSpot
  async cancelSubscription(userId: string): Promise<CancelSubscriptionResponse> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user?.hubspotAccessToken) {
        throw new HttpException(
          'HubSpot not connected',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Cancel subscription through HubSpot API
      const response = await fetch(
        `${process.env.HUBSPOT_BILLING_API_URL}/subscriptions/${user.hubspotPortalId}/cancel`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${user.hubspotAccessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new HttpException(
          'Failed to cancel subscription',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Update local database
      await this.prisma.subscription.updateMany({
        where: { userId },
        data: { status: 'canceled' },
      });

      return { success: true };
    } catch (error) {
      console.error(
        'HubSpot Billing Service - Error canceling subscription:',
        error,
      );
      throw new HttpException(
        'Failed to cancel subscription',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get available plans from HubSpot
  async getAvailablePlans(): Promise<BillingPlan[]> {
    try {
      // This would typically come from HubSpot's marketplace API
      return [
        {
          id: 'starter',
          name: 'Starter',
          price: 19,
          interval: 'month',
          features: ['Up to 5 workflows', 'Basic monitoring', 'Email support'],
        },
        {
          id: 'professional',
          name: 'Professional',
          price: 49,
          interval: 'month',
          features: [
            'Up to 25 workflows',
            'Advanced monitoring',
            'Priority support',
            'API access',
          ],
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          price: 99,
          interval: 'month',
          features: [
            'Unlimited workflows',
            'Advanced analytics',
            '24/7 support',
            'Custom integrations',
          ],
        },
      ];
    } catch (error) {
      console.error('HubSpot Billing Service - Error getting plans:', error);
      throw new HttpException(
        'Failed to get available plans',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Process payment through HubSpot
  async processPayment(
    userId: string,
    amount: number,
    planId: string,
  ): Promise<HubSpotPaymentResponse> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user?.hubspotAccessToken) {
        throw new HttpException(
          'HubSpot not connected',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Process payment through HubSpot API
      const response = await fetch(
        `${process.env.HUBSPOT_BILLING_API_URL}/payments`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${user.hubspotAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            plan_id: planId,
            portal_id: user.hubspotPortalId,
            user_id: userId,
          }),
        },
      );

      if (!response.ok) {
        throw new HttpException(
          'Payment processing failed',
          HttpStatus.BAD_REQUEST,
        );
      }

      return (await response.json()) as HubSpotPaymentResponse;
    } catch (error) {
      console.error(
        'HubSpot Billing Service - Error processing payment:',
        error,
      );
      throw new HttpException(
        'Payment processing failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Create invoice through HubSpot
  async createInvoice(
    userId: string,
    amount: number,
    description: string,
  ): Promise<HubSpotInvoiceResponse> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user?.hubspotAccessToken) {
        throw new HttpException(
          'HubSpot not connected',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Create invoice through HubSpot API
      const response = await fetch(
        `${process.env.HUBSPOT_BILLING_API_URL}/invoices`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${user.hubspotAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            description,
            portal_id: user.hubspotPortalId,
            user_id: userId,
          }),
        },
      );

      if (!response.ok) {
        throw new HttpException(
          'Failed to create invoice',
          HttpStatus.BAD_REQUEST,
        );
      }

      return (await response.json()) as HubSpotInvoiceResponse;
    } catch (error) {
      console.error('HubSpot Billing Service - Error creating invoice:', error);
      throw new HttpException(
        'Failed to create invoice',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
