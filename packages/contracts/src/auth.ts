import { z } from 'zod';

export const roleSchema = z.enum(['user', 'admin']);
export type Role = z.infer<typeof roleSchema>;

const dateOfBirthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must use YYYY-MM-DD')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, 'Enter a valid date of birth')
  .refine((value) => value <= new Date().toISOString().slice(0, 10), 'Date of birth cannot be in the future');

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: dateOfBirthSchema.optional(),
  phoneNumber: z.string().nullable().optional(),
  avatarUrl: z.string().optional(),
  role: roleSchema,
  emailVerified: z.boolean(),
  createdAt: z.string()
});
export type User = z.infer<typeof userSchema>;

export const registerRequestSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(48),
  lastName: z.string().trim().min(1, 'Last name is required').max(48),
  dateOfBirth: dateOfBirthSchema,
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72)
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const loginRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72)
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const verifyEmailRequestSchema = z
  .object({
    token: z.string().min(1).optional(),
    code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits').optional()
  })
  .refine((data) => data.token ?? data.code, { message: 'Either token or code is required' });
export type VerifyEmailRequest = z.infer<typeof verifyEmailRequestSchema>;

export const resendVerificationRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email()
});

export const forgotPasswordRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email()
});
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;

export const resetPasswordRequestSchema = z
  .object({
    token: z.string().min(1).optional(),
    code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits').optional(),
    password: z.string().min(8).max(72)
  })
  .refine((data) => data.token ?? data.code, { message: 'Either token or code is required' });
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;

export const refreshRequestSchema = z.object({ refreshToken: z.string().min(1).optional() });

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(8).max(72),
  newPassword: z.string().min(8).max(72)
});
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;

export const addPasswordRequestSchema = z.object({
  password: z.string().min(8).max(128)
});
export type AddPasswordRequest = z.infer<typeof addPasswordRequestSchema>;

export const authSessionResponseSchema = z.object({
  user: userSchema,
  tokens: z.object({ accessToken: z.string().min(1) }),
  message: z.string().optional()
});
export type AuthSessionResponse = z.infer<typeof authSessionResponseSchema>;
