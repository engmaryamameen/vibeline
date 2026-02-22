import assert from 'node:assert/strict';
import test from 'node:test';

import bcrypt from 'bcryptjs';

import type { StoredUser } from '../src/modules/user/user.mapper.ts';

const ensureServerEnv = () => {
  process.env.NODE_ENV ??= 'test';
  process.env.PORT ??= '5001';
  process.env.API_PREFIX ??= '/v1';
  process.env.JWT_SECRET ??= 'test-secret-key-that-is-at-least-32chars';
  process.env.JWT_EXPIRES_IN ??= '15m';
  process.env.REFRESH_TOKEN_EXPIRES_IN ??= '7d';
  process.env.DATABASE_URL ??= 'https://example.com/postgres';
  process.env.CORS_ORIGIN ??= 'http://localhost:3002';
  process.env.SMTP_HOST ??= 'smtp.example.com';
  process.env.SMTP_PORT ??= '587';
  process.env.SMTP_USER ??= 'noreply@example.com';
  process.env.SMTP_PASS ??= 'password';
  process.env.SMTP_SECURE ??= 'false';
  process.env.INVITE_FROM_EMAIL ??= 'noreply@example.com';
  process.env.APP_URL ??= 'http://localhost:3002';
};

const buildStoredUser = (overrides: Partial<StoredUser> = {}): StoredUser => ({
  id: 'u_auth',
  email: 'user@example.com',
  displayName: 'Auth User',
  avatarUrl: null,
  role: 'user',
  emailVerified: true,
  passwordHash: '$2b$12$hash',
  verificationToken: 'verification-token',
  verificationCode: '123456',
  verificationTokenExpiresAt: '2099-01-01T00:00:00.000Z',
  passwordResetToken: 'reset-token',
  passwordResetCode: '654321',
  passwordResetTokenExpiresAt: '2099-01-01T00:00:00.000Z',
  createdAt: '2026-02-22T10:00:00.000Z',
  ...overrides
});

const loadAuthModules = async () => {
  ensureServerEnv();
  const [{ authService }, { AppError }, { userRepository }] = await Promise.all([
    import('../src/modules/auth/auth.service.ts'),
    import('../src/common/errors/app-error.ts'),
    import('../src/repositories/user.repository.ts')
  ]);

  return { authService, AppError, userRepository };
};

test('shouldThrowInvalidCredentialsWhenPasswordLoginAttemptedForOAuthOnlyAccount', async () => {
  const { authService, AppError, userRepository } = await loadAuthModules();
  const originalFindByEmail = userRepository.findByEmail;
  userRepository.findByEmail = async () => buildStoredUser({ passwordHash: '' });

  try {
    await assert.rejects(
      () => authService.login({ email: 'user@example.com', password: 'password123' }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 401);
        assert.equal(error.code, 'INVALID_CREDENTIALS');
        return true;
      }
    );
  } finally {
    userRepository.findByEmail = originalFindByEmail;
  }
});

test('shouldThrowEmailNotVerifiedWhenCredentialsAreValidButEmailIsUnverified', async () => {
  const { authService, AppError, userRepository } = await loadAuthModules();
  const originalFindByEmail = userRepository.findByEmail;
  const passwordHash = await bcrypt.hash('password123', 12);

  userRepository.findByEmail = async () =>
    buildStoredUser({ emailVerified: false, passwordHash, verificationToken: undefined });

  try {
    await assert.rejects(
      () => authService.login({ email: 'user@example.com', password: 'password123' }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 403);
        assert.equal(error.code, 'EMAIL_NOT_VERIFIED');
        return true;
      }
    );
  } finally {
    userRepository.findByEmail = originalFindByEmail;
  }
});

test('shouldThrowInvalidRefreshTokenWhenRefreshTokenIsMissing', async () => {
  const { authService, AppError } = await loadAuthModules();

  await assert.rejects(() => authService.refreshSession(''), (error: unknown) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.statusCode, 401);
    assert.equal(error.code, 'INVALID_REFRESH_TOKEN');
    return true;
  });
});

test('shouldThrowInvalidTokenWhenVerificationProofDoesNotMatchAnyUser', async () => {
  const { authService, AppError, userRepository } = await loadAuthModules();
  const originalFindByVerificationToken = userRepository.findByVerificationToken;
  userRepository.findByVerificationToken = async () => null;

  try {
    await assert.rejects(
      () => authService.verifyEmail({ token: 'missing-token' }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 400);
        assert.equal(error.code, 'INVALID_TOKEN');
        return true;
      }
    );
  } finally {
    userRepository.findByVerificationToken = originalFindByVerificationToken;
  }
});

test('shouldReturnGenericSuccessWhenResendVerificationEmailUserDoesNotExist', async () => {
  const { authService, userRepository } = await loadAuthModules();
  const originalFindByEmail = userRepository.findByEmail;
  userRepository.findByEmail = async () => null;

  try {
    const result = await authService.resendVerificationEmail('missing@example.com');
    assert.deepEqual(result, {
      message: 'If this email exists, a verification link will be sent.'
    });
  } finally {
    userRepository.findByEmail = originalFindByEmail;
  }
});

test('shouldReturnGenericSuccessWhenForgotPasswordUserDoesNotExist', async () => {
  const { authService, userRepository } = await loadAuthModules();
  const originalFindByEmail = userRepository.findByEmail;
  userRepository.findByEmail = async () => null;

  try {
    const result = await authService.forgotPassword({ email: 'missing@example.com' });
    assert.deepEqual(result, {
      message: 'If an account with that email exists, a password reset link will be sent.'
    });
  } finally {
    userRepository.findByEmail = originalFindByEmail;
  }
});
