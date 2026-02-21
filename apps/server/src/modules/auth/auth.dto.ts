import type { User } from '@vibeline/types';

export interface RegisterRequestDto {
  displayName: string;
  email: string;
  password: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface VerifyEmailRequestDto {
  token?: string;
  code?: string;
}

export interface ResendVerificationRequestDto {
  email: string;
}

export interface ForgotPasswordRequestDto {
  email: string;
}

export interface ResetPasswordRequestDto {
  token?: string;
  code?: string;
  password: string;
}

export interface AuthResponseDto {
  user: User;
  tokens: {
    accessToken: string;
  };
  message?: string;
}
