import { z } from 'zod';

// Schema for the user who modified a workflow version
const ModifiedBySchema = z.object({
  name: z.string(),
  initials: z.string(),
});

// Schema for a single workflow version in the history
export const WorkflowVersionSchema = z.object({
  id: z.string(),
  versionNumber: z.string(),
  dateTime: z.string(), // Kept as string for flexible date parsing on the frontend
  modifiedBy: ModifiedBySchema,
  changeSummary: z.string(),
  type: z.string(),
  status: z.string(), // e.g., 'current', 'archived'
});

// Schema for an array of workflow versions
export const WorkflowVersionsSchema = z.array(WorkflowVersionSchema);

// Schema for the main workflow details
export const WorkflowDetailsSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  lastModified: z.string(),
  totalVersions: z.number(),
  hubspotUrl: z.string().url().optional().or(z.literal(''))
});

// Infer TypeScript types from the Zod schemas
export type WorkflowVersion = z.infer<typeof WorkflowVersionSchema>;
export type WorkflowDetails = z.infer<typeof WorkflowDetailsSchema>;
