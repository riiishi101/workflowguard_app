import { Workflow, User, WorkflowVersion } from '@prisma/client';

export interface ProtectedWorkflowDto extends Workflow {
  owner: User;
  versions: WorkflowVersion[];
}
