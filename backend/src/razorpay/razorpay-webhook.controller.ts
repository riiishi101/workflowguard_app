import {
  Controller,
  Post,
  Req,
  Res,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RazorpayService } from './razorpay.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../services/email.service';
import { UserService } from '../user/user.service';

@Controller('razorpay')
export class RazorpayWebhookController {
  private readonly logger = new Logger(RazorpayWebhookController.name);

  constructor(
    private readonly razorpayService: RazorpayService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly userService: UserService,
  ) {}

  @Post('webhook')
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const body = req.body;

      // Verify webhook signature
      if (!this.razorpayService.verifySignature(Buffer.from(JSON.stringify(body)), signature)) {
        this.logger.error('Invalid Razorpay webhook signature');
        throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
      }

      const event = body.event;
      const payload = body.payload;

      this.logger.log(`Received Razorpay webhook: ${event}`);

      // Handle different webhook events
      switch (event) {
        case 'payment.captured':
          await this.handlePaymentCaptured(payload);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(payload);
          break;
        case 'subscription.activated':
          await this.handleSubscriptionActivated(payload);
          break;
        case 'subscription.charged':
          await this.handleSubscriptionCharged(payload);
          break;
        case 'subscription.cancelled':
          await this.handleSubscriptionCancelled(payload);
          break;
        case 'subscription.completed':
          await this.handleSubscriptionCompleted(payload);
          break;
        case 'payment.dispute.created':
          await this.handlePaymentDispute(payload);
          break;
        default:
          this.logger.log(`Unhandled webhook event: ${event}`);
      }

      res.status(200).json({ status: 'ok' });
    } catch (error) {
      this.logger.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  private async handlePaymentCaptured(payload: any) {
    const payment = payload.payment.entity;
    this.logger.log(`Payment captured: ${payment.id}, Amount: ${payment.amount}`);

    // Update subscription status if this is a subscription payment
    if (payment.notes?.userId && payment.notes?.planId) {
      await this.updateSubscriptionStatus(payment.notes.userId, 'active');
      
      // Send success email
      const user = await this.userService.findOne(payment.notes.userId);
      if (user) {
        await this.emailService.sendPaymentSuccessEmail(user, {
          amount: payment.amount / 100,
          currency: payment.currency,
          planId: payment.notes.planId,
        });
      }
    }
  }

  private async handlePaymentFailed(payload: any) {
    const payment = payload.payment.entity;
    this.logger.error(`Payment failed: ${payment.id}, Reason: ${payment.error_description}`);

    if (payment.notes?.userId) {
      const user = await this.userService.findOne(payment.notes.userId);
      if (user) {
        await this.emailService.sendPaymentFailedEmail(user, {
          amount: payment.amount / 100,
          currency: payment.currency,
          reason: payment.error_description,
        });
      }
    }
  }

  private async handleSubscriptionActivated(payload: any) {
    const subscription = payload.subscription.entity;
    this.logger.log(`Subscription activated: ${subscription.id}`);

    // Update subscription in database
    await this.prisma.subscription.updateMany({
      where: { razorpay_subscription_id: subscription.id },
      data: { 
        status: 'active',
        nextBillingDate: new Date(subscription.current_end * 1000),
      },
    });
  }

  private async handleSubscriptionCharged(payload: any) {
    const subscription = payload.subscription.entity;
    const payment = payload.payment.entity;
    
    this.logger.log(`Subscription charged: ${subscription.id}, Payment: ${payment.id}`);

    // Update next billing date
    await this.prisma.subscription.updateMany({
      where: { razorpay_subscription_id: subscription.id },
      data: { 
        nextBillingDate: new Date(subscription.current_end * 1000),
      },
    });

    // Send billing confirmation email
    const dbSubscription = await this.prisma.subscription.findFirst({
      where: { razorpay_subscription_id: subscription.id },
    });

    if (dbSubscription) {
      const user = await this.userService.findOne(dbSubscription.userId);
      if (user) {
        await this.emailService.sendBillingConfirmationEmail(user, {
          amount: payment.amount / 100,
          currency: payment.currency,
          planId: dbSubscription.planId,
          nextBillingDate: new Date(subscription.current_end * 1000),
        });
      }
    }
  }

  private async handleSubscriptionCancelled(payload: any) {
    const subscription = payload.subscription.entity;
    this.logger.log(`Subscription cancelled: ${subscription.id}`);

    // Update subscription status
    await this.prisma.subscription.updateMany({
      where: { razorpay_subscription_id: subscription.id },
      data: { status: 'cancelled' },
    });

    // Send cancellation confirmation email
    const dbSubscription = await this.prisma.subscription.findFirst({
      where: { razorpay_subscription_id: subscription.id },
    });

    if (dbSubscription) {
      const user = await this.userService.findOne(dbSubscription.userId);
      if (user) {
        await this.emailService.sendSubscriptionCancellationEmail(user, dbSubscription);
      }
    }
  }

  private async handleSubscriptionCompleted(payload: any) {
    const subscription = payload.subscription.entity;
    this.logger.log(`Subscription completed: ${subscription.id}`);

    // Update subscription status
    await this.prisma.subscription.updateMany({
      where: { razorpay_subscription_id: subscription.id },
      data: { status: 'completed' },
    });
  }

  private async handlePaymentDispute(payload: any) {
    const dispute = payload.payment.entity;
    this.logger.warn(`Payment dispute created: ${dispute.id}`);

    // Notify admin about dispute
    // You can implement admin notification logic here
  }

  private async updateSubscriptionStatus(userId: string, status: string) {
    await this.prisma.subscription.updateMany({
      where: { userId, status: { not: 'cancelled' } },
      data: { status },
    });
  }
}
