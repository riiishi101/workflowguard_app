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
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
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

  /**
   * Endpoint to confirm a payment and activate/update a subscription
   * POST /razorpay/confirm-payment { planId, paymentId, orderId, signature }
   */
  @Post('confirm-payment')
  async confirmPayment(@Body() confirmPaymentDto: ConfirmPaymentDto, @Req() req: any) {
    const { orderId, paymentId, signature, planId } = confirmPaymentDto;
    const userId = req.user?.sub;

    if (!userId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    // Verify the payment signature
    const isValid = this.razorpayService.verifyPaymentSignature({
      order_id: orderId,
      payment_id: paymentId,
      razorpay_signature: signature,
    });

    if (!isValid) {
      throw new HttpException('Invalid payment signature', HttpStatus.BAD_REQUEST);
    }

    // Find existing subscription or create a new one
    let subscription = await this.prisma.subscription.findFirst({
      where: { userId, status: { in: ['active', 'trialing', 'created'] } },
    });

    if (subscription) {
      // Update existing subscription
      subscription = await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          planId,
          status: 'active',
          razorpay_payment_id: paymentId,
          // Set next billing date based on plan (e.g., 1 month from now)
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    } else {
      // Create new subscription if none exists
      subscription = await this.prisma.subscription.create({
        data: {
          userId,
          planId,
          status: 'active',
          razorpay_payment_id: paymentId,
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Record the successful payment
    await this.prisma.payment.create({
      data: {
        userId,
        amount: Number((await this.razorpayService.getPaymentDetails(paymentId)).amount) / 100,
        currency: (await this.razorpayService.getPaymentDetails(paymentId)).currency,
        status: 'captured',
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        subscriptionId: subscription.id,
      },
    });

    return { success: true, message: 'Payment confirmed and subscription updated' };
  }
}
