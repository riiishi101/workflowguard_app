import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { WorkflowSyncService } from './workflow-sync.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    AuditLogModule,
    ScheduleModule.forRoot()
  ],
  controllers: [WorkflowController],
  providers: [WorkflowService, WorkflowSyncService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
