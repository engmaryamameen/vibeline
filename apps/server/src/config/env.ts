import { z } from 'zod';

const optionalNonEmpty = z.preprocess(value => value === '' ? undefined : value, z.string().min(1).optional());
const optionalUrl = z.preprocess(value => value === '' ? undefined : value, z.string().url().optional());
const booleanFromString = z.preprocess(value => typeof value === 'string' ? value === 'true' : value, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5001),
  API_PREFIX: z.string().startsWith('/').default('/v1'),
  JWT_SECRET: z.string().min(32),
  AUTH_CREDENTIAL_SECRET: z.string().min(32),
  OAUTH_STATE_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  DATABASE_URL: z.string().url(),
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:3002'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  TRUST_PROXY: booleanFromString.default(false),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
  DB_POOL_IDLE_TIMEOUT_MS: z.coerce.number().int().min(1000).default(30_000),
  DB_POOL_CONNECTION_TIMEOUT_MS: z.coerce.number().int().min(100).default(5_000),

  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_USER: z.string().email(),
  SMTP_PASS: z.string().min(1),
  SMTP_SECURE: booleanFromString.default(false),
  INVITE_FROM_EMAIL: z.string().email(),

  GOOGLE_CLIENT_ID: optionalNonEmpty,
  GOOGLE_CLIENT_SECRET: optionalNonEmpty,
  GOOGLE_CALLBACK_URL: optionalUrl,
  GITHUB_CLIENT_ID: optionalNonEmpty,
  GITHUB_CLIENT_SECRET: optionalNonEmpty,
  GITHUB_CALLBACK_URL: optionalUrl,
  OPENAI_API_KEY: optionalNonEmpty,
  OPENAI_MODEL: optionalNonEmpty,
  OPENAI_RESPONSES_URL: optionalUrl
}).superRefine((value, ctx) => {
  const validateProvider = (name: 'GOOGLE' | 'GITHUB') => {
    const fields = [`${name}_CLIENT_ID`, `${name}_CLIENT_SECRET`, `${name}_CALLBACK_URL`] as const;
    const configured = fields.filter(field => Boolean(value[field]));
    if (configured.length > 0 && configured.length < fields.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [configured.length ? configured[0] : fields[0]], message: `${name} OAuth must provide client ID, client secret, and callback URL together` });
    }
  };
  validateProvider('GOOGLE');
  validateProvider('GITHUB');
  const modelFields = ['OPENAI_API_KEY','OPENAI_MODEL','OPENAI_RESPONSES_URL'] as const;
  const modelConfigured = modelFields.filter(field => Boolean(value[field]));
  if (modelConfigured.length > 0 && modelConfigured.length < modelFields.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [modelConfigured[0] ?? 'OPENAI_API_KEY'], message: 'OpenAI provider must provide API key, model name, and Responses URL together' });

  if (value.NODE_ENV === 'production') {
    const appUrl = new URL(value.APP_URL);
    if (appUrl.protocol !== 'https:') ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['APP_URL'], message: 'APP_URL must use HTTPS in production' });
    const origins = value.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean);
    if (!origins.length || origins.some(origin => { try { return new URL(origin).protocol !== 'https:'; } catch { return true; } })) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['CORS_ORIGIN'], message: 'CORS_ORIGIN must contain valid HTTPS origins in production' });
    }
  }
});

export type Env = z.infer<typeof envSchema>;
export const env = envSchema.parse(process.env);
