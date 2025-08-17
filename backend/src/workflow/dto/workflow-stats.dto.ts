export interface WorkflowStatsDto {
  id: string;
  name: string;
  lastSnapshot: string;
  versions: number;
  lastModifiedBy: string;
  status: 'active' | 'inactive';
  protectionStatus: 'protected' | 'unprotected';
  lastModified: string;
  steps: number;
  contacts: number;
}
