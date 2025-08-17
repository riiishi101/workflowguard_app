import { Controller, Post, Body, Get, Query, Req, HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { RazorpayPlansService } from '../razorpay/razorpay-plans.service';
import { CurrencyService } from '../currency/currency.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { RazorpayService } from '../razorpay/razorpay.service';

interface CreateSubscriptionDto {
  planId: string;
  cardNumber?: string;
  userPreference?: string;
  countryCode?: string;
}

interface CurrencyDetectionDto {
  cardNumber?: string;
  countryCode?: string;
  userPreference?: string;
}

@Controller('billing/multi-currency')
export class MultiCurrencyBillingController {
  constructor(
    private readonly razorpayPlansService: RazorpayPlansService,
    private readonly currencyService: CurrencyService,
    private readonly subscriptionService: SubscriptionService,
    private readonly razorpayService: RazorpayService
  ) {}

  @Get('currencies')
  getSupportedCurrencies() {
    return {
      success: true,
      currencies: this.currencyService.getSupportedCurrencies()
    };
  }

  @Get('plans')
  getPlansWithCurrency(@Query('currency') currency?: string) {
    try {
      const plans = this.razorpayPlansService.getAllPlans(currency);
      return {
        success: true,
        plans,
        detectedCurrency: currency || 'USD'
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get plans: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('detect-currency')
  detectCurrency(@Body() dto: CurrencyDetectionDto, @Req() req: Request) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress || '';
      
      const detection = this.currencyService.detectCurrencyAuto({
        cardNumber: dto.cardNumber,
        countryCode: dto.countryCode,
        userPreference: dto.userPreference,
        ipAddress
      });

      const currency = this.currencyService.getCurrency(detection.currency);

      return {
        success: true,
        detectedCurrency: detection.currency,
        confidence: detection.confidence,
        source: detection.source,
        currencyInfo: currency
      };
    } catch (error) {
      throw new HttpException(
        `Currency detection failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('create-subscription')
  async createSubscriptionWithCurrency(
    @Body() dto: CreateSubscriptionDto,
    @Req() req: Request
  ) {
    try {
      // Extract user ID from JWT (assuming it's in req.user)
      const userId = (req.user as any)?.sub || (req.user as any)?.id || (req.user as any)?.userId;
      
      if (!userId) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }

      const ipAddress = req.ip || req.connection.remoteAddress || '';

      // Detect currency and get plan
      const detection = this.razorpayPlansService.detectCurrencyAndGetPlan(dto.planId, {
        cardNumber: dto.cardNumber,
        countryCode: dto.countryCode,
        userPreference: dto.userPreference,
        ipAddress
      });

      // Get Razorpay plan ID for the detected currency
      const razorpayPlanId = this.razorpayPlansService.getRazorpayPlanId(
        dto.planId,
        detection.detectedCurrency
      );

      // Create Razorpay subscription
      const razorpaySubscription = await this.razorpayService.createSubscription({
        plan_id: razorpayPlanId,
        customer_notify: 1,
        quantity: 1,
        total_count: 12, // 12 months
        notes: {
          userId,
          planId: dto.planId,
          currency: detection.detectedCurrency
        }
      });

      // Create local subscription record
      const subscription = await this.subscriptionService.createSubscriptionWithCurrency(
        userId,
        dto.planId,
        {
          cardNumber: dto.cardNumber,
          countryCode: dto.countryCode,
          userPreference: dto.userPreference,
          ipAddress
        }
      );

      return {
        success: true,
        subscription: {
          id: subscription.subscription.id,
          planId: dto.planId,
          currency: detection.detectedCurrency,
          confidence: detection.confidence,
          plan: detection.plan
        },
        razorpaySubscription: {
          id: razorpaySubscription.id,
          short_url: razorpaySubscription.short_url,
          status: razorpaySubscription.status
        }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to create subscription: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('plan-pricing/:planId')
  getPlanPricing(
    @Query('planId') planId: string,
    @Query('currency') currency?: string
  ) {
    try {
      const plan = this.razorpayPlansService.getPlan(planId);
      const allPrices = this.currencyService.getAllCurrencyPrices(plan.basePrice);
      
      const targetCurrency = currency || 'USD';
      const price = this.razorpayPlansService.getPlanPrice(planId, targetCurrency);

      return {
        success: true,
        planId,
        currency: targetCurrency,
        price,
        formattedPrice: this.currencyService.formatPrice(price, targetCurrency),
        allCurrencyPrices: allPrices
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get plan pricing: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('convert-price')
  convertPrice(@Body() body: { amount: number; from: string; to: string }) {
    try {
      const convertedAmount = this.currencyService.convertPrice(
        body.amount,
        body.from,
        body.to
      );

      return {
        success: true,
        originalAmount: body.amount,
        originalCurrency: body.from,
        convertedAmount,
        targetCurrency: body.to,
        formattedAmount: this.currencyService.formatPrice(convertedAmount, body.to)
      };
    } catch (error) {
      throw new HttpException(
        `Currency conversion failed: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('razorpay-plan-ids')
  getRazorpayPlanIds() {
    try {
      const currencies = ['USD', 'GBP', 'EUR', 'INR', 'CAD'];
      const plans = ['starter', 'professional', 'enterprise'];
      const planIds: Record<string, Record<string, string>> = {};

      for (const plan of plans) {
        planIds[plan] = {};
        for (const currency of currencies) {
          try {
            planIds[plan][currency] = this.razorpayPlansService.getRazorpayPlanId(plan, currency);
          } catch {
            planIds[plan][currency] = 'NOT_CONFIGURED';
          }
        }
      }

      return {
        success: true,
        planIds,
        note: 'Plans marked as NOT_CONFIGURED need to be created in Razorpay Dashboard'
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get plan IDs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
