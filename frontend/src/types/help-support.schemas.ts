import { z } from 'zod';

export const DiagnoseIssueSchema = z.object({
  issueDescription: z.string().min(10, 'Please provide a more detailed description of your issue (at least 10 characters).'),
});

export type DiagnoseIssueData = z.infer<typeof DiagnoseIssueSchema>;
