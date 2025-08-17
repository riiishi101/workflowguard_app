import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UserSubscription,
  TrialStatus,
  UsageStats,
  SubscriptionExpirationStatus,
  NextPaymentInfo,
} from '../types/subscription.types';
import { PLANS, DEFAULT_PLAN_ID } from './plan.config';
import { CurrencyService } from '../currency/currency.service';
import { RazorpayPlansService } from '../razorpay/razorpay-plans.service';

@Injectable()
export class SubscriptionService {
  constructor(
    private prisma: PrismaService,
    private currencyService: CurrencyService,
    private razorpayPlansService: RazorpayPlansService
  ) {}

  async getUserSubscription(userId: string, currency?: string): Promise<UserSubscription> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true, workflows: true },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const planId = user.subscription?.planId || DEFAULT_PLAN_ID;
      const subscriptionCurrency = user.subscription?.currency || currency || 'USD';
      
      // Get plan with multi-currency pricing
      const multiCurrencyPlan = this.razorpayPlansService.getAllPlans(subscriptionCurrency)
        .find(p => p.id === planId) || this.razorpayPlansService.getAllPlans(subscriptionCurrency)[0];
      
      const plan = PLANS[planId] || PLANS[DEFAULT_PLAN_ID];
      const workflowsUsed = user.workflows?.length || 0;
      
      // Get price in the requested currency
      const priceInCurrency = multiCurrencyPlan.prices[subscriptionCurrency]?.amount || plan.price;

      return {
        id: user.subscription?.id || 'mock-subscription-id',
        planId: plan.id,
        planName: plan.name,
        price: priceInCurrency,
        currency: subscriptionCurrency,
        status: user.subscription?.status || 'active',
        currentPeriodStart:
          user.subscription?.createdAt || new Date(),
        currentPeriodEnd:
          user.subscription?.trialEndDate ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        trialEndDate: user.subscription?.trialEndDate || null,
        nextBillingDate: user.subscription?.nextBillingDate || null,
        features: plan.features,
        limits: plan.limits,
        usage: {
          workflows: workflowsUsed,
          versionHistory: 0, // Placeholder
          teamMembers: 1, // Placeholder
        },
        allCurrencyPrices: multiCurrencyPlan.prices,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Failed to get user subscription: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTrialStatus(userId: string): Promise<TrialStatus> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { subscription: { select: { trialEndDate: true } } },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const trialEndDate = user.subscription?.trialEndDate;
      if (!trialEndDate) {
        return { isTrialActive: false, isTrialExpired: false, trialDaysRemaining: 0, trialEndDate: undefined };
      }

      const now = new Date();
      const isTrialActive = trialEndDate > now;
      const isTrialExpired = trialEndDate <= now;
      const diffTime = trialEndDate.getTime() - now.getTime();
      const trialDaysRemaining = isTrialActive ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;

      return {
        isTrialActive,
        isTrialExpired,
        trialDaysRemaining,
        trialEndDate: trialEndDate.toISOString(),
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Failed to get trial status: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUsageStats(userId: string): Promise<UsageStats> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true, workflows: true },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const planId = user.subscription?.planId || DEFAULT_PLAN_ID;
      const plan = PLANS[planId] || PLANS[DEFAULT_PLAN_ID];
      const limits = plan.limits;

      const workflowsUsed = user.workflows?.length || 0;

      return {
        workflows: {
          used: workflowsUsed,
          limit: limits.workflows,
          percentage: Math.min((workflowsUsed / limits.workflows) * 100, 100),
        },
        versionHistory: { used: 0, limit: limits.versionHistory, percentage: 0 }, // Placeholder
        teamMembers: { used: 1, limit: limits.teamMembers, percentage: (1 / limits.teamMembers) * 100 }, // Placeholder
        storage: { used: 0, limit: 1000, percentage: 0 }, // Placeholder
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Failed to get usage stats: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async checkSubscriptionExpiration(userId: string): Promise<SubscriptionExpirationStatus> {
    try {
      const subscription = await this.prisma.subscription.findFirst({
        where: { userId },
      });

      if (!subscription) {
        return { isExpired: false, message: 'No subscription found' };
      }

      const now = new Date();
      if (subscription.nextBillingDate && now > subscription.nextBillingDate) {
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'expired' },
        });
        return { isExpired: true, message: 'Subscription has expired', expiredDate: subscription.nextBillingDate };
      }

      return { isExpired: false };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Error checking subscription expiration: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getNextPaymentInfo(userId: string): Promise<NextPaymentInfo> {
    try {
      const subscription = await this.prisma.subscription.findFirst({
        where: { userId },
      });

      if (!subscription) {
        return { hasSubscription: false };
      }

      if (!subscription.nextBillingDate) {
        return { hasSubscription: true, nextPayment: null };
      }

      const now = new Date();
      const daysUntilPayment = Math.ceil((subscription.nextBillingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        hasSubscription: true,
        nextPayment: {
          date: subscription.nextBillingDate,
          daysUntil: daysUntilPayment,
          isOverdue: daysUntilPayment < 0,
          amount: this.getPlanPrice(subscription.planId, subscription.currency || 'USD'),
          currency: subscription.currency || 'USD',
        },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Error getting next payment info: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private getPlanPrice(planId: string, currency: string = 'USD'): number {
    try {
      return this.razorpayPlansService.getPlanPrice(planId, currency);
    } catch {
      return PLANS[planId]?.price || 0;
    }
  }

  async createSubscriptionWithCurrency(userId: string, planId: string, options: {
    cardNumber?: string;
    ipAddress?: string;
    countryCode?: string;
    userPreference?: string;
  }): Promise<{ subscription: any; detectedCurrency: string; confidence: number }> {
    const detection = this.razorpayPlansService.detectCurrencyAndGetPlan(planId, options);
    
    // Create subscription with detected currency
    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        planId,
        currency: detection.detectedCurrency,
        status: 'active',
        createdAt: new Date(),
        trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
        nextBillingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      subscription,
      detectedCurrency: detection.detectedCurrency,
      confidence: detection.confidence
    };
  }
}
