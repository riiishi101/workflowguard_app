import { Controller, Get, Post, Query, Body, Inject, UseGuards, Req, HttpException, HttpStatus, Param } from '@nestjs/common';
import Razorpay from 'razorpay';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../services/email.service';
import { UserService } from '../user/user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestWithUser } from '../types/request.types';

@Controller('billing')
export class BillingController {
  private razorpay: Razorpay;
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly userService: UserService,
  ) {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }

  private getUserId(req: RequestWithUser): string {
    const userId = req.user?.sub || req.user?.id || req.user?.userId;
    if (!userId) {
      throw new HttpException('User ID not found in token', HttpStatus.UNAUTHORIZED);
    }
    return userId;
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getBillingHistory(@Req() req: RequestWithUser) {
    try {
      const userId = this.getUserId(req);
      
      // Fetch all payments made by the user from Razorpay
      const payments = await this.razorpay.payments.all({ count: 100 });
      
      // Filter by user if storing mapping in payment.notes
      const userPayments = payments.items.filter(
        (p: any) => p.notes && p.notes.userId === userId,
      );
      
      return {
        success: true,
        data: userPayments.map((p: any) => ({
          id: p.id,
          date: new Date(p.created_at * 1000).toISOString().slice(0, 10),
          amount: (p.amount / 100.0).toFixed(2),
          status: p.status === 'captured' ? 'Paid' : 'Failed',
          invoice: p.invoice_id,
        }))
      };
    } catch (error) {
      console.error('Error fetching billing history:', error);
      throw new HttpException(
        'Failed to fetch billing history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // POST /billing/cancel
  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  async cancelSubscription(@Req() req: RequestWithUser) {
    try {
      const userId = this.getUserId(req);
      
      // Find user's active Razorpay subscription ID in DB
      const sub = await this.prisma.subscription.findFirst({
        where: { userId, status: 'active' },
      });
      
      if (!sub || !sub.razorpay_subscription_id) {
        throw new HttpException('No active Razorpay subscription found', HttpStatus.NOT_FOUND);
      }
      
      // Cancel at end of period
      await this.razorpay.subscriptions.cancel(
        sub.razorpay_subscription_id,
        false,
      );

      // Update DB
      const updatedSubscription = await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'cancelled' },
      });

      // Send cancellation email
      try {
        const user = await this.userService.findOne(userId);
        if (user) {
          await this.emailService.sendSubscriptionCancellationEmail(
            user,
            updatedSubscription,
          );
        }
      } catch (error) {
        console.error(
          `Failed to send cancellation email for user ${userId}`,
          error,
        );
        // Do not block response for email failure
      }

        return { success: true, message: 'Subscription cancellation scheduled.' };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw new HttpException(
        'Failed to cancel subscription',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('history/export')
  @UseGuards(JwtAuthGuard)
  async exportBillingHistory(@Req() req: RequestWithUser) {
    try {
      const userId = this.getUserId(req);
      
      // Fetch all payments made by the user from Razorpay
      const payments = await this.razorpay.payments.all({ count: 100 });
      
      // Filter by user if storing mapping in payment.notes
      const userPayments = payments.items.filter(
        (p: any) => p.notes && p.notes.userId === userId,
      );
      
      // Generate CSV content
      const csvHeader = 'Date,Amount,Status,Invoice ID,Payment ID\n';
      const csvRows = userPayments.map((p: any) => {
        const date = new Date(p.created_at * 1000).toISOString().split('T')[0];
        const amount = (p.amount / 100.0).toFixed(2);
        const status = p.status === 'captured' ? 'Paid' : 'Failed';
        return `${date},${amount},${status},${p.invoice_id || ''},${p.id}`;
      }).join('\n');
      
      const csvContent = csvHeader + csvRows;
      
      return {
        success: true,
        data: csvContent
      };
    } catch (error) {
      console.error('Error exporting billing history:', error);
      throw new HttpException(
        'Failed to export billing history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('invoice/:invoiceId')
  @UseGuards(JwtAuthGuard)
  async getInvoice(@Param('invoiceId') invoiceId: string, @Req() req: RequestWithUser) {
    try {
      const userId = this.getUserId(req);
      
      // Fetch invoice from Razorpay
      const invoice = await this.razorpay.invoices.fetch(invoiceId);
      
      // Verify invoice belongs to user (check customer_id or notes)
      if (invoice.notes && invoice.notes.userId !== userId) {
        throw new HttpException('Invoice not found', HttpStatus.NOT_FOUND);
      }
      
      // Redirect to Razorpay invoice URL
      return {
        success: true,
        data: {
          invoiceUrl: invoice.short_url,
          invoice: {
            id: invoice.id,
            amount: (Number(invoice.amount) || 0) / 100.0,
            status: invoice.status,
            date: invoice.date ? new Date(invoice.date * 1000).toISOString() : new Date().toISOString(),
            description: invoice.description
          }
        }
      };
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw new HttpException(
        'Failed to fetch invoice',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('update-payment-method')
  @UseGuards(JwtAuthGuard)
  async getPaymentMethodUpdateUrl(@Req() req: RequestWithUser) {
    try {
      const userId = this.getUserId(req);
      
      // Find user's active subscription
      const sub = await this.prisma.subscription.findFirst({
        where: { userId, status: 'active' },
      });
      
      if (!sub || !sub.razorpay_subscription_id) {
        throw new HttpException('No active subscription found', HttpStatus.NOT_FOUND);
      }
      
      // For Razorpay, redirect to customer portal or subscription management
      const updateUrl = `https://dashboard.razorpay.com/app/subscriptions/${sub.razorpay_subscription_id}`;
      
      return {
        success: true,
        data: {
          updateUrl: updateUrl
        }
      };
    } catch (error) {
      console.error('Error getting payment method update URL:', error);
      throw new HttpException(
        'Failed to get payment method update URL',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
