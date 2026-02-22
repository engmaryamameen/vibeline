import { ApiError } from '@/src/lib/api-client';

export const getApiErrorCode = (error: unknown): string | null => {
  if (error instanceof ApiError) {
    return error.code ?? null;
  }

  return null;
};

export const getErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
};
