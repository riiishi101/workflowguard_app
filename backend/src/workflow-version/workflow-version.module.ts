import { Module, forwardRef } from '@nestjs/common';
import { WorkflowVersionService } from './workflow-version.service';
import { WorkflowVersionController } from './workflow-version.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { WorkflowModule } from '../workflow/workflow.module';

@Module({
    imports: [PrismaModule, UserModule, forwardRef(() => WorkflowModule)],
  controllers: [WorkflowVersionController],
  providers: [WorkflowVersionService],
  exports: [WorkflowVersionService],
})
export class WorkflowVersionModule {}
