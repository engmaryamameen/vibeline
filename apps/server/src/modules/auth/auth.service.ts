import { randomBytes, randomUUID } from 'node:crypto';

import type { Role, User } from '@vibeline/types';

import { AppError } from '@/common/errors/app-error';
import { logger } from '@/config/logger';
import { userRepository, type StoredUser } from '@/repositories/user.repository';
import { emailService } from '@/services/email.service';
import { comparePassword, hashPassword } from '@/utils/hash';
import { signTokens, verifyRefreshToken } from '@/utils/jwt';

import type {
  ForgotPasswordRequestDto,
  LoginRequestDto,
  RegisterRequestDto,
  ResetPasswordRequestDto,
  VerifyEmailRequestDto
} from './auth.dto';

const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;
const PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1;

const generateVerificationToken = (): string => {
  return randomBytes(32).toString('hex');
};

const generateVerificationCode = (): string => {
  const n = randomBytes(4).readUInt32BE(0) % 1_000_000;
  return n.toString().padStart(6, '0');
};

const getVerificationTokenExpiry = (): string => {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + VERIFICATION_TOKEN_EXPIRY_HOURS);
  return expiry.toISOString();
};

const generatePasswordResetToken = (): string => {
  return randomBytes(32).toString('hex');
};

const generatePasswordResetCode = (): string => {
  const n = randomBytes(4).readUInt32BE(0) % 1_000_000;
  return n.toString().padStart(6, '0');
};

const getPasswordResetTokenExpiry = (): string => {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + PASSWORD_RESET_TOKEN_EXPIRY_HOURS);
  return expiry.toISOString();
};

class AuthService {
  private toUser(stored: StoredUser): User {
    return {
      id: stored.id,
      email: stored.email,
      displayName: stored.displayName,
      avatarUrl: stored.avatarUrl ?? undefined,
      role: stored.role as User['role'],
      emailVerified: stored.emailVerified,
      createdAt:
        stored.createdAt instanceof Date ? stored.createdAt.toISOString() : String(stored.createdAt)
    };
  }

  async register(payload: RegisterRequestDto) {
    const existing = await userRepository.findByEmail(payload.email);

    if (existing) {
      throw new AppError(409, 'EMAIL_IN_USE', 'Email is already registered');
    }

    const now = new Date().toISOString();
    const verificationToken = generateVerificationToken();
    const verificationCode = generateVerificationCode();
    const verificationTokenExpiresAt = getVerificationTokenExpiry();

    const user: User = {
      id: randomUUID(),
      email: payload.email,
      displayName: payload.displayName,
      role: 'user',
      emailVerified: false,
      createdAt: now
    };

    const passwordHash = await hashPassword(payload.password);
    const createdUser = await userRepository.create({
      ...user,
      passwordHash,
      verificationToken,
      verificationCode,
      verificationTokenExpiresAt
    });

    emailService
      .sendVerificationEmail(payload.email, verificationToken, verificationCode, payload.displayName)
      .catch((error) => {
        logger.error({ error, email: payload.email }, 'Failed to send verification email');
      });

    return {
      user: createdUser,
      tokens: signTokens({
        id: createdUser.id,
        email: createdUser.email,
        role: createdUser.role as Role
      }),
      message: 'Registration successful. Please check your email to verify your account.'
    };
  }

  async login(payload: LoginRequestDto) {
    const existing = await userRepository.findByEmail(payload.email);

    if (!existing) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is invalid');
    }

    const matched = await comparePassword(payload.password, existing.passwordHash);

