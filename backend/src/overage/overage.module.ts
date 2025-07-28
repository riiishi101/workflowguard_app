import { Module } from '@nestjs/common';
import { OverageService } from './overage.service';
import { OverageController } from './overage.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { HubSpotBillingService } from '../services/hubspot-billing.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [OverageController],
  providers: [OverageService, HubSpotBillingService],
  exports: [OverageService],
})
export class OverageModule {}
