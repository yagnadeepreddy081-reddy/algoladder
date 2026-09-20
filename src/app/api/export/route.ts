import { NextResponse } from 'next/server';

import { query } from '@/lib/db';
import { getApiUser } from '@/lib/auth/session';
import { getSubscription } from '@/lib/actions/subscription';
import { canAccessFeature } from '@/lib/premium';

export const dynamic = 'force-dynamic';

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown): string => {
    if (v == null) return '';
    const s = Array.isArray(v) ? v.join('; ') : v instanceof Date ? v.toISOString() : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n');
}

/**
 * GET /api/export?format=json|csv
 *
 * Exports everything this account has produced: progress, notes, bookmarks and
 * revision schedule. Premium feature, and scoped strictly to the caller's own
 * user id — there is no way to ask for somebody else's rows.
 */
export async function GET(request: Request) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const subscription = await getSubscription(user.id);
  if (!canAccessFeature(subscription, user.role)) {
    return NextResponse.json(
      { error: 'Progress export is a Pro feature.', upgrade: '/premium' },
      { status: 402 },
    );
  }

  const format = new URL(request.url).searchParams.get('format') === 'csv' ? 'csv' : 'json';

  const progress = await query<Record<string, unknown>>(
    `SELECT p.overall_no, p.title, t.name AS topic, s.name AS subtopic, p.difficulty,
            p.external_url, pr.status, pr.is_bookmarked, pr.is_starred, pr.in_revision,
            pr.attempts, pr.time_spent_seconds, pr.confidence, pr.solution_url,
            pr.custom_tags, pr.next_review_date, pr.solved_at, pr.updated_at
       FROM user_problem_progress pr
       JOIN problems p  ON p.id = pr.problem_id
       JOIN topics t    ON t.id = p.topic_id
       JOIN subtopics s ON s.id = p.subtopic_id
      WHERE pr.user_id = $1
      ORDER BY p.overall_no`,
    [user.id],
  );

  const stamp = new Date().toISOString().slice(0, 10);

  if (format === 'csv') {
    return new NextResponse(toCsv(progress), {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="algoladder-progress-${stamp}.csv"`,
      },
    });
  }

  const [notes, revisions] = await Promise.all([
    query<Record<string, unknown>>(
      `SELECT p.title AS problem, n.title, n.content, n.code, n.language, n.created_at, n.updated_at
         FROM notes n JOIN problems p ON p.id = n.problem_id
        WHERE n.user_id = $1 ORDER BY n.updated_at DESC`,
      [user.id],
    ),
    query<Record<string, unknown>>(
      `SELECT p.title AS problem, r.due_date, r.interval_days, r.ease, r.review_count, r.lapses
         FROM revision_items r JOIN problems p ON p.id = r.problem_id
        WHERE r.user_id = $1 ORDER BY r.due_date`,
      [user.id],
    ),
  ]);

  return new NextResponse(
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        account: { email: user.email },
        counts: {
          progress: progress.length,
          notes: notes.length,
          revisionItems: revisions.length,
        },
        progress,
        notes,
        revisions,
      },
      null,
      2,
    ),
    {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'content-disposition': `attachment; filename="algoladder-export-${stamp}.json"`,
      },
    },
  );
}
