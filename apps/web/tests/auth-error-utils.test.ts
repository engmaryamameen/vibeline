import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError } from '../src/lib/api-client';
import { getApiErrorCode, getErrorMessage } from '../src/features/auth/error-utils';

test('shouldReturnApiErrorCodeWhenErrorIsApiError', () => {
  const error = new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');

  const code = getApiErrorCode(error);

  assert.equal(code, 'UNAUTHORIZED');
});

test('shouldReturnNullApiErrorCodeWhenErrorIsNotApiError', () => {
  const code = getApiErrorCode(new Error('boom'));

  assert.equal(code, null);
});

test('shouldReturnApiErrorMessageWhenErrorIsApiError', () => {
  const message = getErrorMessage(
    new ApiError(400, 'Validation failed', 'VALIDATION_ERROR'),
    'Fallback message'
  );

  assert.equal(message, 'Validation failed');
});

test('shouldReturnGenericErrorMessageWhenErrorIsErrorInstance', () => {
  const message = getErrorMessage(new Error('Something broke'), 'Fallback message');

  assert.equal(message, 'Something broke');
});

test('shouldReturnFallbackMessageWhenErrorIsUnknown', () => {
  const message = getErrorMessage({ not: 'an-error' }, 'Fallback message');

  assert.equal(message, 'Fallback message');
});
