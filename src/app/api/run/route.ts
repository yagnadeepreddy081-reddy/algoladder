import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getApiUser } from '@/lib/auth/session';
import { execute } from '@/lib/db';
import { LANGUAGE_IDS, type LanguageId } from '@/lib/runner/languages';
import { outputMatches, runCode, type RunResult } from '@/lib/runner/sandbox';
import { executionSucceeded } from '@/lib/runner/grading';
import { getTestCases } from '@/lib/data/test-cases';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  problemId: z.string().min(1).max(120).optional(),
  language: z.enum(LANGUAGE_IDS),
  source: z.string().min(1, 'There is nothing to run yet.').max(60_000),
  stdin: z.string().max(20_000).default(''),
  /** 'run' uses the user's own input; 'submit' grades against stored cases. */
  mode: z.enum(['run', 'submit']).default('run'),
});

/** Grading never runs more than this many cases, however many are stored. */
const MAX_CASES = 8;
/** How many cases to have in flight at once, to stay polite to the service. */
const CONCURRENCY = 3;

export interface CaseResult {
  index: number;
  hidden: boolean;
  passed: boolean;
  input?: string;
  expected?: string;
  actual: string;
  stderr: string;
  timedOut: boolean;
  wallTimeMs: number;
}

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

/* -------------------------------------------------------- submissions --- */

type Verdict = 'accepted' | 'wrong_answer' | 'compile_error' | 'runtime_error' | 'timed_out';

/**
 * Reduce a set of case results to one verdict. Order matters: a run that never
 * finished is reported as a timeout rather than a wrong answer, because the two
 * call for completely different advice.
 */
function verdictFor(cases: CaseResult[]): Verdict {
  if (cases.length > 0 && cases.every((c) => c.passed)) return 'accepted';
  if (cases.some((c) => c.timedOut)) return 'timed_out';
  if (cases.some((c) => !c.passed && c.stderr.trim())) return 'runtime_error';
  return 'wrong_answer';
}

/**
 * Append one row to `submissions`. Best-effort by design: a student's submit
 * must never fail because the history write did, exactly like the draft
 * counter above.
 *
 * `attempt_no` and `solved_before` are computed inside the statement so the
 * count cannot drift between a separate SELECT and this INSERT.
 */
function recordSubmission(params: {
  userId: string;
  problemId: string;
  language: string;
  verdict: Verdict;
  casesPassed: number;
  casesTotal: number;
  wallTimeMs: number;
  source: string;
}): void {
  execute(
    `INSERT INTO submissions
       (user_id, problem_id, language, verdict, cases_passed, cases_total,
        wall_time_ms, source, attempt_no, solved_before)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8,
       (SELECT count(*) + 1 FROM submissions WHERE user_id = $1 AND problem_id = $2),
       COALESCE((SELECT status = 'solved' FROM user_problem_progress
                  WHERE user_id = $1 AND problem_id = $2), false))`,
    [
      params.userId,
      params.problemId,
      params.language,
      params.verdict,
      params.casesPassed,
      params.casesTotal,
      Math.round(params.wallTimeMs),
      params.source,
    ],
  ).catch(() => {});
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

  const { language, source, stdin, problemId, mode } = parsed.data;

  /* ------------------------------------------------------------ submit --- */

  if (mode === 'submit') {
    if (!problemId) {
      return NextResponse.json({ error: 'No problem to grade against.' }, { status: 400 });
    }

    const cases = (await getTestCases(problemId)).slice(0, MAX_CASES);
    if (cases.length === 0) {
      return NextResponse.json(
        { error: 'This problem does not have test cases yet — use Run with your own input.' },
        { status: 409 },
      );
    }

    const run = (input: string) =>
      runCode({ languageId: language as LanguageId, source, stdin: input });

    // Compile errors are identical for every case, so pay for one run first
    // and bail out before spending the rest of the budget on the same failure.
    const first = await run(cases[0].input);
    if (first.error) return NextResponse.json(first, { status: 502 });
    if (first.compileOutput.trim() && !first.ran) {
      recordSubmission({
        userId: user.id,
        problemId,
        language,
        verdict: 'compile_error',
        casesPassed: 0,
        casesTotal: cases.length,
        wallTimeMs: first.wallTimeMs,
        source,
      });
      return NextResponse.json(
        { mode: 'submit', compileOutput: first.compileOutput, cases: [], passed: 0, total: cases.length },
        { status: 200 },
      );
    }

    const results: RunResult[] = [first];
    for (let i = 1; i < cases.length; i += CONCURRENCY) {
      const slice = cases.slice(i, i + CONCURRENCY);
      results.push(...(await Promise.all(slice.map((c) => run(c.input)))));
    }

    const failedService = results.find(r => r.error);
    if (failedService) return NextResponse.json(failedService, { status: 502 });

    const caseResults: CaseResult[] = cases.map((c, i) => {
      const r = results[i];
      const passed = executionSucceeded(r) && outputMatches(r.stdout, c.expected);
      return {
        index: i + 1,
        hidden: Boolean(c.hidden),
        passed,
        input: c.hidden ? undefined : c.input,
        expected: c.hidden ? undefined : c.expected,
        actual: c.hidden ? '' : (r?.stdout ?? ''),
        stderr: c.hidden ? '' : (r?.stderr ?? ''),
        timedOut: Boolean(r?.timedOut),
        wallTimeMs: r?.wallTimeMs ?? 0,
      };
    });

    const passedCount = caseResults.filter((c) => c.passed).length;
    const totalWallTimeMs = results.reduce((n, r) => n + (r?.wallTimeMs ?? 0), 0);

    recordSubmission({
      userId: user.id,
      problemId,
      language,
      verdict: verdictFor(caseResults),
      casesPassed: passedCount,
      casesTotal: caseResults.length,
      wallTimeMs: totalWallTimeMs,
      source,
    });

    if (problemId) {
      execute(
        `UPDATE user_problem_code
            SET run_count = run_count + 1, last_run_at = now(), updated_at = now()
          WHERE user_id = $1 AND problem_id = $2 AND language = $3`,
        [user.id, problemId, language],
      ).catch(() => {});
    }

    return NextResponse.json({
      mode: 'submit',
      cases: caseResults,
      passed: passedCount,
      total: caseResults.length,
      compileOutput: '',
      wallTimeMs: totalWallTimeMs,
    });
  }

  /* --------------------------------------------------------------- run --- */

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

