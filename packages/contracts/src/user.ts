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
  q: z.string().trim().min(2).max(100)
});

export const userSearchResultSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string(),
  avatarUrl: z.string().nullish().transform((value) => value ?? undefined)
});
export type UserSearchResult = z.infer<typeof userSearchResultSchema>;

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
