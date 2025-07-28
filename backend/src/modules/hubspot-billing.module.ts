import { Module } from '@nestjs/common';
import { HubSpotBillingService } from '../services/hubspot-billing.service';
import { HubSpotBillingController } from '../controllers/hubspot-billing.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [HubSpotBillingController],
  providers: [HubSpotBillingService],
  exports: [HubSpotBillingService],
})
export class HubSpotBillingModule {}
