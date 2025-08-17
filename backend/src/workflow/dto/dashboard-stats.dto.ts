export interface DashboardStatsDto {
  totalWorkflows: number;
  activeWorkflows: number;
  protectedWorkflows: number;
  totalVersions: number;
  uptime: number | null;
  lastSnapshot: string;
  planCapacity: number;
  planUsed: number;
  recentActivity: number;
  planId: string;
  planStatus: string;
}
