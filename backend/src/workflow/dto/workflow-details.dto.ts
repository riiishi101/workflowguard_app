import { Workflow, User, WorkflowVersion } from '@prisma/client';

export interface WorkflowDetails extends Workflow {
  owner: User;
  versions: WorkflowVersion[];
  lastModified: Date;
  totalVersions: number;
  hubspotUrl?: string | null;
}
