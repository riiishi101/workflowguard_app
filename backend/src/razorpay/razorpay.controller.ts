import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RazorpayService } from './razorpay.service';
import { PrismaService } from '../prisma/prisma.service';
import { Request, Response } from 'express';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UserService } from '../user/user.service';
import { EmailService } from '../services/email.service';

@Controller('razorpay')
export class RazorpayController {
  constructor(
    private readonly razorpayService: RazorpayService,
    @Inject(UserService)
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  // ...existing endpoints

  /**
   * Endpoint to create a recurring Razorpay subscription
   * POST /razorpay/create-subscription { userId, planId, currency? }
   */
  @Post('create-subscription')
  async createRazorpaySubscription(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    const { userId, planId, currency = 'USD' } = createSubscriptionDto;
    const planPrices: Record<string, number> = {
      starter: 19,
      professional: 49,
      enterprise: 99,
    };
    const amount = planPrices[planId] || 49;

    // Robust plan_id lookup by plan and currency, ready for INR, USD, etc
    const planEnvKey = `RAZORPAY_PLAN_ID_${planId.toUpperCase()}_${currency.toUpperCase()}`;
    const plan_id = process.env[planEnvKey];
    if (!plan_id) {
      throw new HttpException(
        `Plan not available for selected currency (${planId} / ${currency}). Please contact support or try another currency.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Create a subscription in Razorpay
    const rzSub = await this.razorpayService.createSubscription({
      plan_id,
      total_count: 12, // 12 cycles (months), change as needed
      customer_notify: 1,
      notes: { userId, planId },
    });

    // Save the subscription in DB
    const newSubscription = await this.prisma.subscription.create({
      data: {
        userId,
        planId,
        status: 'active',
        razorpay_subscription_id: rzSub.id,
        // Use 'current_end' timestamp for next billing date if available, else use new Date()
        nextBillingDate: rzSub.current_end
          ? new Date(rzSub.current_end * 1000)
          : new Date(),
      },
    });

    // Send confirmation email
    try {
      const user = await this.userService.findOne(userId);
      if (user) {
        await this.emailService.sendSubscriptionConfirmationEmail(
          user,
          newSubscription,
        );
      }
    } catch (error) {
      console.error(
        `Failed to send subscription email for user ${userId}`,
        error,
      );
      // Do not block the response for email failure
    }

    return { id: rzSub.id, short_url: rzSub.short_url, subscription: rzSub };
  }
}
