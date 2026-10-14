'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { query, queryOne, execute, transaction } from '@/lib/db';
import {
  hashPassword,
  verifyPassword,
  generateResetToken,
  hashToken,
  checkPasswordStrength,
} from '@/lib/auth/password';
import {
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getSessionUser,
} from '@/lib/auth/session';
import type { UserRole } from '@/lib/types';
import { safeRedirect } from './redirect';
import { sendResetEmail } from './email';

export interface AuthFormState {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
  /** Only populated when EMAIL_ENABLED is false, so you can test locally. */
  devResetUrl?: string;
}

const emailSchema = z
  .string()
  .trim()
  .min(1, 'E-mail is required')
  .max(254, 'That e-mail is too long')
  .email('Enter a valid e-mail address');

const signUpSchema = z
  .object({
    displayName: z.string().trim().min(1, 'Tell us what to call you').max(60),
    email: emailSchema,
    password: z.string().min(8, 'Use at least 8 characters').max(200),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password'),
});

function zodFieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !out[key]) out[key] = issue.message;
  }
  return out;
}

function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

// ===========================================================================
// Sign up
// ===========================================================================
export async function signUpAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    displayName: formData.get('displayName'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const strength = checkPasswordStrength(parsed.data.password);
  if (!strength.ok) {
    return { ok: false, fieldErrors: { password: strength.problems[0] } };
  }

  const email = parsed.data.email.toLowerCase();

  const existing = await queryOne<{ id: string }>('SELECT id FROM users WHERE email = $1', [email]);
  if (existing) {
    return { ok: false, fieldErrors: { email: 'An account with this e-mail already exists' } };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const role: UserRole = adminEmails().has(email) ? 'admin' : 'user';

  let user: { id: string; email: string; role: UserRole; session_version: number };
  try {
    user = await transaction(async (client) => {
      const { rows } = await client.query<{
        id: string;
        email: string;
        role: UserRole;
        session_version: number;
      }>(
        `INSERT INTO users (email, password_hash, role)
         VALUES ($1, $2, $3)
         RETURNING id, email, role, session_version`,
        [email, passwordHash, role],
      );
      const created = rows[0];

      await client.query(
        `INSERT INTO profiles (user_id, display_name) VALUES ($1, $2)
         ON CONFLICT (user_id) DO NOTHING`,
        [created.id, parsed.data.displayName],
      );

      await client.query(
        `INSERT INTO subscriptions (user_id, plan, status, provider)
         VALUES ($1, 'free', 'active', 'mock')
         ON CONFLICT (user_id) DO NOTHING`,
        [created.id],
      );

      if (role === 'admin') {
        await client.query(
          `INSERT INTO admin_users (user_id, note) VALUES ($1, 'Bootstrapped via ADMIN_EMAILS')
           ON CONFLICT (user_id) DO NOTHING`,
          [created.id],
        );
      }

      await client.query(
        `INSERT INTO activity_logs (user_id, action, metadata) VALUES ($1, 'signed_up', '{}'::jsonb)`,
        [created.id],
      );

      return created;
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('users_email_unique')) {
      return { ok: false, fieldErrors: { email: 'An account with this e-mail already exists' } };
    }
    return { ok: false, error: `Could not create your account: ${message}` };
  }

  const token = await createSessionToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: parsed.data.displayName,
    sv: user.session_version,
  });
  await setSessionCookie(token);

  redirect(safeRedirect(formData.get('next')));
}

// ===========================================================================
// Sign in
// ===========================================================================
export async function signInAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const email = parsed.data.email.toLowerCase();
  const row = await queryOne<{
    id: string;
    email: string;
    role: UserRole;
    password_hash: string;
    session_version: number;
    display_name: string | null;
  }>(
    `SELECT u.id, u.email, u.role, u.password_hash, u.session_version, p.display_name
       FROM users u LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.email = $1`,
    [email],
  );

  // Same message either way, so this cannot be used to enumerate accounts.
  const GENERIC = 'That e-mail and password combination did not work';

  if (!row) {
    // Burn roughly the same time as a real verification would.
    await verifyPassword(parsed.data.password, 'scrypt$16384$8$1$00$00');
    return { ok: false, error: GENERIC };
  }

  const valid = await verifyPassword(parsed.data.password, row.password_hash);
  if (!valid) return { ok: false, error: GENERIC };

  await execute('UPDATE users SET last_login_at = now() WHERE id = $1', [row.id]);
  await execute(
    `INSERT INTO activity_logs (user_id, action, metadata) VALUES ($1, 'signed_in', '{}'::jsonb)`,
    [row.id],
  );

  const token = await createSessionToken({
    sub: row.id,
    email: row.email,
    role: row.role,
    name: row.display_name || row.email.split('@')[0],
    sv: row.session_version,
  });
  await setSessionCookie(token);

  redirect(safeRedirect(formData.get('next')));
}

// ===========================================================================
// Sign out
// ===========================================================================
export async function signOutAction(): Promise<void> {
  await clearSessionCookie();
  revalidatePath('/', 'layout');
  redirect('/login?signed-out=1');
}

