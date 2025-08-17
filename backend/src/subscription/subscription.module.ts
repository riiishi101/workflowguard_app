import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CurrencyModule } from '../currency/currency.module';
import { RazorpayModule } from '../razorpay/razorpay.module';

@Module({
  imports: [PrismaModule, CurrencyModule, RazorpayModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
