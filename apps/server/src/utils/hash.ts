import { argon2, randomBytes, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';

const MEMORY_KIB = 64 * 1024;
const PASSES = 3;
const PARALLELISM = 1;
const TAG_LENGTH = 32;

const deriveArgon2id = (password: string, salt: Buffer): Promise<Buffer> => new Promise((resolve, reject) => {
  argon2('argon2id', { message: password, nonce: salt, parallelism: PARALLELISM, tagLength: TAG_LENGTH, memory: MEMORY_KIB, passes: PASSES }, (error, derivedKey) => {
    if (error) reject(error); else resolve(derivedKey);
  });
});

export const hashPassword = async (value: string) => {
  const salt = randomBytes(16);
  const derived = await deriveArgon2id(value, salt);
  return `$argon2id$v=19$m=${MEMORY_KIB},t=${PASSES},p=${PARALLELISM}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
};

export const comparePassword = async (value: string, encoded: string) => {
  if (!encoded.startsWith('$argon2id$')) return bcrypt.compare(value, encoded);
  const parts = encoded.split('$');
  if (parts.length !== 6) return false;
  const params = Object.fromEntries(parts[3]!.split(',').map(entry => entry.split('=')));
  if (Number(params.m) !== MEMORY_KIB || Number(params.t) !== PASSES || Number(params.p) !== PARALLELISM) return false;
  const salt = Buffer.from(parts[4]!, 'base64url');
  const expected = Buffer.from(parts[5]!, 'base64url');
  const actual = await deriveArgon2id(value, salt);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};

export const passwordHashNeedsUpgrade = (encoded: string) => !encoded.startsWith('$argon2id$');
