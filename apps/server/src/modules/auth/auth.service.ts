import { randomUUID } from 'node:crypto';

import type { User } from '@vibeline/types';

import { AppError } from '@/common/errors/app-error';
import { logger } from '@/config/logger';
import { mapStoredUserToPublicUser, type StoredUser } from '@/modules/user/user.mapper';
import { userRepository } from '@/repositories/user.repository';
import { emailService } from '@/services/email.service';
import { comparePassword, hashPassword } from '@/utils/hash';
import { signTokens, verifyRefreshToken } from '@/utils/jwt';

import { createPasswordResetArtifacts, createVerificationArtifacts } from './auth.artifacts';
import type {
  ForgotPasswordRequestDto,
  LoginRequestDto,
  RegisterRequestDto,
  ResetPasswordRequestDto,
  VerifyEmailRequestDto
} from './auth.dto';

const INVALID_CREDENTIALS_MESSAGE = 'Email or password is invalid';
const EMAIL_NOT_VERIFIED_MESSAGE = 'Please verify your email address before logging in';
const VERIFICATION_GENERIC_SUCCESS_MESSAGE =
  'If this email exists, a verification link will be sent.';
const FORGOT_PASSWORD_SUCCESS_MESSAGE =
  'If an account with that email exists, a password reset link will be sent.';

class AuthService {
  private createSessionResponse(user: User, message?: string) {
    return {
      user,
      tokens: signTokens({
        id: user.id,
        email: user.email,
        role: user.role
      }),
      ...(message ? { message } : {})
    };
  }

  private ensureEmailIsVerified(user: Pick<StoredUser, 'emailVerified'>) {
    if (!user.emailVerified) {
      throw new AppError(403, 'EMAIL_NOT_VERIFIED', EMAIL_NOT_VERIFIED_MESSAGE);
    }
  }

  private ensurePasswordLoginEnabled(user: Pick<StoredUser, 'passwordHash'>) {
    if (!user.passwordHash) {
      throw new AppError(401, 'INVALID_CREDENTIALS', INVALID_CREDENTIALS_MESSAGE);
    }
  }

  private ensureTokenNotExpired(expiresAt: string | null | undefined, expirationMessage: string) {
    if (!expiresAt) return;
    if (new Date(expiresAt) < new Date()) {
      throw new AppError(400, 'TOKEN_EXPIRED', expirationMessage);
    }
  }

  private async findUserByVerificationProof(payload: VerifyEmailRequestDto) {
    if (payload.code) {
      return userRepository.findByVerificationCode(payload.code);
    }
    if (payload.token) {
      return userRepository.findByVerificationToken(payload.token);
    }
    return null;
  }

  private async findUserByPasswordResetProof(payload: ResetPasswordRequestDto) {
    if (payload.code) {
      return userRepository.findByPasswordResetCode(payload.code);
    }
    if (payload.token) {
      return userRepository.findByPasswordResetToken(payload.token);
    }
    return null;
  }

  async register(payload: RegisterRequestDto) {
    const existing = await userRepository.findByEmail(payload.email);
    if (existing) {
      throw new AppError(409, 'EMAIL_IN_USE', 'Email is already registered');
    }

    const passwordHash = await hashPassword(payload.password);
    const verificationArtifacts = createVerificationArtifacts();

    const createdUser = await userRepository.create({
      id: randomUUID(),
      email: payload.email,
      displayName: payload.displayName,
      role: 'user',
      emailVerified: false,
      passwordHash,
      ...verificationArtifacts
    });

    emailService
      .sendVerificationEmail(
        payload.email,
        verificationArtifacts.verificationToken,
        verificationArtifacts.verificationCode,
        payload.displayName
      )
      .catch((error) => {
        logger.error({ error, email: payload.email }, 'Failed to send verification email');
      });

    return this.createSessionResponse(
      mapStoredUserToPublicUser(createdUser),
      'Registration successful. Please check your email to verify your account.'
    );
  }