    if (!matched) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is invalid');
    }

    if (!existing.emailVerified) {
      throw new AppError(403, 'EMAIL_NOT_VERIFIED', 'Please verify your email address before logging in');
    }

    const user = this.toUser(existing);

    return {
      user,
      tokens: signTokens({
        id: user.id,
        email: user.email,
        role: user.role
      })
    };
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

    if (!existing.emailVerified) {
      throw new AppError(403, 'EMAIL_NOT_VERIFIED', 'Please verify your email address before logging in');
    }

    const user = this.toUser(existing);

    return {
      user,
      tokens: signTokens({
        id: user.id,
        email: user.email,
        role: user.role
      })
    };
  }

  async verifyEmail(payload: VerifyEmailRequestDto) {
    let user = null;
    if (payload.code) {
      user = await userRepository.findByVerificationCode(payload.code);
    } else if (payload.token) {
      user = await userRepository.findByVerificationToken(payload.token);
    }
    if (!user) {
      throw new AppError(400, 'INVALID_TOKEN', 'Verification token is invalid or has expired');
    }

    if (user.verificationTokenExpiresAt) {
      const expiresAt = new Date(user.verificationTokenExpiresAt);
      if (expiresAt < new Date()) {
        throw new AppError(400, 'TOKEN_EXPIRED', 'Verification token has expired. Please request a new one.');
      }
    }

    const verifiedUser = await userRepository.setEmailVerified(user.id);

    if (!verifiedUser) {
      throw new AppError(500, 'VERIFICATION_FAILED', 'Failed to verify email. Please try again.');
    }

    logger.info({ userId: user.id, email: user.email }, 'Email verified successfully');

    return {
      user: verifiedUser,
      tokens: signTokens({
        id: verifiedUser.id,
        email: verifiedUser.email,
        role: verifiedUser.role as Role
      }),
      message: 'Email verified successfully. You can now access your account.'
    };
  }

  async resendVerificationEmail(email: string) {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      return { message: 'If this email exists, a verification link will be sent.' };
    }

    if (user.emailVerified) {
      throw new AppError(400, 'ALREADY_VERIFIED', 'Email is already verified');
    }

    const verificationToken = generateVerificationToken();
    const verificationCode = generateVerificationCode();
    const verificationTokenExpiresAt = getVerificationTokenExpiry();

    await userRepository.update(user.id, {
      verificationToken,
      verificationCode,
      verificationTokenExpiresAt
    });

    await emailService.sendVerificationEmail(email, verificationToken, verificationCode, user.displayName);

    return { message: 'If this email exists, a verification link will be sent.' };
  }

  async forgotPassword(payload: ForgotPasswordRequestDto) {
    const user = await userRepository.findByEmail(payload.email);

    // Always return success message to prevent email enumeration
    const successMessage = 'If an account with that email exists, a password reset link will be sent.';

    if (!user) {
      return { message: successMessage };
    }

    const passwordResetToken = generatePasswordResetToken();
    const passwordResetCode = generatePasswordResetCode();
    const passwordResetTokenExpiresAt = getPasswordResetTokenExpiry();

    await userRepository.update(user.id, {
      passwordResetToken,
      passwordResetCode,
      passwordResetTokenExpiresAt
    });

    emailService
      .sendPasswordResetEmail(payload.email, passwordResetToken, passwordResetCode, user.displayName)
      .catch((error) => {
        logger.error({ error, email: payload.email }, 'Failed to send password reset email');
      });

    logger.info({ userId: user.id, email: user.email }, 'Password reset email requested');

    return { message: successMessage };
  }

  async resetPassword(payload: ResetPasswordRequestDto) {
    let user = null;
    if (payload.code) {
      user = await userRepository.findByPasswordResetCode(payload.code);
    } else if (payload.token) {
      user = await userRepository.findByPasswordResetToken(payload.token);
    }

    if (!user) {
      throw new AppError(400, 'INVALID_TOKEN', 'Password reset token or code is invalid or has expired');
    }

    if (user.passwordResetTokenExpiresAt) {
      const expiresAt = new Date(user.passwordResetTokenExpiresAt);
      if (expiresAt < new Date()) {
        throw new AppError(400, 'TOKEN_EXPIRED', 'Password reset token has expired. Please request a new one.');
      }
    }

    const passwordHash = await hashPassword(payload.password);

    await userRepository.update(user.id, {
      passwordHash,
      passwordResetToken: undefined,
      passwordResetCode: undefined,
      passwordResetTokenExpiresAt: undefined
    });

    logger.info({ userId: user.id, email: user.email }, 'Password reset successfully');

    return { message: 'Your password has been reset successfully. You can now log in with your new password.' };
  }
}

export const authService = new AuthService();
