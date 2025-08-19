import { z } from 'zod';

// Schema for the last modified user information
const LastModifiedBySchema = z.object({
  name: z.string().nullable(),
  initials: z.string().nullable(),
  email: z.string().email().nullable(),
});

// Schema for a single workflow item on the dashboard
export const DashboardWorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  versions: z.number(),
  lastModifiedBy: LastModifiedBySchema,
  status: z.enum(['active', 'inactive', 'error']),
  protectionStatus: z.enum(['protected', 'unprotected', 'error']),
  lastModified: z.string().datetime(),
});

// Schema for the array of workflows
export const WorkflowsSchema = z.array(DashboardWorkflowSchema);

// Schema for the aggregated dashboard statistics
export const DashboardStatsSchema = z.object({
  totalWorkflows: z.number(),
  activeWorkflows: z.number(),
  protectedWorkflows: z.number(),
  totalVersions: z.number(),
  uptime: z.number(),
  lastSnapshot: z.string().datetime(),
  planCapacity: z.number(),
  planUsed: z.number(),
});

// Infer TypeScript types from schemas
export type DashboardWorkflow = z.infer<typeof DashboardWorkflowSchema>;
export type DashboardStats = z.infer<typeof DashboardStatsSchema>;
