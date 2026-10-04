'use client';

import {
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent
} from 'react';
import { useRouter } from 'next/navigation';

import { apiClient } from '@/src/lib/api-client';
import {
  hasFieldErrors,
  validateForgotPasswordFields,
  type FieldErrors
} from '@/src/features/auth/validation';

const CODE_LENGTH = 6;

type ForgotPasswordField = 'email';

export function useForgotPassword() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<ForgotPasswordField>>({});
  const [success, setSuccess] = useState(false);
  const [code, setCode] = useState(() => Array<string>(CODE_LENGTH).fill(''));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const clearFieldError = (field: ForgotPasswordField) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') ?? '').trim();
    const validationErrors = validateForgotPasswordFields(email);

    setFieldErrors(validationErrors);

    if (hasFieldErrors(validationErrors)) return;

    setLoading(true);

    try {
      await apiClient('/auth/forgot-password', {
        method: 'POST',
        body: { email }
      });
      setSuccess(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to process request');
    } finally {
      setLoading(false);
    }
  };

  const onCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const nextCode = [...code];
    nextCode[index] = value.slice(-1);
    setCode(nextCode);

    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const onCodeKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const onCodePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const value = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);

    if (value.length !== CODE_LENGTH) return;

    setCode(value.split(''));
    inputRefs.current[CODE_LENGTH - 1]?.focus();
  };

  const continueWithCode = () => {
    const value = code.join('');
    if (value.length === CODE_LENGTH) {
      router.push(`/reset-password?code=${value}`);
    }
  };

  return {
    loading,
    error,
    fieldErrors,
    success,
    code,
    isCodeComplete: code.every(Boolean),
    onSubmit,
    clearFieldError,
    onCodeChange,
    onCodeKeyDown,
    onCodePaste,
    continueWithCode,
    setCodeInputRef: (index: number, element: HTMLInputElement | null) => {
      inputRefs.current[index] = element;
    }
  };
}
