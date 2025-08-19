import { Injectable } from '@nestjs/common';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class RazorpayService {
  private razorpay: Razorpay | null = null;
  private isConfigured: boolean = false;

  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keyId && keySecret) {
      try {
        this.razorpay = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });
        this.isConfigured = true;
        console.log('Razorpay service initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Razorpay:', error);
        this.isConfigured = false;
      }
    } else {
      console.warn('Razorpay credentials not configured - payment features will be disabled');
      this.isConfigured = false;
    }
  }

  private ensureConfigured() {
    if (!this.isConfigured || !this.razorpay) {
      throw new Error('Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
    }
  }

  // TODO: Use proper types from razorpay library once import issues are resolved
  async createOrder(
    amount: number,
    currency: string,
    receipt: string,
    notes: Record<string, any>,
  ) {
    this.ensureConfigured();
    
    if (amount < 1) {
      throw new Error('Amount must be at least 1 (in smallest currency unit)');
    }

    return await this.razorpay!.orders.create({
      amount: Math.round(amount * 100), // amount in smallest currency unit (e.g., cents)
      currency,
      receipt,
      notes,
    });
  }

  // TODO: Use proper types from razorpay library once import issues are resolved
  async createSubscription(params: any) {
    this.ensureConfigured();
    return await this.razorpay!.subscriptions.create(params);
  }

  async cancelSubscription(subscriptionId: string, cancelAtCycleEnd: boolean = true) {
    this.ensureConfigured();
    return await this.razorpay!.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
  }

  async getPaymentDetails(paymentId: string) {
    this.ensureConfigured();
    return await this.razorpay!.payments.fetch(paymentId);
  }

  verifyPaymentSignature(data: {
    order_id: string;
    payment_id: string;
    razorpay_signature: string;
  }): boolean {
    this.ensureConfigured();
    const { order_id, payment_id, razorpay_signature } = data;
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const body = `${order_id}|${payment_id}`;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === razorpay_signature;
  }

  // Razorpay signature verification for webhook (expects raw body as Buffer)
  verifyWebhookSignature(rawBody: Buffer, signature: string) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBody);
    const digest = hmac.digest('hex');
    return digest === signature;
  }
}
