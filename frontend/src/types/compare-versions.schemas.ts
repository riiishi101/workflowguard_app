import { z } from 'zod';

// Schema for an individual step in a workflow version
const WorkflowStepSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  type: z.string(),
  isNew: z.boolean().optional(),
  isModified: z.boolean().optional(),
  isRemoved: z.boolean().optional(),
});

// Schema for a complete workflow version's data
const WorkflowVersionSchema = z.object({
  id: z.string(),
  versionNumber: z.number(),
  date: z.string(),
  initiator: z.string(),
  notes: z.string().nullable(),
  steps: z.array(WorkflowStepSchema),
});

// Schema for the list of historical versions for selection
export const WorkflowHistoryVersionSchema = z.object({
  id: z.string(),
  date: z.string(),
  type: z.string(),
  initiator: z.string(),
  notes: z.string().nullable(),
  workflowId: z.string(),
  versionNumber: z.number(),
  changes: z.any().nullable(),
  status: z.string(),
});
export const WorkflowHistoryVersionsSchema = z.array(WorkflowHistoryVersionSchema);


// Schema for the basic details of the workflow being compared
export const WorkflowDetailsSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  lastModified: z.string(),
  totalVersions: z.number(),
});

// Schema for the differences object
const DifferencesSchema = z.object({
  added: z.array(z.any()),
  modified: z.array(z.any()),
  removed: z.array(z.any()),
});

// Schema for the entire comparison data object from the API
export const ComparisonDataSchema = z.object({
  versionA: WorkflowVersionSchema.nullable(),
  versionB: WorkflowVersionSchema.nullable(),
  differences: DifferencesSchema,
});

// Inferred types
export type WorkflowDetails = z.infer<typeof WorkflowDetailsSchema>;
export type WorkflowHistoryVersion = z.infer<typeof WorkflowHistoryVersionSchema>;
export type ComparisonData = z.infer<typeof ComparisonDataSchema>;
export type WorkflowVersion = z.infer<typeof WorkflowVersionSchema>;
export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;
