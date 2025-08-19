import { Injectable } from '@nestjs/common';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class RazorpayService {
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }

  async createOrder(options: {
    amount: number;
    currency: string;
    receipt?: string;
    notes?: any;
    payment_capture?: boolean;
  }) {
    if (typeof options.amount !== 'number' || options.amount <= 0) {
      throw new Error('A valid amount is required to create an order.');
    }

    const orderOptions = {
      ...options,
      amount: Math.round(options.amount * 100), // amount in smallest currency unit (e.g., paise, cents)
      payment_capture: options.payment_capture !== undefined ? options.payment_capture : true,
    };

    return await this.razorpay.orders.create(orderOptions);
  }

  // TODO: Use proper types from razorpay library once import issues are resolved
  async createSubscription(params: any) {
    return await this.razorpay.subscriptions.create(params);
  }

  async cancelSubscription(subscriptionId: string, cancelAtCycleEnd: boolean = true) {
    return await this.razorpay.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
  }

  async getPaymentDetails(paymentId: string) {
    return await this.razorpay.payments.fetch(paymentId);
  }

  verifyPaymentSignature(data: {
    order_id: string;
    payment_id: string;
    razorpay_signature: string;
  }): boolean {
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
