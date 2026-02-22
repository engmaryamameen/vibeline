import { randomBytes } from 'node:crypto';

const SIX_DIGIT_UPPER_BOUND = 1_000_000;

const generateHexToken = () => randomBytes(32).toString('hex');

const generateSixDigitCode = () => {
  const value = randomBytes(4).readUInt32BE(0) % SIX_DIGIT_UPPER_BOUND;
  return value.toString().padStart(6, '0');
};

const generateExpiryTimestamp = (hours: number) => {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hours);
  return expiry.toISOString();
};

export const createVerificationArtifacts = () => ({
  verificationToken: generateHexToken(),
  verificationCode: generateSixDigitCode(),
  verificationTokenExpiresAt: generateExpiryTimestamp(24)
});

export const createPasswordResetArtifacts = () => ({
  passwordResetToken: generateHexToken(),
  passwordResetCode: generateSixDigitCode(),
  passwordResetTokenExpiresAt: generateExpiryTimestamp(1)
});
