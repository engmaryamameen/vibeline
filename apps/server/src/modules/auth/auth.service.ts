import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import type {
  AddPasswordRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  User,
  VerifyEmailRequest
} from '@vibeline/contracts';
import { AppError } from '@/common/errors/app-error';
import { logger } from '@/config/logger';
import { env } from '@/config/env';
import { userRepository, toPublicUser } from '@/repositories/user.repository';
import { authIdentityRepository } from '@/repositories/auth-identity.repository';
import { emailService } from '@/services/email.service';
import { comparePassword, hashPassword, passwordHashNeedsUpgrade } from '@/utils/hash';
import { signAccessToken } from '@/utils/jwt';
import { sessionService } from './session.service';

const credentialDigest = (value: string) => createHmac('sha256', env.AUTH_CREDENTIAL_SECRET).update(value).digest('hex');
const token = () => randomBytes(32).toString('hex');
const code = () => (randomBytes(4).readUInt32BE(0) % 1_000_000).toString().padStart(6, '0');
const expiry = (hours: number) => new Date(Date.now() + hours * 60 * 60 * 1000);
const isUniqueViolation = (error: unknown): error is { code: '23505' } =>
  typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === '23505';

class AuthService {
  private tokens(user: User, refreshToken: string) {
    return {
      accessToken: signAccessToken({ id: user.id, email: user.email, role: user.role }),
      refreshToken
    };
  }

