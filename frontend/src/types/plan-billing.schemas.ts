import { z } from 'zod';

const WorkflowUsageSchema = z.object({
  used: z.number(),
  limit: z.number(),
});

export const UsageStatsSchema = z.object({
  workflows: WorkflowUsageSchema,
});

export const SubscriptionSchema = z.object({
  planId: z.string(),
  planName: z.string(),
  price: z.number(),
  status: z.string(),
  usage: z.object({
      workflows: z.number()
  }).optional(),
  limits: z.object({
      workflows: z.number(),
      versionHistory: z.number()
  }).optional(),
});

export const TrialStatusSchema = z.object({
  isTrial: z.boolean(),
  trialDaysRemaining: z.number(),
  trialEndDate: z.string().datetime().nullable(),
});

export type UsageStats = z.infer<typeof UsageStatsSchema>;
export type Subscription = z.infer<typeof SubscriptionSchema>;
export type TrialStatus = z.infer<typeof TrialStatusSchema>;
