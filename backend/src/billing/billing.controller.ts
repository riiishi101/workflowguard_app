import { Controller, Get, Post, Query, Body, Inject } from '@nestjs/common';
import Razorpay from 'razorpay';
import { PrismaService } from '../prisma/prisma.service';

@Controller('billing')
export class BillingController {
  private razorpay: Razorpay;
  constructor(
    private readonly prisma: PrismaService,
  ) {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }

  // GET /billing/history?userId=xxx
  @Get('history')
  async getBillingHistory(@Query('userId') userId: string) {
    // In production, you should verify the user is authenticated and allowed to access this data
    // Fetch all payments made by the user from Razorpay
    // If you log to DB via webhooks, prefer DB lookup to reduce API calls
    const payments = await this.razorpay.payments.all({ count: 100 }); // Add filters if desired
    // Filter by user if storing mapping in payment.notes
    const userPayments = payments.items.filter(
      (p: any) => p.notes && p.notes.userId === userId
    );
    return userPayments.map((p: any) => ({
      id: p.id,
      date: new Date(p.created_at * 1000).toISOString().slice(0, 10),
      amount: p.amount / 100.0,
      status: p.status === 'captured' ? 'Paid' : 'Failed',
      invoice: p.invoice_id,
    }));
  }

  // POST /billing/cancel
  @Post('cancel')
  async cancelSubscription(@Body('userId') userId: string) {
    // You should authenticate user in production
    // Find user's active Razorpay subscription ID in DB
    // (Assumes you store razorpay_subscription_id in your subscription table)
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, status: 'active' },
    });
    if (!sub || !sub.razorpay_subscription_id) {
      throw new Error('No active Razorpay subscription for user');
    }
    // Cancel at end of period
    await this.razorpay.subscriptions.cancel(sub.razorpay_subscription_id, false);
    // Update DB
    await this.prisma.subscription.updateMany({
      where: { userId, status: 'active' },
      data: { status: 'cancelled' },
    });
    return { success: true, message: 'Subscription cancellation scheduled.' };
  }
}