  async login(payload: LoginRequestDto) {
    const existing = await userRepository.findByEmail(payload.email);
    if (!existing) {
      throw new AppError(401, 'INVALID_CREDENTIALS', INVALID_CREDENTIALS_MESSAGE);
    }

    this.ensurePasswordLoginEnabled(existing);

    const matched = await comparePassword(payload.password, existing.passwordHash);
    if (!matched) {
      throw new AppError(401, 'INVALID_CREDENTIALS', INVALID_CREDENTIALS_MESSAGE);
    }

    this.ensureEmailIsVerified(existing);
    return this.createSessionResponse(mapStoredUserToPublicUser(existing));
  }

  async refreshSession(refreshToken: string) {
    if (!refreshToken) {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is missing');
    }

    const { userId } = verifyRefreshToken(refreshToken);
    const existing = await userRepository.findById(userId);

    if (!existing) {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid');
    }

    this.ensureEmailIsVerified(existing);
    return this.createSessionResponse(mapStoredUserToPublicUser(existing));
  }

  async verifyEmail(payload: VerifyEmailRequestDto) {
    const user = await this.findUserByVerificationProof(payload);
    if (!user) {
      throw new AppError(400, 'INVALID_TOKEN', 'Verification token is invalid or has expired');
    }

    this.ensureTokenNotExpired(
      user.verificationTokenExpiresAt,
      'Verification token has expired. Please request a new one.'
    );

    const verifiedUser = await userRepository.setEmailVerified(user.id);

    if (!verifiedUser) {
      throw new AppError(500, 'VERIFICATION_FAILED', 'Failed to verify email. Please try again.');
    }

    logger.info({ userId: user.id, email: user.email }, 'Email verified successfully');

    return this.createSessionResponse(
      mapStoredUserToPublicUser(verifiedUser),
      'Email verified successfully. You can now access your account.'
    );
  }

  async resendVerificationEmail(email: string) {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      return { message: VERIFICATION_GENERIC_SUCCESS_MESSAGE };
    }

    if (user.emailVerified) {
      throw new AppError(400, 'ALREADY_VERIFIED', 'Email is already verified');
    }

    const verificationArtifacts = createVerificationArtifacts();

    await userRepository.update(user.id, verificationArtifacts);

    await emailService.sendVerificationEmail(
      email,
      verificationArtifacts.verificationToken,
      verificationArtifacts.verificationCode,
      user.displayName
    );

    return { message: VERIFICATION_GENERIC_SUCCESS_MESSAGE };
  }

  async forgotPassword(payload: ForgotPasswordRequestDto) {
    const user = await userRepository.findByEmail(payload.email);

    if (!user) {
      return { message: FORGOT_PASSWORD_SUCCESS_MESSAGE };
    }

    const resetArtifacts = createPasswordResetArtifacts();

    await userRepository.update(user.id, resetArtifacts);

    emailService
      .sendPasswordResetEmail(
        payload.email,
        resetArtifacts.passwordResetToken,
        resetArtifacts.passwordResetCode,
        user.displayName
      )
      .catch((error) => {
        logger.error({ error, email: payload.email }, 'Failed to send password reset email');
      });

    logger.info({ userId: user.id, email: user.email }, 'Password reset email requested');

    return { message: FORGOT_PASSWORD_SUCCESS_MESSAGE };
  }

  async resetPassword(payload: ResetPasswordRequestDto) {
    const user = await this.findUserByPasswordResetProof(payload);
    if (!user) {
      throw new AppError(
        400,
        'INVALID_TOKEN',
        'Password reset token or code is invalid or has expired'
      );
    }

    this.ensureTokenNotExpired(
      user.passwordResetTokenExpiresAt,
      'Password reset token has expired. Please request a new one.'
    );

    const passwordHash = await hashPassword(payload.password);

    await userRepository.update(user.id, {
      passwordHash,
      passwordResetToken: undefined,
      passwordResetCode: undefined,
      passwordResetTokenExpiresAt: undefined
    });

    logger.info({ userId: user.id, email: user.email }, 'Password reset successfully');

    return {
      message:
        'Your password has been reset successfully. You can now log in with your new password.'
    };
  }
}

export const authService = new AuthService();
