import { z } from 'zod';

const profileDateOfBirthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must use YYYY-MM-DD')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, 'Enter a valid date of birth')
  .refine((value) => value <= new Date().toISOString().slice(0, 10), 'Date of birth cannot be in the future');

export const userSearchQuerySchema = z.object({
  q: z.string().trim().max(100).default('')
});

export const userSearchResultSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string(),
  avatarUrl: z.string().nullish().transform((value) => value ?? undefined),
  lastSeenAt: z.coerce.date().transform((value) => value.toISOString()).or(z.string()).nullish().transform((value) => value ?? undefined),
  connectionStatus: z.enum(['none', 'incoming', 'outgoing', 'connected']).default('none')
});
export type UserSearchResult = z.infer<typeof userSearchResultSchema>;
export const userSearchResponseSchema = z.object({ users: z.array(userSearchResultSchema) });
export type UserSearchResponse = z.infer<typeof userSearchResponseSchema>;

export const updateProfileRequestSchema = z
  .object({
    firstName: z.string().trim().min(1).max(48).optional(),
    lastName: z.string().trim().min(1).max(48).optional(),
    dateOfBirth: profileDateOfBirthSchema.optional(),
    phoneNumber: z
      .string()
      .trim()
      .regex(/^\+[1-9]\d{7,14}$/, 'Phone number must use international format, for example +923001234567')
      .nullable()
      .optional()
  })
  .refine((payload) => Object.values(payload).some((value) => value !== undefined), {
    message: 'At least one profile field is required'
  });
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;

export const connectionRequestSchema = z.object({
  id: z.string().uuid(),
  user: userSearchResultSchema,
  createdAt: z.coerce.date().transform((value) => value.toISOString()).or(z.string())
});
export type ConnectionRequest = z.infer<typeof connectionRequestSchema>;
export const connectionRequestsResponseSchema = z.object({ requests: z.array(connectionRequestSchema) });
export const connectionRequestResponseSchema = z.object({ request: connectionRequestSchema.optional() });
export const connectionUserParamsSchema = z.object({ userId: z.string().uuid() });
export const connectionRequestParamsSchema = z.object({ requestId: z.string().uuid() });
