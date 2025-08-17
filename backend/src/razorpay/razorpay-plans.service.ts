import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { RazorpayService } from './razorpay.service';
import { CurrencyService } from '../currency/currency.service';

export interface PlanConfig {
  id: string;
  name: string;
  basePrice: number; // USD base price
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  limits: {
    workflows: number;
    versionHistory: number;
    users: number;
  };
}

export interface MultiCurrencyPlan extends PlanConfig {
  prices: Record<string, { amount: number; formatted: string }>;
}

@Injectable()
export class RazorpayPlansService {
  private readonly plans: Record<string, PlanConfig> = {
    starter: {
      id: 'starter',
      name: 'Starter Plan',
      basePrice: 19, // USD base price
      currency: 'USD',
      interval: 'monthly',
      features: [
        'Up to 10 workflows',
        '30 days version history',
        'Basic analytics',
        'Email support'
      ],
      limits: {
        workflows: 10,
        versionHistory: 30,
        users: 1
      }
    },
    professional: {
      id: 'professional',
      name: 'Professional Plan',
      basePrice: 49, // USD base price
      currency: 'USD',
      interval: 'monthly',
      features: [
        'Up to 50 workflows',
        '90 days version history',
        'Advanced analytics',
        'Priority support',
        'Custom webhooks'
      ],
      limits: {
        workflows: 50,
        versionHistory: 90,
        users: 5
      }
    },
    enterprise: {
      id: 'enterprise',
      name: 'Enterprise Plan',
      basePrice: 99, // USD base price
      currency: 'USD',
      interval: 'monthly',
      features: [
        'Unlimited workflows',
        'Unlimited version history',
        'Advanced analytics & reporting',
        '24/7 priority support',
        'Custom integrations',
        'SSO support'
      ],
      limits: {
        workflows: -1, // unlimited
        versionHistory: -1, // unlimited
        users: -1 // unlimited
      }
    }
  };

  constructor(
    private readonly razorpayService: RazorpayService,
    private readonly currencyService: CurrencyService
  ) {}

  getAllPlans(currency?: string): MultiCurrencyPlan[] {
    return Object.values(this.plans).map(plan => this.enrichPlanWithPricing(plan, currency));
  }

  private enrichPlanWithPricing(plan: PlanConfig, targetCurrency?: string): MultiCurrencyPlan {
    const prices = this.currencyService.getAllCurrencyPrices(plan.basePrice);
    
    return {
      ...plan,
      currency: targetCurrency || plan.currency,
      prices
    };
  }

  getPlan(planId: string): PlanConfig {
    const plan = this.plans[planId];
    if (!plan) {
      throw new HttpException(`Plan ${planId} not found`, HttpStatus.NOT_FOUND);
    }
    return plan;
  }

  getPlanPrice(planId: string, currency: string = 'USD'): number {
    const plan = this.getPlan(planId);
    return this.currencyService.convertPrice(plan.basePrice, 'USD', currency);
  }

  getRazorpayPlanId(planId: string, currency: string = 'USD'): string {
    const envKey = `RAZORPAY_PLAN_ID_${planId.toUpperCase()}_${currency.toUpperCase()}`;
    const razorpayPlanId = process.env[envKey];
    
    if (!razorpayPlanId) {
      throw new HttpException(
        `Razorpay plan not configured for ${planId} in ${currency}. Please create plan in Razorpay Dashboard and add ${envKey} to environment variables.`,
        HttpStatus.BAD_REQUEST
      );
    }
    
    return razorpayPlanId;
  }

  async createRazorpayPlans(): Promise<void> {
    // Helper method to create plans in Razorpay Dashboard programmatically
    // This should be run once during setup
    
    const currencies = ['USD', 'GBP', 'EUR', 'INR', 'CAD'];
    
    for (const currency of currencies) {
      for (const [planId, plan] of Object.entries(this.plans)) {
        try {
          const price = this.getPlanPrice(planId, currency);
          
          // Create plan in Razorpay
          const razorpayPlan = await this.razorpayService.createSubscription({
            period: 'monthly',
            interval: 1,
            item: {
              name: `${plan.name} - ${currency}`,
              amount: Math.round(price * 100), // in paise/cents
              currency: currency,
              description: `WorkflowGuard ${plan.name} monthly subscription in ${currency}`
            }
          });

          console.log(`Created Razorpay plan: ${planId}_${currency} = ${razorpayPlan.id}`);
          console.log(`Add to .env: RAZORPAY_PLAN_ID_${planId.toUpperCase()}_${currency}="${razorpayPlan.id}"`);
          
        } catch (error) {
          console.error(`Failed to create plan ${planId}_${currency}:`, error);
        }
      }
    }
  }

  detectCurrencyAndGetPlan(planId: string, options: {
    cardNumber?: string;
    ipAddress?: string;
    countryCode?: string;
    userPreference?: string;
  }): { plan: MultiCurrencyPlan; detectedCurrency: string; confidence: number } {
    const detection = this.currencyService.detectCurrencyAuto(options);
    const plan = this.enrichPlanWithPricing(this.getPlan(planId), detection.currency);
    
    return {
      plan,
      detectedCurrency: detection.currency,
      confidence: detection.confidence
    };
  }

  calculateProration(currentPlan: string, newPlan: string, daysRemaining: number, currency: string = 'USD'): number {
    const current = this.getPlan(currentPlan);
    const target = this.getPlan(newPlan);
    
    const currentPrice = this.getPlanPrice(currentPlan, currency);
    const targetPrice = this.getPlanPrice(newPlan, currency);
    
    // Calculate prorated amount
    const currentDailyRate = currentPrice / 30;
    const targetDailyRate = targetPrice / 30;
    
    const refund = currentDailyRate * daysRemaining;
    const newCharge = targetDailyRate * daysRemaining;
    
    return Math.max(0, newCharge - refund);
  }

  isUpgrade(currentPlan: string, newPlan: string): boolean {
    const current = this.getPlan(currentPlan);
    const target = this.getPlan(newPlan);
    return target.basePrice > current.basePrice;
  }

  validatePlanLimits(planId: string, usage: { workflows: number; users: number }): boolean {
    const plan = this.getPlan(planId);
    
    if (plan.limits.workflows !== -1 && usage.workflows > plan.limits.workflows) {
      return false;
    }
    
    if (plan.limits.users !== -1 && usage.users > plan.limits.users) {
      return false;
    }
    
    return true;
  }
}
