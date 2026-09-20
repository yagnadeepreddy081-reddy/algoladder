import { randomBytes, scrypt as _scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(_scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options?: { N?: number; r?: number; p?: number; maxmem?: number },
) => Promise<Buffer>;

// Deliberately slow. N=16384 is the Node default and a reasonable balance for
// a server that is not doing thousands of logins per second.
const PARAMS = { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEYLEN = 64;

/**
 * Hash a password. Stored format:
 *   scrypt$<N>$<r>$<p>$<salt-hex>$<hash-hex>
 * Keeping the parameters in the string means we can raise the cost later
 * without invalidating every existing password.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password.normalize('NFKC'), salt, KEYLEN, PARAMS);
  return [
    'scrypt',
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString('hex'),
    derived.toString('hex'),
  ].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const parts = stored.split('$');
    if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
    const [, n, r, p, saltHex, hashHex] = parts;
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const derived = await scrypt(password.normalize('NFKC'), salt, expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: 64 * 1024 * 1024,
    });
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/** A URL-safe, single-use token for password reset links. */
export function generateResetToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashToken(token) };
}

/** Reset tokens are stored hashed, so a database leak does not hand out logins. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// The strength meter lives in its own Node-free module so the sign-up form can
// import it on the client without pulling `node:crypto` into the bundle.
export { checkPasswordStrength, type PasswordCheck } from '@/lib/password-strength';
