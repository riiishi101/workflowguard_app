import { z } from 'zod';

export const UserProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  jobTitle: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  emailVerified: z.boolean().optional(),
});

export const UpdateUserProfileSchema = UserProfileSchema.pick({
  name: true,
  email: true,
  jobTitle: true,
  timezone: true,
  language: true,
});

export const AvatarUploadResponseSchema = z.object({
  avatarUrl: z.string().url(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UpdateUserProfilePayload = z.infer<typeof UpdateUserProfileSchema>;
