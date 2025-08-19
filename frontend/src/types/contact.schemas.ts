import { z } from 'zod';

export const ContactFormSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required'),
  category: z.enum(['general', 'technical', 'billing', 'feature', 'bug']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

export type ContactFormData = z.infer<typeof ContactFormSchema>;
