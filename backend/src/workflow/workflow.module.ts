import { Module } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { HubSpotService } from '../services/hubspot.service';
import { SubscriptionModule } from '../subscription/subscription.module';
import { WorkflowVersionModule } from '../workflow-version/workflow-version.module';

@Module({
    imports: [
    PrismaModule,
    UserModule,
    SubscriptionModule,
    WorkflowVersionModule,
  ],
  controllers: [WorkflowController],
  providers: [WorkflowService, HubSpotService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
