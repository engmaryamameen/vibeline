import assert from 'node:assert/strict';
import test from 'node:test';

import { mapStoredUserToPublicUser, type StoredUser } from '../src/modules/user/user.mapper.ts';

test('shouldReturnPublicUserWithoutSensitiveFieldsWhenMappingStoredUser', () => {
  const storedUser: StoredUser = {
    id: 'u_123',
    email: 'user@example.com',
    displayName: 'Test User',
    avatarUrl: null,
    role: 'user',
    emailVerified: true,
    passwordHash: '$2b$12$examplehash',
    verificationToken: 'token',
    verificationCode: '123456',
    verificationTokenExpiresAt: '2026-02-22T12:00:00.000Z',
    passwordResetToken: 'reset-token',
    passwordResetCode: '654321',
    passwordResetTokenExpiresAt: '2026-02-22T13:00:00.000Z',
    createdAt: new Date('2026-02-22T10:00:00.000Z')
  };

  const result = mapStoredUserToPublicUser(storedUser);

  assert.deepEqual(result, {
    id: 'u_123',
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
});
