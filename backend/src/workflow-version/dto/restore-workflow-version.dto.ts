import { WorkflowVersion } from '@prisma/client';

export interface RestoreWorkflowVersionDto {
  message: string;
  restoredVersion: WorkflowVersion;
}
