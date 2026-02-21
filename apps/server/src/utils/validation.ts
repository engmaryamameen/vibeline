import { ZodError, type ZodTypeAny } from 'zod';

import { AppError } from '@/common/errors/app-error';

export const validate = <TSchema extends ZodTypeAny>(schema: TSchema, value: unknown) => {
  try {
    return schema.parse(value);
  } catch (error) {
    if (error instanceof ZodError) {
      const issue = error.issues[0];
      throw new AppError(400, 'VALIDATION_ERROR', issue?.message ?? 'Invalid request payload');
    }

    throw error;
  }
};
