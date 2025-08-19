import { z } from 'zod';

// Schema for the last modified by user
const LastModifiedBySchema = z.object({
  name: z.string(),
  initials: z.string(),
  email: z.string().email(),
});

// Schema for a single protected workflow
export const ProtectedWorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  protectionStatus: z.string(),
  lastModified: z.string(), // or z.date()
  versions: z.number(),
  lastModifiedBy: LastModifiedBySchema,
});

// Schema for an array of protected workflows
export const ProtectedWorkflowsSchema = z.array(ProtectedWorkflowSchema);

// Schema for a single version history item
export const VersionHistoryItemSchema = z.object({
  id: z.string(),
  version: z.string(),
  dateTime: z.string(), // or z.date()
  lastModifiedBy: z.string(),
  changeSummary: z.string(),
  changeType: z.string(),
  isCurrent: z.boolean(),
});

// Schema for an array of version history items
export const VersionHistorySchema = z.array(VersionHistoryItemSchema);

// Infer TypeScript types from schemas
export type ProtectedWorkflow = z.infer<typeof ProtectedWorkflowSchema>;
export type VersionHistoryItem = z.infer<typeof VersionHistoryItemSchema>;
