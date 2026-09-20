import { z } from 'zod';

export const registerSchema = z.object({
  displayName: z.string().min(2).max(48),
  email: z.string().email(),
  password: z.string().min(8).max(72)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72)
});

export const verifyEmailSchema = z
  .object({
    token: z.string().min(1).optional(),
    code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits').optional()
  })
  .refine((data) => data.token ?? data.code, { message: 'Either token or code is required' });

export const resendVerificationSchema = z.object({
  email: z.string().email()
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1).optional(),
    code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits').optional(),
    password: z.string().min(8).max(72)
  })
  .refine((data) => data.token ?? data.code, { message: 'Either token or code is required' });

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1).optional()
});
