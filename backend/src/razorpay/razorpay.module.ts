import { Module } from '@nestjs/common';
import { RazorpayController } from './razorpay.controller';
import { RazorpayWebhookController } from './razorpay-webhook.controller';
import { RazorpayBillingController } from './razorpay-billing.controller';
import { RazorpayService } from './razorpay.service';
import { RazorpayPlansService } from './razorpay-plans.service';

import { UserModule } from '../user/user.module';
import { EmailModule } from '../email/email.module';
import { CurrencyModule } from '../currency/currency.module';

@Module({
  imports: [EmailModule, UserModule, CurrencyModule],
  controllers: [RazorpayController, RazorpayWebhookController, RazorpayBillingController],
  providers: [RazorpayService, RazorpayPlansService],
  exports: [RazorpayService, RazorpayPlansService],
})
export class RazorpayModule {}
