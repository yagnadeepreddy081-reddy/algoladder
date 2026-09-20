import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';

import { queryOne } from '@/lib/db';
import type { SessionUser, UserRole } from '@/lib/types';

const COOKIE_NAME = 'algoladder_session';

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    throw new Error(
      'AUTH_SECRET is missing or too short. Generate one with:\n' +
        '  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"',
    );
  }
  return new TextEncoder().encode(value);
}

function sessionDays(): number {
  const n = Number(process.env.AUTH_SESSION_DAYS ?? 30);
  return Number.isFinite(n) && n > 0 ? n : 30;
}

interface SessionClaims {
  sub: string;
  email: string;
  role: UserRole;
  name: string;
  /** Matches users.session_version — bumping it logs every device out. */
  sv: number;
}

export async function createSessionToken(claims: SessionClaims): Promise<string> {
  const days = sessionDays();
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setIssuer('algoladder')
    .setAudience('algoladder-app')
    .setExpirationTime(`${days}d`)
    .sign(secret());
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: sessionDays() * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0 });
}

/**
 * Read the session cookie, verify the signature, then confirm against the
 * database that the user still exists and the token has not been revoked.
 * Returns null rather than throwing, so pages can render a signed-out view.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  let token: string | undefined;
  try {
    token = (await cookies()).get(COOKIE_NAME)?.value;
  } catch {
    return null;
  }
  if (!token) return null;

  let claims: SessionClaims;
  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: 'algoladder',
      audience: 'algoladder-app',
    });
    claims = payload as unknown as SessionClaims;
  } catch {
    return null;
  }

  try {
    const row = await queryOne<{
      id: string;
      email: string;
      role: UserRole;
      session_version: number;
      display_name: string | null;
    }>(
      `SELECT u.id, u.email, u.role, u.session_version, p.display_name
         FROM users u
         LEFT JOIN profiles p ON p.user_id = u.id
        WHERE u.id = $1`,
      [claims.sub],
    );

    if (!row) return null;
    if (row.session_version !== claims.sv) return null; // signed out everywhere

    return {
      id: row.id,
      email: row.email,
      role: row.role,
      displayName: row.display_name || row.email.split('@')[0],
    };
  } catch {
    // Database unreachable — treat as signed out rather than crashing the page.
    return null;
  }
}

/** Use in a server component or action that requires any signed-in user. */
export async function requireUser(redirectTo?: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    const next = redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : '';
    redirect(`/login${next}`);
  }
  return user;
}

/** Use in anything under /admin. Non-admins are sent to the dashboard. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=%2Fadmin');
  if (user.role !== 'admin') redirect('/dashboard?error=admin-only');
  return user;
}

/** Non-redirecting variant for route handlers, which must return a response. */
export async function getApiUser(): Promise<SessionUser | null> {
  return getSessionUser();
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
