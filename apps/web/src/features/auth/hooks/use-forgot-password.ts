'use client';

import { useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';

import { authApi } from '../api';
import { getErrorMessage } from '../error-utils';

const CODE_LENGTH = 6;

export const useForgotPassword = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();

    try {
      await authApi.forgotPassword(email);
      setSuccess(true);
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Unable to process request'));
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const nextCode = [...code];
    nextCode[index] = value;
    setCode(nextCode);

    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pastedData = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (pastedData.length === CODE_LENGTH) {
      setCode(pastedData.split(''));
      inputRefs.current[CODE_LENGTH - 1]?.focus();
    }
  };

  const handleCodeSubmit = () => {
    const resetCode = code.join('');
    if (resetCode.length !== CODE_LENGTH) return;
    router.push(`/reset-password?code=${resetCode}`);
  };

  return {
    loading,
    error,
    success,
    code,
    inputRefs,
    handleSubmit,
    handleCodeChange,
    handleCodeKeyDown,
    handleCodePaste,
    handleCodeSubmit
  };
};