/** Invalidate every session for this account, on every device. */
export async function signOutEverywhereAction(): Promise<void> {
  const user = await getSessionUser();
  if (user) {
    await execute('UPDATE users SET session_version = session_version + 1 WHERE id = $1', [user.id]);
  }
  await clearSessionCookie();
  redirect('/login?signed-out=1');
}

// ===========================================================================
// Forgot password
// ===========================================================================
export async function requestPasswordResetAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = emailSchema.safeParse(formData.get('email'));
  if (!parsed.success) {
    return { ok: false, fieldErrors: { email: parsed.error.issues[0].message } };
  }
  const email = parsed.data.toLowerCase();

  // Always report success — otherwise this endpoint tells an attacker which
  // addresses have accounts.
  const SUCCESS: AuthFormState = {
    ok: true,
    message:
      'If an account exists for that address, a reset link is on its way. The link is valid for one hour.',
  };

  const user = await queryOne<{ id: string }>('SELECT id FROM users WHERE email = $1', [email]);
  if (!user) return SUCCESS;

  // One live token at a time.
  await execute(
    'UPDATE password_reset_tokens SET used_at = now() WHERE user_id = $1 AND used_at IS NULL',
    [user.id],
  );

  const { token, tokenHash } = generateResetToken();
  await execute(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + interval '1 hour')`,
    [user.id, tokenHash],
  );

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const resetUrl = `${base}/reset-password?token=${token}`;

  if (process.env.EMAIL_ENABLED === 'true') {
    try { await sendResetEmail(email, resetUrl); }
    catch (error) { console.error('[algoladder] Reset email could not be delivered:', error instanceof Error ? error.message : 'Unknown error'); }
    return SUCCESS;
  }

  // A public deployment must never hand a reset credential to its requester.
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_RESET_LINKS !== 'true') {
    console.error('[algoladder] Password-reset email is disabled. Configure the email transport.');
    return SUCCESS;
  }
  console.info(`\n[algoladder] Password reset link for ${email}:\n  ${resetUrl}\n`);
  return { ...SUCCESS, devResetUrl: resetUrl };
}

// ===========================================================================
// Reset password
// ===========================================================================
const resetSchema = z
  .object({
    token: z.string().min(10, 'This reset link is not valid'),
    password: z.string().min(8, 'Use at least 8 characters').max(200),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export async function resetPasswordAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resetSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const strength = checkPasswordStrength(parsed.data.password);
  if (!strength.ok) {
    return { ok: false, fieldErrors: { password: strength.problems[0] } };
  }

  const tokenHash = hashToken(parsed.data.token);
  const row = await queryOne<{ id: string; user_id: string }>(
    `SELECT id, user_id FROM password_reset_tokens
      WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()`,
    [tokenHash],
  );

  if (!row) {
    return {
      ok: false,
      error: 'That reset link has expired or has already been used. Request a new one.',
    };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const resetApplied = await transaction(async (client) => {
    const claimed = await client.query(
      `UPDATE password_reset_tokens SET used_at = now()
       WHERE id = $1 AND used_at IS NULL AND expires_at > now() RETURNING id`, [row.id]);
    if (!claimed.rowCount) return false;
    await client.query(
      // Bumping session_version signs the account out everywhere, which is
      // what you want after a reset.
      'UPDATE users SET password_hash = $1, session_version = session_version + 1 WHERE id = $2',
      [passwordHash, row.user_id],
    );

    await client.query(
      `INSERT INTO activity_logs (user_id, action, metadata) VALUES ($1, 'password_reset', '{}'::jsonb)`,
      [row.user_id],
    );
    return true;
  });

  if (!resetApplied) return { ok: false, error: 'That reset link has expired or has already been used. Request a new one.' };
  await clearSessionCookie();
  redirect('/login?reset=1');
}

// ===========================================================================
// Change password while signed in
// ===========================================================================
export async function changePasswordAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: 'You are not signed in' };

  const current = String(formData.get('currentPassword') ?? '');
  const next = String(formData.get('newPassword') ?? '');
  const confirm = String(formData.get('confirmPassword') ?? '');

  if (next !== confirm) {
    return { ok: false, fieldErrors: { confirmPassword: 'Passwords do not match' } };
  }
  const strength = checkPasswordStrength(next);
  if (!strength.ok) {
    return { ok: false, fieldErrors: { newPassword: strength.problems[0] } };
  }

  const row = await queryOne<{ password_hash: string }>(
    'SELECT password_hash FROM users WHERE id = $1',
    [user.id],
  );
  if (!row || !(await verifyPassword(current, row.password_hash))) {
    return { ok: false, fieldErrors: { currentPassword: 'That is not your current password' } };
  }

  const passwordHash = await hashPassword(next);
  await execute('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, user.id]);

  return { ok: true, message: 'Password updated.' };
}

/** Used by the setup checklist on the landing page. */
export async function countUsers(): Promise<number> {
  const rows = await query<{ n: number }>('SELECT count(*)::int AS n FROM users');
  return rows[0]?.n ?? 0;
}

