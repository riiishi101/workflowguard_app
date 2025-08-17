import { Module } from '@nestjs/common';
import { WorkflowVersionService } from './workflow-version.service';
import { WorkflowVersionController } from './workflow-version.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';

@Module({
    imports: [PrismaModule, UserModule],
  controllers: [WorkflowVersionController],
  providers: [WorkflowVersionService],
  exports: [WorkflowVersionService],
})
export class WorkflowVersionModule {}
