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

  // TODO: Use proper types from razorpay library once import issues are resolved
  async createOrder(planId: string, userId: string) {
    const planPrices: Record<string, number> = {
      starter: 19,
      professional: 49,
      enterprise: 99,
    };
    const amount = planPrices[planId];

    if (!amount) {
      throw new Error(`Invalid planId provided: ${planId}`);
    }

    const currency = 'USD'; // Assuming USD for now, can be made dynamic
    return await this.razorpay.orders.create({
      amount: amount * 100, // in cents
      currency,
      payment_capture: true,
      notes: { userId, planId },
    });
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
