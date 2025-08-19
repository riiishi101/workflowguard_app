import { z } from 'zod';

export const SubscriptionSchema = z.object({
  id: z.string(),
  planName: z.string(),
  price: z.number(),
  status: z.enum(['active', 'cancelled', 'trialing']),
  nextBillingDate: z.string(),
  email: z.string().email().optional().nullable(),
  paymentMethod: z.object({
    brand: z.string(),
    last4: z.string(),
    exp: z.string(),
  }).optional().nullable(),
});

export const UsageStatsSchema = z.object({
  workflows: z.object({
    used: z.number(),
    limit: z.number(),
  }),
  versionHistory: z.object({
    used: z.number(),
    limit: z.number(),
  }),
});

export const BillingHistoryItemSchema = z.object({
  id: z.string(),
  date: z.string(),
  amount: z.string(),
  status: z.enum(['Paid', 'Failed']),
  invoice: z.string().optional().nullable(),
});

export const BillingHistorySchema = z.array(BillingHistoryItemSchema);
