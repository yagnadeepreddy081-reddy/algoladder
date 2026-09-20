'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { execute, query, queryOne, transaction } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { initialSchedule, schedule, type ReviewGrade } from '@/lib/spaced-repetition';
import { PROGRESS_STATUSES, type ProgressStatus } from '@/lib/types';

export interface ActionResult {
  ok: boolean;
  message?: string;
  error?: string;
}

/**
 * Every progress mutation goes through this: it guarantees a progress row
 * exists for (user, problem) before the caller updates it. The unique
 * constraint on (user_id, problem_id) is what makes ON CONFLICT safe here.
 */
async function ensureProgressRow(userId: string, problemId: string): Promise<void> {
  await execute(
    `INSERT INTO user_problem_progress (user_id, problem_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, problem_id) DO NOTHING`,
    [userId, problemId],
  );
}

async function logActivity(
  userId: string,
  action: string,
  problemId: string | null,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await execute(
    `INSERT INTO activity_logs (user_id, problem_id, action, metadata)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [userId, problemId, action, JSON.stringify(metadata)],
  );
}

function revalidateProblemViews(slug?: string): void {
  revalidatePath('/dashboard');
  revalidatePath('/problems');
  revalidatePath('/topics');
  revalidatePath('/bookmarks');
  revalidatePath('/revision');
  revalidatePath('/analytics');
  if (slug) revalidatePath(`/problems/${slug}`);
}

// ===========================================================================
// Status
// ===========================================================================
export async function setProblemStatusAction(
  problemId: string,
  status: ProgressStatus,
  slug?: string,
): Promise<ActionResult> {
  const user = await requireUser();

  if (!PROGRESS_STATUSES.includes(status)) {
    return { ok: false, error: 'Unknown status' };
  }

  try {
    await transaction(async (client) => {
      await client.query(
        `INSERT INTO user_problem_progress (user_id, problem_id) VALUES ($1, $2)
         ON CONFLICT (user_id, problem_id) DO NOTHING`,
        [user.id, problemId],
      );

      await client.query(
        `UPDATE user_problem_progress
            SET status = $3::progress_status,
                solved_at = CASE
                  WHEN $3 = 'solved' AND solved_at IS NULL THEN now()
                  WHEN $3 <> 'solved' THEN NULL
                  ELSE solved_at END,
                last_attempted_at = now(),
                attempts = CASE WHEN $3 IN ('solved','in_progress') AND attempts = 0 THEN 1 ELSE attempts END,
                in_revision = CASE WHEN $3 = 'needs_revision' THEN true ELSE in_revision END
          WHERE user_id = $1 AND problem_id = $2`,
        [user.id, problemId, status],
      );

      // Marking "needs revision" puts it on the revision schedule immediately.
      if (status === 'needs_revision') {
        const init = initialSchedule();
        await client.query(
          `INSERT INTO revision_items (user_id, problem_id, due_date, interval_days, ease)
           VALUES ($1, $2, CURRENT_DATE, $3, $4)
           ON CONFLICT (user_id, problem_id) DO UPDATE SET due_date = CURRENT_DATE`,
          [user.id, problemId, init.intervalDays, init.ease],
        );
      }

      await client.query(
        `INSERT INTO activity_logs (user_id, problem_id, action, metadata)
         VALUES ($1, $2, $3, $4::jsonb)`,
        [
          user.id,
          problemId,
          status === 'solved' ? 'solved' : status === 'in_progress' ? 'attempted' : 'status_changed',
          JSON.stringify({ status }),
        ],
      );
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not save your progress' };
  }

  revalidateProblemViews(slug);
  return { ok: true, message: statusMessage(status) };
}

function statusMessage(status: ProgressStatus): string {
  switch (status) {
    case 'solved':
      return 'Marked as solved';
    case 'in_progress':
      return 'Marked as in progress';
    case 'needs_revision':
      return 'Added to your revision list';
    default:
      return 'Reset to not started';
  }
}

// ===========================================================================
// Bookmark / star / revision toggles
// ===========================================================================
export async function toggleBookmarkAction(
  problemId: string,
  slug?: string,
): Promise<ActionResult & { bookmarked?: boolean }> {
  const user = await requireUser();
  await ensureProgressRow(user.id, problemId);

  const row = await queryOne<{ is_bookmarked: boolean }>(
    `UPDATE user_problem_progress SET is_bookmarked = NOT is_bookmarked
      WHERE user_id = $1 AND problem_id = $2
      RETURNING is_bookmarked`,
    [user.id, problemId],
  );
  const bookmarked = Boolean(row?.is_bookmarked);

  // Keep the dedicated bookmarks table in step, so it stays queryable on its own.
  if (bookmarked) {
    await execute(
      `INSERT INTO bookmarks (user_id, problem_id) VALUES ($1, $2)
       ON CONFLICT (user_id, problem_id) DO NOTHING`,
      [user.id, problemId],
    );
  } else {
    await execute('DELETE FROM bookmarks WHERE user_id = $1 AND problem_id = $2', [
      user.id,
      problemId,
    ]);
  }

  await logActivity(user.id, bookmarked ? 'bookmarked' : 'unbookmarked', problemId);
  revalidateProblemViews(slug);
  return { ok: true, bookmarked, message: bookmarked ? 'Bookmarked' : 'Bookmark removed' };
}

export async function toggleStarAction(
  problemId: string,
  slug?: string,
): Promise<ActionResult & { starred?: boolean }> {
  const user = await requireUser();
  await ensureProgressRow(user.id, problemId);

  const row = await queryOne<{ is_starred: boolean }>(
    `UPDATE user_problem_progress SET is_starred = NOT is_starred
      WHERE user_id = $1 AND problem_id = $2
      RETURNING is_starred`,
    [user.id, problemId],
  );
  revalidateProblemViews(slug);
  return {
    ok: true,
    starred: Boolean(row?.is_starred),
    message: row?.is_starred ? 'Starred' : 'Star removed',
  };
}

export async function toggleRevisionAction(
  problemId: string,
  slug?: string,
): Promise<ActionResult & { inRevision?: boolean }> {
  const user = await requireUser();
  await ensureProgressRow(user.id, problemId);

  const row = await queryOne<{ in_revision: boolean }>(
    `UPDATE user_problem_progress SET in_revision = NOT in_revision
      WHERE user_id = $1 AND problem_id = $2
      RETURNING in_revision`,
    [user.id, problemId],
  );
  const inRevision = Boolean(row?.in_revision);

  if (inRevision) {
    const init = initialSchedule();
    await execute(
      `INSERT INTO revision_items (user_id, problem_id, due_date, interval_days, ease)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, problem_id) DO NOTHING`,
      [user.id, problemId, init.dueDate, init.intervalDays, init.ease],
    );
  } else {
    await execute('DELETE FROM revision_items WHERE user_id = $1 AND problem_id = $2', [
      user.id,
      problemId,
    ]);
    await execute(
      'UPDATE user_problem_progress SET next_review_date = NULL WHERE user_id = $1 AND problem_id = $2',
      [user.id, problemId],
    );
  }

  revalidateProblemViews(slug);
  return {
    ok: true,
    inRevision,
    message: inRevision ? 'Added to revision' : 'Removed from revision',
  };
}

// ===========================================================================
// Attempts, time spent, confidence, solution link, custom tags
// ===========================================================================
export async function recordAttemptAction(
  problemId: string,
  slug?: string,
): Promise<ActionResult & { attempts?: number }> {
  const user = await requireUser();
  await ensureProgressRow(user.id, problemId);

  const row = await queryOne<{ attempts: number }>(
    `UPDATE user_problem_progress
        SET attempts = attempts + 1,
            last_attempted_at = now(),
            status = CASE WHEN status = 'not_started' THEN 'in_progress' ELSE status END
      WHERE user_id = $1 AND problem_id = $2
      RETURNING attempts`,
    [user.id, problemId],
  );

  await logActivity(user.id, 'attempted', problemId, { attempts: row?.attempts });
  revalidateProblemViews(slug);
  return { ok: true, attempts: row?.attempts, message: 'Attempt recorded' };
}

const timeSchema = z.coerce.number().int().min(0).max(24 * 60);

export async function addTimeSpentAction(
  problemId: string,
  minutes: number,
  slug?: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = timeSchema.safeParse(minutes);
  if (!parsed.success) return { ok: false, error: 'Enter a number of minutes between 0 and 1440' };

  await ensureProgressRow(user.id, problemId);
  await execute(
    `UPDATE user_problem_progress
        SET time_spent_seconds = time_spent_seconds + $3, last_attempted_at = now()
      WHERE user_id = $1 AND problem_id = $2`,
    [user.id, problemId, parsed.data * 60],
  );
  revalidateProblemViews(slug);
  return { ok: true, message: `Logged ${parsed.data} minutes` };
}

export async function setConfidenceAction(
  problemId: string,
  confidence: number | null,
  slug?: string,
): Promise<ActionResult> {
  const user = await requireUser();
  if (confidence != null && (confidence < 1 || confidence > 5)) {
    return { ok: false, error: 'Confidence must be between 1 and 5' };
  }
  await ensureProgressRow(user.id, problemId);
  await execute(
    'UPDATE user_problem_progress SET confidence = $3 WHERE user_id = $1 AND problem_id = $2',
    [user.id, problemId, confidence],
  );
  revalidateProblemViews(slug);
  return { ok: true };
}

const urlSchema = z.union([z.literal(''), z.string().trim().url('Enter a valid URL')]);

export async function setSolutionUrlAction(
  problemId: string,
  url: string,
  slug?: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = urlSchema.safeParse(url);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  await ensureProgressRow(user.id, problemId);
  await execute(
    'UPDATE user_problem_progress SET solution_url = $3 WHERE user_id = $1 AND problem_id = $2',
    [user.id, problemId, parsed.data === '' ? null : parsed.data],
  );
  revalidateProblemViews(slug);
  return { ok: true, message: parsed.data ? 'Solution link saved' : 'Solution link removed' };
}

export async function setCustomTagsAction(
  problemId: string,
  tagsRaw: string,
  slug?: string,
): Promise<ActionResult & { tags?: string[] }> {
  const user = await requireUser();
  const tags = [
    ...new Set(
      tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 20)
        .map((t) => t.slice(0, 40)),
    ),
  ];

  await ensureProgressRow(user.id, problemId);
  await execute(
    'UPDATE user_problem_progress SET custom_tags = $3::text[] WHERE user_id = $1 AND problem_id = $2',
    [user.id, problemId, tags],
  );
  revalidateProblemViews(slug);
  return { ok: true, tags, message: 'Tags saved' };
}

export async function setReviewDateAction(
  problemId: string,
  date: string,
  slug?: string,
): Promise<ActionResult> {
  const user = await requireUser();
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, error: 'Use a YYYY-MM-DD date' };
  }

  await ensureProgressRow(user.id, problemId);
  await execute(
    'UPDATE user_problem_progress SET next_review_date = $3, in_revision = $4 WHERE user_id = $1 AND problem_id = $2',
    [user.id, problemId, date || null, Boolean(date)],
  );

  if (date) {
    const init = initialSchedule();
    await execute(
      `INSERT INTO revision_items (user_id, problem_id, due_date, interval_days, ease)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, problem_id) DO UPDATE SET due_date = EXCLUDED.due_date`,
      [user.id, problemId, date, init.intervalDays, init.ease],
    );
  }

  revalidateProblemViews(slug);
  return { ok: true, message: date ? `Review scheduled for ${date}` : 'Review date cleared' };
}

// ===========================================================================
// Revision review
// ===========================================================================
export async function reviewProblemAction(
  problemId: string,
  grade: ReviewGrade,
): Promise<ActionResult & { dueDate?: string }> {
  const user = await requireUser();

  const current = await queryOne<{
    interval_days: number;
    ease: string;
    review_count: number;
    lapses: number;
  }>(
    'SELECT interval_days, ease, review_count, lapses FROM revision_items WHERE user_id = $1 AND problem_id = $2',
    [user.id, problemId],
  );

  const state = current
    ? {
        intervalDays: current.interval_days,
        ease: Number(current.ease),
        reviewCount: current.review_count,
        lapses: current.lapses,
      }
    : { intervalDays: 1, ease: 2.5, reviewCount: 0, lapses: 0 };

  const next = schedule(state, grade);

  await transaction(async (client) => {
    await client.query(
      `INSERT INTO revision_items
         (user_id, problem_id, due_date, interval_days, ease, review_count, lapses, last_reviewed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7, now())
       ON CONFLICT (user_id, problem_id) DO UPDATE SET
         due_date = EXCLUDED.due_date,
         interval_days = EXCLUDED.interval_days,
         ease = EXCLUDED.ease,
         review_count = EXCLUDED.review_count,
         lapses = EXCLUDED.lapses,
         last_reviewed_at = now()`,
      [user.id, problemId, next.dueDate, next.intervalDays, next.ease, next.reviewCount, next.lapses],
    );

    await client.query(
      `INSERT INTO user_problem_progress (user_id, problem_id) VALUES ($1,$2)
       ON CONFLICT (user_id, problem_id) DO NOTHING`,
      [user.id, problemId],
    );

    await client.query(
      `UPDATE user_problem_progress
          SET next_review_date = $3,
              in_revision = true,
              status = CASE WHEN $4 = 'again' THEN 'needs_revision'::progress_status
                            WHEN status = 'needs_revision' THEN 'solved'::progress_status
                            ELSE status END,
              solved_at = CASE WHEN $4 <> 'again' AND solved_at IS NULL THEN now() ELSE solved_at END
        WHERE user_id = $1 AND problem_id = $2`,
      [user.id, problemId, next.dueDate, grade],
    );

    await client.query(
      `INSERT INTO activity_logs (user_id, problem_id, action, metadata)
       VALUES ($1, $2, 'reviewed', $3::jsonb)`,
      [user.id, problemId, JSON.stringify({ grade, dueDate: next.dueDate })],
    );
  });

  revalidateProblemViews();
  return { ok: true, dueDate: next.dueDate, message: `Next review ${next.dueDate}` };
}

// ===========================================================================
// Bulk reset (used from settings)
// ===========================================================================
export async function resetAllProgressAction(): Promise<ActionResult> {
  const user = await requireUser();
  await transaction(async (client) => {
    await client.query('DELETE FROM user_problem_progress WHERE user_id = $1', [user.id]);
    await client.query('DELETE FROM revision_items WHERE user_id = $1', [user.id]);
    await client.query('DELETE FROM bookmarks WHERE user_id = $1', [user.id]);
    await client.query(
      `INSERT INTO activity_logs (user_id, action, metadata) VALUES ($1, 'progress_reset', '{}'::jsonb)`,
      [user.id],
    );
  });
  revalidateProblemViews();
  return { ok: true, message: 'All progress cleared.' };
}

/** Used by the export feature and the tests. */
export async function getAllProgressForUser(userId: string) {
  return query(
    `SELECT pr.*, p.title, p.slug, p.difficulty, t.name AS topic_name
       FROM user_problem_progress pr
       JOIN problems p ON p.id = pr.problem_id
       JOIN topics t   ON t.id = p.topic_id
      WHERE pr.user_id = $1
      ORDER BY p.recommended_order`,
    [userId],
  );
}
