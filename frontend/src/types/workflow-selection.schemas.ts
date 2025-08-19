import { z } from 'zod';

// Schema for a single HubSpot workflow
export const HubSpotWorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  folder: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT']),
  lastModified: z.string(), // Can be refined to datetime if format is consistent
  steps: z.number(),
  contacts: z.number(),
  isProtected: z.boolean().optional(),
});

// Schema for an array of HubSpot workflows
export const HubSpotWorkflowsSchema = z.array(HubSpotWorkflowSchema);

// Infer the TypeScript type from the schema
export type HubSpotWorkflow = z.infer<typeof HubSpotWorkflowSchema>;
