import { ChangeSummaryDto } from './change-summary.dto';

export interface HubspotWorkflowHistoryDto {
  id: string;
  versionNumber: number;
  snapshotType: string;
  createdBy: string;
  createdAt: Date;
  data: any;
  workflowId: string;
  changes: ChangeSummaryDto;
  changeSummary: string;
}
