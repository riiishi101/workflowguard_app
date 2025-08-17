import { WorkflowVersion } from '@prisma/client';

export interface RollbackWorkflowDto {
  message: string;
  rollbackVersion: WorkflowVersion | null;
}
