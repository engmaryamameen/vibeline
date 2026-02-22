import assert from 'node:assert/strict';
import test from 'node:test';

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

const loadUserModules = async () => {
  ensureServerEnv();
  const [{ userService }, { userRepository }, { AppError }] = await Promise.all([
    import('../src/modules/user/user.service.ts'),
    import('../src/repositories/user.repository.ts'),
    import('../src/common/errors/app-error.ts')
  ]);

  return { userService, userRepository, AppError };
};

const buildStoredUser = (overrides: Partial<StoredUser> = {}): StoredUser => ({
  id: 'u_test',
  email: 'user@example.com',
  displayName: 'Test User',
  avatarUrl: null,
  role: 'user',
  emailVerified: true,
  passwordHash: '$2b$12$hash',
  verificationToken: 'verification-token',
  verificationCode: '123456',
  verificationTokenExpiresAt: '2026-02-22T12:00:00.000Z',
  passwordResetToken: 'reset-token',
  passwordResetCode: '654321',
  passwordResetTokenExpiresAt: '2026-02-22T13:00:00.000Z',
  createdAt: '2026-02-22T10:00:00.000Z',
  ...overrides
});

test('shouldReturnSanitizedPublicUserWhenProfileExists', async () => {
  const { userService, userRepository } = await loadUserModules();
  const originalFindById = userRepository.findById;
  userRepository.findById = async () => buildStoredUser();

  try {
    const result = await userService.getProfile('u_test');

    assert.deepEqual(result, {
      id: 'u_test',
      email: 'user@example.com',
      displayName: 'Test User',
      avatarUrl: undefined,
      role: 'user',
      emailVerified: true,
      createdAt: '2026-02-22T10:00:00.000Z'
    });
    assert.equal('passwordHash' in result, false);
    assert.equal('verificationToken' in result, false);
    assert.equal('passwordResetToken' in result, false);
  } finally {
    userRepository.findById = originalFindById;
  }
});

test('shouldThrowUserNotFoundWhenProfileDoesNotExist', async () => {
  const { userService, userRepository, AppError } = await loadUserModules();
  const originalFindById = userRepository.findById;
  userRepository.findById = async () => null;

  try {
    await assert.rejects(() => userService.getProfile('missing'), (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 404);
      assert.equal(error.code, 'USER_NOT_FOUND');
      return true;
    });
  } finally {
    userRepository.findById = originalFindById;
  }
});
