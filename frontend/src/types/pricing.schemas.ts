import { z } from 'zod';

export const BillingPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  interval: z.enum(['month', 'year']),
  features: z.array(z.string()),
});

export const BillingPlanListSchema = z.array(BillingPlanSchema);

export type BillingPlan = z.infer<typeof BillingPlanSchema>;
