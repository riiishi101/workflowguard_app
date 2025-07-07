import { Module } from '@nestjs/common';
import { WorkflowVersionService } from './workflow-version.service';
import { WorkflowVersionController } from './workflow-version.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [PrismaModule, UserModule, AuditLogModule],
  controllers: [WorkflowVersionController],
  providers: [WorkflowVersionService],
  exports: [WorkflowVersionService],
})
export class WorkflowVersionModule {}
