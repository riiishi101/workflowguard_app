import { ChangeSummaryDto } from './change-summary.dto';

export interface ReportPeriodDto {
  startDate: Date;
  endDate: Date;
}

export interface ReportSummaryDto {
  totalVersions: number;
  totalChanges: number;
  automatedBackups: number;
  manualSaves: number;
  systemBackups: number;
  uniqueUsers: number;
  complianceScore: number;
}

export interface ReportVersionDto {
  id: string;
  versionNumber: number;
  snapshotType: string;
  createdBy: string;
  createdAt: Date;
  changes: ChangeSummaryDto;
}

export interface ReportAuditTrailDto {
  id: string;
  action: string;
  userId: string | null;
  userName: string;
  timestamp: Date;
  oldValue: any;
  newValue: any;
}

export interface ComplianceReportDto {
  workflowId: string;
  workflowName: string;
  reportPeriod: ReportPeriodDto;
  summary: ReportSummaryDto;
  versions: ReportVersionDto[];
  auditTrail: ReportAuditTrailDto[];
  recommendations: string[];
}
