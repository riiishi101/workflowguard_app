import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { WorkflowModule } from '../workflow/workflow.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [WorkflowModule, SubscriptionModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
