import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getApiUser } from '@/lib/auth/session';
import { execute } from '@/lib/db';
import { LANGUAGE_IDS, type LanguageId } from '@/lib/runner/languages';
import { runCode } from '@/lib/runner/piston';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  problemId: z.string().min(1).max(120).optional(),
  language: z.enum(LANGUAGE_IDS),
  source: z.string().min(1, 'There is nothing to run yet.').max(60_000),
  stdin: z.string().max(20_000).default(''),
});

/* ----------------------------------------------------------- rate limit --- */

/**
 * A deliberately simple per-user throttle. It lives in process memory, which
 * is fine for a single-instance deployment and is only ever a first line of
 * defence — the execution service enforces its own limits underneath.
 */
const MIN_GAP_MS = 1_500;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 25;

interface Bucket {
  last: number;
  window: number;
  count: number;
}

const buckets = new Map<string, Bucket>();

function checkLimit(userId: string): { ok: true } | { ok: false; retryAfter: number; message: string } {
  const now = Date.now();
  const bucket = buckets.get(userId) ?? { last: 0, window: now, count: 0 };

  if (now - bucket.window > WINDOW_MS) {
    bucket.window = now;
    bucket.count = 0;
  }

  if (now - bucket.last < MIN_GAP_MS) {
    return {
      ok: false,
      retryAfter: Math.ceil((MIN_GAP_MS - (now - bucket.last)) / 1000),
      message: 'Give the last run a second to finish before starting another.',
    };
  }

  if (bucket.count >= MAX_PER_WINDOW) {
    return {
      ok: false,
      retryAfter: Math.ceil((WINDOW_MS - (now - bucket.window)) / 1000),
      message: `That is ${MAX_PER_WINDOW} runs in a minute. Take a breath and try again shortly.`,
    };
  }

  bucket.last = now;
  bucket.count += 1;
  buckets.set(userId, bucket);

  // Keep the map from growing without bound on a long-lived process.
  if (buckets.size > 5_000) {
    for (const [key, value] of buckets) {
      if (now - value.window > WINDOW_MS * 5) buckets.delete(key);
    }
  }

  return { ok: true };
}

/* ----------------------------------------------------------------- POST --- */

/**
 * POST /api/run — compile and run a snippet against the given stdin.
 *
 * Nothing here trusts the client beyond the shape of the payload: the code is
 * never evaluated on this server, only forwarded to the sandbox.
 */
export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: 'Log in to run code.' }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const limit = checkLimit(user.id);
  if (!limit.ok) {
    return NextResponse.json(
      { error: limit.message },
      { status: 429, headers: { 'retry-after': String(limit.retryAfter) } },
    );
  }

  const { language, source, stdin, problemId } = parsed.data;
  const result = await runCode({ languageId: language as LanguageId, source, stdin });

  // Best-effort bookkeeping: a failed counter update must never fail a run.
  if (problemId && result.ran) {
    execute(
      `UPDATE user_problem_code
          SET run_count = run_count + 1, last_run_at = now(), updated_at = now()
        WHERE user_id = $1 AND problem_id = $2 AND language = $3`,
      [user.id, problemId, language],
    ).catch(() => {});
  }

  return NextResponse.json(result, { status: result.error ? 502 : 200 });
}
