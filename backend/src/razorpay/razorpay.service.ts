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
  async createOrder(
    amount: number,
    currency: string = 'INR',
    receipt?: string,
    notes?: any,
  ) {
    return await this.razorpay.orders.create({
      amount: amount * 100, // in paise
      currency,
      payment_capture: true,
      receipt,
      notes, // Custom metadata (userId, planId etc.)
    });
  }

  // TODO: Use proper types from razorpay library once import issues are resolved
  async createSubscription(params: any) {
    return await this.razorpay.subscriptions.create(params);
  }

  // Razorpay signature verification for webhook (expects raw body as Buffer)
  verifySignature(rawBody: Buffer, signature: string) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBody);
    const digest = hmac.digest('hex');
    return digest === signature;
  }
}
