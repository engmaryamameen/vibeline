import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5001),
  API_PREFIX: z.string().default('/v1'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  DATABASE_URL: z.string().url(),
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:3002'),

  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().email(),
  SMTP_PASS: z.string(),
  SMTP_SECURE: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  INVITE_FROM_EMAIL: z.string().email(),

  APP_URL: z.string().url().default('http://localhost:3000'),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),

  // GitHub OAuth
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().url().optional()
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