  async register(payload: RegisterRequest) {
    if (await userRepository.findByEmail(payload.email)) {
      throw new AppError(409, 'EMAIL_IN_USE', 'Email is already registered');
    }

    const verificationToken = token();
    const verificationCode = code();
    const userId = randomUUID();
    const displayName = `${payload.firstName} ${payload.lastName}`.trim();

    try {
      const row = await authIdentityRepository.createPasswordAccount({
        userId,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        dateOfBirth: payload.dateOfBirth,
        displayName,
        passwordHash: await hashPassword(payload.password),
        verificationToken: credentialDigest(verificationToken),
        verificationCode: credentialDigest(verificationCode),
        verificationTokenExpiresAt: expiry(24)
      });

      emailService
        .sendVerificationEmail(payload.email, verificationToken, verificationCode, payload.firstName)
        .catch((error) => logger.error({ err: error, userId }, 'Failed to send verification email'));

      return {
        user: toPublicUser(row),
        message: 'Registration successful. Please check your email to verify your account.'
      };
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw new AppError(409, 'EMAIL_IN_USE', 'Email is already registered');
      }
      throw error;
    }
  }

  async login(payload: LoginRequest) {
    const existing = await userRepository.findByEmail(payload.email);
    const credential = existing ? await authIdentityRepository.findPasswordCredential(existing.id) : null;

    if (!existing || !credential || !(await comparePassword(payload.password, credential.passwordHash))) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is invalid');
    }

    if (!existing.emailVerified) {
      throw new AppError(403, 'EMAIL_NOT_VERIFIED', 'Please verify your email address before logging in');
    }

    if (passwordHashNeedsUpgrade(credential.passwordHash)) {
      await authIdentityRepository.updatePassword(existing.id, await hashPassword(payload.password));
    }

    const user = toPublicUser(existing);
    return { user, tokens: this.tokens(user, await sessionService.create(user.id)) };
  }

  async refreshSession(refreshToken: string) {
    if (!refreshToken) {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is missing');
    }

    const rotated = await sessionService.rotate(refreshToken);
    const existing = await userRepository.findById(rotated.userId);

    if (!existing || !existing.emailVerified) {
      if (existing) await sessionService.revokeAll(existing.id);
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh session is invalid');
    }

    const user = toPublicUser(existing);
    return { user, tokens: this.tokens(user, rotated.refreshToken) };
  }

  async logout(refreshToken: string) {
    if (refreshToken) await sessionService.revoke(refreshToken);
  }

  async addPassword(userId: string, payload: AddPasswordRequest) {
    if (await authIdentityRepository.findPasswordCredential(userId)) {
      throw new AppError(409, 'PASSWORD_ALREADY_CONFIGURED', 'Password authentication is already configured');
    }

    try {
      await authIdentityRepository.createPasswordCredential(userId, await hashPassword(payload.password));
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw new AppError(409, 'PASSWORD_ALREADY_CONFIGURED', 'Password authentication is already configured');
      }
      throw error;
    }

    return { message: 'Password authentication added.' };
  }

  async changePassword(userId: string, payload: ChangePasswordRequest) {
    const credential = await authIdentityRepository.findPasswordCredential(userId);

    if (!credential || !(await comparePassword(payload.currentPassword, credential.passwordHash))) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Current password is invalid');
    }

    await authIdentityRepository.updatePassword(userId, await hashPassword(payload.newPassword));
    await sessionService.revokeAll(userId);
    return { message: 'Password changed. Please sign in again.' };
  }

  async verifyEmail(payload: VerifyEmailRequest) {
    const digest = credentialDigest(payload.code ?? payload.token ?? '');
    const user = payload.code
      ? await userRepository.findByVerificationCode(digest)
      : await userRepository.findByVerificationToken(digest);

    if (!user) {
      throw new AppError(400, 'INVALID_TOKEN', 'Verification token is invalid or has expired');
    }

    if (user.verificationTokenExpiresAt && user.verificationTokenExpiresAt < new Date()) {
      throw new AppError(400, 'TOKEN_EXPIRED', 'Verification token has expired. Please request a new one.');
    }

    const verified = await userRepository.setEmailVerified(user.id);
    if (!verified) {
      throw new AppError(500, 'VERIFICATION_FAILED', 'Failed to verify email. Please try again.');
    }

    return {
      user: verified,
      tokens: this.tokens(verified, await sessionService.create(verified.id)),
      message: 'Email verified successfully. You can now access your account.'
    };
  }

  async resendVerificationEmail(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) return { message: 'If this email exists, a verification link will be sent.' };
    if (user.emailVerified) throw new AppError(400, 'ALREADY_VERIFIED', 'Email is already verified');

    const verificationToken = token();
    const verificationCode = code();
    await userRepository.update(user.id, {
      verificationToken: credentialDigest(verificationToken),
      verificationCode: credentialDigest(verificationCode),
      verificationTokenExpiresAt: expiry(24)
    });

    await emailService.sendVerificationEmail(
      email,
      verificationToken,
      verificationCode,
      user.firstName ?? user.displayName
    );

    return { message: 'If this email exists, a verification link will be sent.' };
  }

  async forgotPassword(payload: ForgotPasswordRequest) {
    const message = 'If an account with that email exists, a password reset link will be sent.';
    const user = await userRepository.findByEmail(payload.email);
    if (!user) return { message };

    const credential = await authIdentityRepository.findPasswordCredential(user.id);
    if (!credential) return { message };

    const resetToken = token();
    const resetCode = code();
    await authIdentityRepository.setPasswordReset(user.id, {
      token: credentialDigest(resetToken),
      code: credentialDigest(resetCode),
      expiresAt: expiry(1)
    });

    emailService
      .sendPasswordResetEmail(payload.email, resetToken, resetCode, user.firstName ?? user.displayName)
      .catch((error) => logger.error({ err: error, userId: user.id }, 'Failed to send password reset email'));

    return { message };
  }

  async resetPassword(payload: ResetPasswordRequest) {
    const digest = credentialDigest(payload.code ?? payload.token ?? '');
    const credential = payload.code
      ? await authIdentityRepository.findByPasswordResetCode(digest)
      : await authIdentityRepository.findByPasswordResetToken(digest);

    if (!credential) {
      throw new AppError(400, 'INVALID_TOKEN', 'Password reset token or code is invalid or has expired');
    }

    if (credential.passwordResetTokenExpiresAt && credential.passwordResetTokenExpiresAt < new Date()) {
      throw new AppError(400, 'TOKEN_EXPIRED', 'Password reset token has expired. Please request a new one.');
    }

    await authIdentityRepository.updatePassword(credential.userId, await hashPassword(payload.password));
    await authIdentityRepository.setPasswordReset(credential.userId, { token: null, code: null, expiresAt: null });
    await sessionService.revokeAll(credential.userId);

    return { message: 'Your password has been reset successfully. You can now log in with your new password.' };
  }
}

export const authService = new AuthService();
