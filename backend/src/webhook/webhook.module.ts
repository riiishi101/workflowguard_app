import { Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { UserModule } from '../user/user.module';
import { HubspotController } from './hubspot.controller';
import { HubspotService } from './hubspot.service';

@Module({
  imports: [PrismaModule, AuditLogModule, UserModule],
  controllers: [WebhookController, HubspotController],
  providers: [WebhookService, HubspotService],
  exports: [WebhookService, HubspotService],
})
export class WebhookModule {}

