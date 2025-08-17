import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestWithUser } from '../types/request.types';
import { RazorpayService } from './razorpay.service';
import { RazorpayPlansService } from './razorpay-plans.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../services/email.service';
import { UserService } from '../user/user.service';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class RazorpayBillingController {
  constructor(
    private readonly razorpayService: RazorpayService,
    private readonly plansService: RazorpayPlansService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly userService: UserService,
  ) {}

  private getUserId(req: RequestWithUser): string {
    const userId = req.user?.sub || req.user?.id || req.user?.userId;
    if (!userId) {
      throw new HttpException('User ID not found in token', HttpStatus.UNAUTHORIZED);
    }
    return userId;
  }

  // GET /billing/plans - Get available subscription plans
  @Get('plans')
  async getPlans(@Query('currency') currency: string = 'USD') {
    try {
      const plans = this.plansService.getAllPlans().map(plan => ({
        ...plan,
        price: this.plansService.getPlanPrice(plan.id, currency),
        currency,
      }));

      return {
        success: true,
        data: plans,
        message: 'Plans retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get plans',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // GET /billing/subscription - Get current subscription
  @Get('subscription')
  async getCurrentSubscription(@Req() req: RequestWithUser) {
    try {
      const userId = this.getUserId(req);
      
      const subscription = await this.prisma.subscription.findFirst({
        where: { userId, status: { in: ['active', 'trialing'] } },
        orderBy: { createdAt: 'desc' },
      });

      if (!subscription) {
        return {
          success: true,
          data: null,
          message: 'No active subscription found',
        };
      }

      const plan = this.plansService.getPlan(subscription.planId);
      
      return {
        success: true,
        data: {
          ...subscription,
          plan,
        },
        message: 'Subscription retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get subscription',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // POST /billing/subscribe - Create new subscription
  @Post('subscribe')
  async createSubscription(
    @Body() body: { planId: string; currency?: string; paymentMethodId?: string },
    @Req() req: RequestWithUser,
  ) {
    try {
      const userId = this.getUserId(req);
      const { planId, currency = 'USD', paymentMethodId } = body;

      // Validate plan
      const plan = this.plansService.getPlan(planId);
      const razorpayPlanId = this.plansService.getRazorpayPlanId(planId, currency);
      const price = this.plansService.getPlanPrice(planId, currency);

      // Check if user already has active subscription
      const existingSubscription = await this.prisma.subscription.findFirst({
        where: { userId, status: { in: ['active', 'trialing'] } },
      });

      if (existingSubscription) {
        throw new HttpException(
          'User already has an active subscription',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Create Razorpay subscription
      const razorpaySubscription = await this.razorpayService.createSubscription({
        plan_id: razorpayPlanId,
        total_count: 12, // 12 months
        customer_notify: 1,
        notes: {
          userId,
          planId,
          currency,
        },
      });

      // Save subscription to database
      const subscription = await this.prisma.subscription.create({
        data: {
          userId,
          planId,
          status: 'created',
          razorpay_subscription_id: razorpaySubscription.id,
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
      });

      // Send confirmation email
      const user = await this.userService.findOne(userId);
      if (user) {
        await this.emailService.sendSubscriptionConfirmationEmail(user, subscription);
      }

      return {
        success: true,
        data: {
          subscription,
          razorpay_subscription_id: razorpaySubscription.id,
          short_url: razorpaySubscription.short_url,
        },
        message: 'Subscription created successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create subscription',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // POST /billing/upgrade - Upgrade subscription plan
  @Post('upgrade')
  async upgradeSubscription(
    @Body() body: { newPlanId: string; currency?: string },
    @Req() req: RequestWithUser,
  ) {
    try {
      const userId = this.getUserId(req);
      const { newPlanId, currency = 'USD' } = body;

      // Get current subscription
      const currentSubscription = await this.prisma.subscription.findFirst({
        where: { userId, status: 'active' },
      });

      if (!currentSubscription) {
        throw new HttpException(
          'No active subscription found',
          HttpStatus.NOT_FOUND,
        );
      }

      // Validate upgrade
      const currentPlan = this.plansService.getPlan(currentSubscription.planId);
      const newPlan = this.plansService.getPlan(newPlanId);

      if (!this.plansService.isUpgrade(currentSubscription.planId, newPlanId)) {
        throw new HttpException(
          'New plan must be an upgrade',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Calculate prorated amount
      const daysRemaining = currentSubscription.nextBillingDate 
        ? Math.ceil((currentSubscription.nextBillingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 30;
      const proratedAmount = this.plansService.calculateProration(
        currentSubscription.planId,
        newPlanId,
        daysRemaining,
      );

      // Create one-time payment for prorated amount
      const order = await this.razorpayService.createOrder(
        proratedAmount,
        currency,
        `upgrade_${userId}_${Date.now()}`,
        { userId, currentPlan: currentSubscription.planId, newPlan: newPlanId },
      );

      return {
        success: true,
        data: {
          order,
          proratedAmount,
          daysRemaining,
          currentPlan,
          newPlan,
        },
        message: 'Upgrade order created successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to upgrade subscription',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // POST /billing/cancel - Cancel subscription
  @Post('cancel')
  async cancelSubscription(
    @Body() body: { immediate?: boolean },
    @Req() req: RequestWithUser,
  ) {
    try {
      const userId = this.getUserId(req);
      const { immediate = false } = body;

      const subscription = await this.prisma.subscription.findFirst({
        where: { userId, status: 'active' },
      });

      if (!subscription) {
        throw new HttpException(
          'No active subscription found',
          HttpStatus.NOT_FOUND,
        );
      }

      // Cancel in Razorpay
      await this.razorpayService.createSubscription({
        // This should be a cancel method, but using createSubscription as placeholder
        // In real implementation, use razorpay.subscriptions.cancel()
      });

      // Update subscription status
      const updatedSubscription = await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: immediate ? 'cancelled' : 'cancel_at_period_end',
        },
      });

      // Send cancellation email
      const user = await this.userService.findOne(userId);
      if (user) {
        await this.emailService.sendSubscriptionCancellationEmail(user, updatedSubscription);
      }

      return {
        success: true,
        data: updatedSubscription,
        message: immediate 
          ? 'Subscription cancelled immediately' 
          : 'Subscription will cancel at period end',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to cancel subscription',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // GET /billing/history - Get billing history
  @Get('history')
  async getBillingHistory(@Req() req: RequestWithUser) {
    try {
      const userId = this.getUserId(req);

      // Mock payment history for now (replace with actual payments table)
      const payments = [
        {
          id: 'pay_1',
          date: new Date().toISOString().split('T')[0],
          amount: 19,
          currency: 'USD',
          status: 'captured',
          description: 'Starter Plan - Monthly',
          razorpay_payment_id: 'pay_mock_123',
        },
      ];

      const formattedPayments = payments;

      return {
        success: true,
        data: formattedPayments,
        message: 'Billing history retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get billing history',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // GET /billing/usage - Get current usage statistics
  @Get('usage')
  async getUsageStats(@Req() req: RequestWithUser) {
    try {
      const userId = this.getUserId(req);

      // Get current subscription
      const subscription = await this.prisma.subscription.findFirst({
        where: { userId, status: 'active' },
      });

      if (!subscription) {
        return {
          success: true,
          data: { workflows: { used: 0, limit: 10 }, versionHistory: { used: 0, limit: 30 } },
          message: 'No active subscription - showing free tier limits',
        };
      }

      const plan = this.plansService.getPlan(subscription.planId);

      // Count actual usage (adjust based on your schema)
      const workflowCount = await this.prisma.workflow.count({
        where: { user: { id: userId } },
      });
      const versionCount = await this.prisma.workflowVersion.count({
        where: { workflow: { user: { id: userId } } },
      });

      const usage = {
        workflows: {
          used: workflowCount,
          limit: plan.limits.workflows === -1 ? 'unlimited' : plan.limits.workflows,
        },
        versionHistory: {
          used: versionCount,
          limit: plan.limits.versionHistory === -1 ? 'unlimited' : plan.limits.versionHistory,
        },
        users: {
          used: 1, // Current user
          limit: plan.limits.users === -1 ? 'unlimited' : plan.limits.users,
        },
      };

      return {
        success: true,
        data: usage,
        message: 'Usage statistics retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get usage statistics',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // POST /billing/payment-method - Update payment method
  @Post('payment-method')
  async updatePaymentMethod(
    @Body() body: { paymentMethodId: string },
    @Req() req: RequestWithUser,
  ) {
    try {
      const userId = this.getUserId(req);
      const { paymentMethodId } = body;

      // Create order for payment method update (₹1 or $0.01)
      const order = await this.razorpayService.createOrder(
        1, // Minimal amount
        'USD',
        `payment_method_${userId}_${Date.now()}`,
        { userId, type: 'payment_method_update' },
      );

      return {
        success: true,
        data: { order },
        message: 'Payment method update order created',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update payment method',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
