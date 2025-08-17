import { ChangeSummaryDto } from './change-summary.dto';

export interface WorkflowVersionHistoryDto {
  id: string;
  workflowId: string;
  versionNumber: number;
  date: string;
  type: string;
  initiator: string;
  notes: string;
  changes: ChangeSummaryDto;
  status: 'active' | 'inactive';
  selected: boolean;
}
