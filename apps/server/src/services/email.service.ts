import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import { env } from '@/config/env';
import { logger } from '@/config/logger';

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: `"VibeLine" <${env.INVITE_FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text ?? this.stripHtml(options.html)
      });

      logger.info({ messageId: info.messageId, to: options.to }, 'Email sent successfully');
      return true;
    } catch (error) {
      logger.error({ error, to: options.to }, 'Failed to send email');
      return false;
    }
  }

  async sendVerificationEmail(
    email: string,
    token: string,
    verificationCode: string,
    displayName: string
  ): Promise<boolean> {
    const verificationUrl = `${env.APP_URL}/verify-email?token=${token}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <div style="display: inline-flex; align-items: center; gap: 8px;">
                <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #3b82f6, #6366f1); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: #ffffff; font-weight: bold; font-size: 14px;">V</span>
                </div>
                <span style="color: #0f172a; font-size: 18px; font-weight: 600;">VibeLine</span>
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h1 style="margin: 0 0 8px; color: #0f172a; font-size: 20px; font-weight: 600; text-align: center;">
                Verify your email
              </h1>
              <p style="margin: 0 0 24px; color: #475569; font-size: 14px; text-align: center; line-height: 1.5;">
                Hi ${displayName}, thanks for signing up! Please verify your email address to get started.
              </p>

              <!-- Verification Code -->
              <p style="margin: 0 0 16px; color: #475569; font-size: 14px; text-align: center;">
                Your verification code: <strong style="letter-spacing: 0.2em; font-size: 18px;">${verificationCode}</strong>
              </p>
              <p style="margin: 0 0 24px; color: #64748b; font-size: 12px; text-align: center;">
                Enter this code on the verification page, or click the button below.
              </p>

              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}"
                       style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #3b82f6, #6366f1); color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; color: #64748b; font-size: 12px; text-align: center; line-height: 1.5;">
                This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
              </p>

              <!-- Fallback Link -->
              <p style="margin: 16px 0 0; color: #64748b; font-size: 11px; text-align: center; word-break: break-all;">
                Or copy this link: <br>
                <a href="${verificationUrl}" style="color: #3b82f6; text-decoration: none;">${verificationUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 24px; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                © ${new Date().getFullYear()} VibeLine. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const text = `
Hi ${displayName},

Thanks for signing up for VibeLine! Please verify your email address.

Your verification code: ${verificationCode}

Or click this link: ${verificationUrl}

This link and code will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

© ${new Date().getFullYear()} VibeLine. All rights reserved.
`;

    return this.sendEmail({
      to: email,
      subject: 'Verify your email address - VibeLine',
      html,
      text
    });
  }

  async sendPasswordResetEmail(email: string, token: string, resetCode: string, displayName: string): Promise<boolean> {
    const resetUrl = `${env.APP_URL}/reset-password?token=${token}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <div style="display: inline-flex; align-items: center; gap: 8px;">
                <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #3b82f6, #6366f1); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: #ffffff; font-weight: bold; font-size: 14px;">V</span>
                </div>
                <span style="color: #0f172a; font-size: 18px; font-weight: 600;">VibeLine</span>
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h1 style="margin: 0 0 8px; color: #0f172a; font-size: 20px; font-weight: 600; text-align: center;">
                Reset your password
              </h1>
              <p style="margin: 0 0 24px; color: #475569; font-size: 14px; text-align: center; line-height: 1.5;">
                Hi ${displayName}, we received a request to reset your password. Click the button below to create a new password.
              </p>

              <!-- Reset Code -->
              <p style="margin: 0 0 16px; color: #475569; font-size: 14px; text-align: center;">
                Your reset code: <strong style="letter-spacing: 0.2em; font-size: 18px;">${resetCode}</strong>
              </p>
              <p style="margin: 0 0 24px; color: #64748b; font-size: 12px; text-align: center;">
                Enter this code on the reset page, or click the button below.
              </p>

              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}"
                       style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #3b82f6, #6366f1); color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; color: #64748b; font-size: 12px; text-align: center; line-height: 1.5;">
                This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
              </p>

              <!-- Fallback Link -->
              <p style="margin: 16px 0 0; color: #64748b; font-size: 11px; text-align: center; word-break: break-all;">
                Or copy this link: <br>
                <a href="${resetUrl}" style="color: #3b82f6; text-decoration: none;">${resetUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 24px; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                © ${new Date().getFullYear()} VibeLine. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const text = `
Hi ${displayName},

We received a request to reset your password for your VibeLine account.

Your reset code: ${resetCode}

Or click the link below to create a new password:

${resetUrl}

This link and code will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.

© ${new Date().getFullYear()} VibeLine. All rights reserved.
`;

    return this.sendEmail({
      to: email,
      subject: 'Reset your password - VibeLine',
      html,
      text
    });
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('SMTP connection verified');
      return true;
    } catch (error) {
      logger.error({ error }, 'SMTP connection verification failed');
      return false;
    }
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export const emailService = new EmailService();
