import { Module } from '@nestjs/common';
import { ActionsController } from './actions.controller';
import { ActionsService } from './actions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { HubSpotService } from '../services/hubspot.service';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [PrismaModule, AuditLogModule],
  controllers: [ActionsController],
  providers: [ActionsService, HubSpotService],
})
export class ActionsModule {}
