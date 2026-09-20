import 'server-only';

import { query, queryOne } from '@/lib/db';
import { mapProblem, mapProgress } from '@/lib/data/mappers';
import { computeStreaks, percentOf, weeklyActivity } from '@/lib/progress';
import type {
  ActivityEntry,
  DashboardStats,
  Difficulty,
  ProblemWithProgress,
  TopicProgressRow,
} from '@/lib/types';

/**
 * Everything the dashboard and analytics pages show. Every figure here is read
 * from the database for the signed-in user — nothing is faked or hard-coded.
 */

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const [totals, difficulty, activeDays, weekly, dueCount] = await Promise.all([
    queryOne<{
      total: number;
      solved: number;
      in_progress: number;
      needs_revision: number;
      bookmarked: number;
    }>(
      `SELECT
         (SELECT count(*) FROM problems WHERE is_active)::int                          AS total,
         count(*) FILTER (WHERE pr.status = 'solved')::int                             AS solved,
         count(*) FILTER (WHERE pr.status = 'in_progress')::int                        AS in_progress,
         count(*) FILTER (WHERE pr.status = 'needs_revision')::int                     AS needs_revision,
         count(*) FILTER (WHERE pr.is_bookmarked)::int                                 AS bookmarked
       FROM user_problem_progress pr
       JOIN problems p ON p.id = pr.problem_id AND p.is_active
      WHERE pr.user_id = $1`,
      [userId],
    ),

    query<{ difficulty: Difficulty; total: number; solved: number }>(
      `SELECT p.difficulty,
              count(*)::int AS total,
              count(*) FILTER (WHERE pr.status = 'solved')::int AS solved
         FROM problems p
         LEFT JOIN user_problem_progress pr ON pr.problem_id = p.id AND pr.user_id = $1
        WHERE p.is_active
        GROUP BY p.difficulty`,
      [userId],
    ),

    query<{ activity_date: string }>(
      `SELECT DISTINCT (created_at AT TIME ZONE 'UTC')::date::text AS activity_date
         FROM activity_logs
        WHERE user_id = $1 AND action IN ('solved', 'attempted', 'reviewed')
        ORDER BY activity_date`,
      [userId],
    ),

    query<{ date: string; solved: number; events: number }>(
      `SELECT (created_at AT TIME ZONE 'UTC')::date::text                AS date,
              count(*) FILTER (WHERE action = 'solved')::int             AS solved,
              count(*)::int                                              AS events
         FROM activity_logs
        WHERE user_id = $1
          AND created_at >= now() - interval '7 days'
        GROUP BY 1 ORDER BY 1`,
      [userId],
    ),

    queryOne<{ n: number }>(
      `SELECT count(*)::int AS n FROM revision_items
        WHERE user_id = $1 AND due_date <= CURRENT_DATE`,
      [userId],
    ),
  ]);

  const byDifficulty: Record<Difficulty, { total: number; solved: number }> = {
    Easy: { total: 0, solved: 0 },
    Medium: { total: 0, solved: 0 },
    Hard: { total: 0, solved: 0 },
  };
  for (const d of difficulty) {
    byDifficulty[d.difficulty] = { total: d.total, solved: d.solved };
  }

  const totalProblems = totals?.total ?? 0;
  const solved = totals?.solved ?? 0;
  const inProgress = totals?.in_progress ?? 0;
  const needsRevision = totals?.needs_revision ?? 0;

  const streaks = computeStreaks(activeDays.map((d) => d.activity_date));
  const week = weeklyActivity(weekly);

  return {
    totalProblems,
    solved,
    inProgress,
    needsRevision,
    notStarted: Math.max(0, totalProblems - solved - inProgress - needsRevision),
    bookmarked: totals?.bookmarked ?? 0,
    completionPercent: percentOf(solved, totalProblems),
    byDifficulty,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    solvedThisWeek: week.reduce((sum, d) => sum + d.solved, 0),
    weeklyActivity: week,
    dueForRevision: dueCount?.n ?? 0,
  };
}

export async function getTopicProgress(userId: string): Promise<TopicProgressRow[]> {
  const rows = await query<Record<string, string | number>>(
    `SELECT
       t.id   AS topic_id,
       t.slug AS topic_slug,
       t.name AS topic_name,
       t.position AS topic_position,
       count(p.id)::int                                                            AS total,
       count(*) FILTER (WHERE pr.status = 'solved')::int                           AS solved,
       count(*) FILTER (WHERE pr.status = 'in_progress')::int                      AS in_progress,
       count(*) FILTER (WHERE pr.status = 'needs_revision')::int                   AS needs_revision,
       count(*) FILTER (WHERE p.difficulty = 'Easy')::int                          AS easy_total,
       count(*) FILTER (WHERE p.difficulty = 'Easy'   AND pr.status = 'solved')::int  AS easy_solved,
       count(*) FILTER (WHERE p.difficulty = 'Medium')::int                        AS medium_total,
       count(*) FILTER (WHERE p.difficulty = 'Medium' AND pr.status = 'solved')::int  AS medium_solved,
       count(*) FILTER (WHERE p.difficulty = 'Hard')::int                          AS hard_total,
       count(*) FILTER (WHERE p.difficulty = 'Hard'   AND pr.status = 'solved')::int  AS hard_solved
     FROM topics t
     JOIN problems p ON p.topic_id = t.id AND p.is_active
     LEFT JOIN user_problem_progress pr ON pr.problem_id = p.id AND pr.user_id = $1
     GROUP BY t.id, t.slug, t.name, t.position
     ORDER BY t.position`,
    [userId],
  );

  return rows.map((r) => ({
    topicId: String(r.topic_id),
    topicSlug: String(r.topic_slug),
    topicName: String(r.topic_name),
    topicPosition: Number(r.topic_position),
    total: Number(r.total),
    solved: Number(r.solved),
    inProgress: Number(r.in_progress),
    needsRevision: Number(r.needs_revision),
    easyTotal: Number(r.easy_total),
    easySolved: Number(r.easy_solved),
    mediumTotal: Number(r.medium_total),
    mediumSolved: Number(r.medium_solved),
    hardTotal: Number(r.hard_total),
    hardSolved: Number(r.hard_solved),
  }));
}

export async function getRecentActivity(userId: string, limit = 12): Promise<ActivityEntry[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT a.id::text, a.action, a.problem_id, a.metadata, a.created_at,
            p.title AS problem_title, p.slug AS problem_slug
       FROM activity_logs a
       LEFT JOIN problems p ON p.id = a.problem_id
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC
      LIMIT $2`,
    [userId, Math.min(100, limit)],
  );

  return rows.map((r) => ({
    id: String(r.id),
    action: String(r.action),
    problemId: (r.problem_id as string | null) ?? null,
    problemTitle: (r.problem_title as string | null) ?? null,
    problemSlug: (r.problem_slug as string | null) ?? null,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
  }));
}

const PROBLEM_SELECT = `
  SELECT p.*, t.slug AS topic_slug, t.name AS topic_name,
         s.slug AS subtopic_slug, s.name AS subtopic_name,
         pr.status AS progress_status, pr.is_bookmarked, pr.is_starred, pr.in_revision,
         pr.attempts, pr.time_spent_seconds, pr.confidence, pr.solution_url,
         pr.custom_tags, pr.next_review_date, pr.last_attempted_at, pr.solved_at
    FROM problems p
    JOIN topics t    ON t.id = p.topic_id
    JOIN subtopics s ON s.id = p.subtopic_id
    LEFT JOIN user_problem_progress pr ON pr.problem_id = p.id AND pr.user_id = $1
`;

const attach = (row: Record<string, unknown>): ProblemWithProgress => ({
  ...mapProblem(row),
  progress: mapProgress(row),
});

/** "Continue where you left off" — the most recent thing still in progress. */
export async function getContinueProblem(userId: string): Promise<ProblemWithProgress | null> {
  const row = await queryOne(
    `${PROBLEM_SELECT}
      WHERE p.is_active AND pr.status = 'in_progress'
      ORDER BY pr.last_attempted_at DESC NULLS LAST
      LIMIT 1`,
    [userId],
  );
  return row ? attach(row) : null;
}

/**
 * "Recommended next": the first unstarted problem in recommended order,
 * preferring the topic the user is already partway through so they finish
 * something rather than scattering.
 */
export async function getRecommendedProblem(userId: string): Promise<ProblemWithProgress | null> {
  const inFlight = await queryOne<{ topic_id: string }>(
    `SELECT p.topic_id
       FROM user_problem_progress pr
       JOIN problems p ON p.id = pr.problem_id
      WHERE pr.user_id = $1 AND pr.status = 'solved'
      GROUP BY p.topic_id
      ORDER BY max(pr.solved_at) DESC
      LIMIT 1`,
    [userId],
  );

  if (inFlight) {
    const sameTopic = await queryOne(
      `${PROBLEM_SELECT}
        WHERE p.is_active AND p.topic_id = $2
          AND (pr.status IS NULL OR pr.status = 'not_started')
        ORDER BY p.recommended_order ASC LIMIT 1`,
      [userId, inFlight.topic_id],
    );
    if (sameTopic) return attach(sameTopic);
  }

  const anywhere = await queryOne(
    `${PROBLEM_SELECT}
      WHERE p.is_active AND (pr.status IS NULL OR pr.status = 'not_started')
      ORDER BY p.recommended_order ASC LIMIT 1`,
    [userId],
  );
  return anywhere ? attach(anywhere) : null;
}

/** Revision problems due today or overdue. */
export async function getDueRevisions(
  userId: string,
  limit = 50,
): Promise<Array<ProblemWithProgress & { dueDate: string; intervalDays: number; reviewCount: number }>> {
  const rows = await query<Record<string, unknown>>(
    `SELECT p.*, t.slug AS topic_slug, t.name AS topic_name,
            s.slug AS subtopic_slug, s.name AS subtopic_name,
            pr.status AS progress_status, pr.is_bookmarked, pr.is_starred, pr.in_revision,
            pr.attempts, pr.time_spent_seconds, pr.confidence, pr.solution_url,
            pr.custom_tags, pr.next_review_date, pr.last_attempted_at, pr.solved_at,
            ri.due_date::text AS due_date, ri.interval_days, ri.review_count
       FROM revision_items ri
       JOIN problems p  ON p.id = ri.problem_id AND p.is_active
       JOIN topics t    ON t.id = p.topic_id
       JOIN subtopics s ON s.id = p.subtopic_id
       LEFT JOIN user_problem_progress pr ON pr.problem_id = p.id AND pr.user_id = $1
      WHERE ri.user_id = $1 AND ri.due_date <= CURRENT_DATE
      ORDER BY ri.due_date ASC, p.recommended_order ASC
      LIMIT $2`,
    [userId, Math.min(200, limit)],
  );

  return rows.map((r) => ({
    ...attach(r),
    dueDate: String(r.due_date),
    intervalDays: Number(r.interval_days),
    reviewCount: Number(r.review_count),
  }));
}

/** Everything on the revision list, due or not. */
export async function getAllRevisions(
  userId: string,
): Promise<Array<ProblemWithProgress & { dueDate: string; intervalDays: number; reviewCount: number; ease: number }>> {
  const rows = await query<Record<string, unknown>>(
    `SELECT p.*, t.slug AS topic_slug, t.name AS topic_name,
            s.slug AS subtopic_slug, s.name AS subtopic_name,
            pr.status AS progress_status, pr.is_bookmarked, pr.is_starred, pr.in_revision,
            pr.attempts, pr.time_spent_seconds, pr.confidence, pr.solution_url,
            pr.custom_tags, pr.next_review_date, pr.last_attempted_at, pr.solved_at,
            ri.due_date::text AS due_date, ri.interval_days, ri.review_count, ri.ease
       FROM revision_items ri
       JOIN problems p  ON p.id = ri.problem_id AND p.is_active
       JOIN topics t    ON t.id = p.topic_id
       JOIN subtopics s ON s.id = p.subtopic_id
       LEFT JOIN user_problem_progress pr ON pr.problem_id = p.id AND pr.user_id = $1
      WHERE ri.user_id = $1
      ORDER BY ri.due_date ASC, p.recommended_order ASC`,
    [userId],
  );

  return rows.map((r) => ({
    ...attach(r),
    dueDate: String(r.due_date),
    intervalDays: Number(r.interval_days),
    reviewCount: Number(r.review_count),
    ease: Number(r.ease),
  }));
}

export async function getBookmarkedProblems(userId: string): Promise<ProblemWithProgress[]> {
  const rows = await query(
    `${PROBLEM_SELECT}
      WHERE p.is_active AND pr.is_bookmarked
      ORDER BY p.recommended_order ASC`,
    [userId],
  );
  return rows.map(attach);
}

// ------------------------------------------------------------- analytics ---

export interface AnalyticsData {
  daily: { date: string; solved: number; events: number }[];
  byPattern: { pattern: string; total: number; solved: number }[];
  byPlatform: { platform: string; total: number; solved: number }[];
  timeByTopic: { topic: string; minutes: number }[];
  hardestTopics: { topic: string; percent: number; solved: number; total: number }[];
  totalTimeSeconds: number;
  totalAttempts: number;
  avgAttemptsPerSolve: number;
}

export async function getAnalytics(userId: string, days = 90): Promise<AnalyticsData> {
  const [daily, byPattern, byPlatform, timeByTopic, totals] = await Promise.all([
    query<{ date: string; solved: number; events: number }>(
      `SELECT (created_at AT TIME ZONE 'UTC')::date::text AS date,
              count(*) FILTER (WHERE action = 'solved')::int AS solved,
              count(*)::int AS events
         FROM activity_logs
        WHERE user_id = $1 AND created_at >= now() - ($2 || ' days')::interval
        GROUP BY 1 ORDER BY 1`,
      [userId, String(days)],
    ),
    query<{ pattern: string; total: number; solved: number }>(
      `SELECT COALESCE(NULLIF(p.pattern_family, ''), 'Other') AS pattern,
              count(*)::int AS total,
              count(*) FILTER (WHERE pr.status = 'solved')::int AS solved
         FROM problems p
         LEFT JOIN user_problem_progress pr ON pr.problem_id = p.id AND pr.user_id = $1
        WHERE p.is_active
        GROUP BY 1 ORDER BY 3 DESC, 1`,
      [userId],
    ),
    query<{ platform: string; total: number; solved: number }>(
      `SELECT p.platform,
              count(*)::int AS total,
              count(*) FILTER (WHERE pr.status = 'solved')::int AS solved
         FROM problems p
         LEFT JOIN user_problem_progress pr ON pr.problem_id = p.id AND pr.user_id = $1
        WHERE p.is_active
        GROUP BY 1 ORDER BY 2 DESC`,
      [userId],
    ),
    query<{ topic: string; minutes: number }>(
      `SELECT t.name AS topic, (sum(pr.time_spent_seconds) / 60)::int AS minutes
         FROM user_problem_progress pr
         JOIN problems p ON p.id = pr.problem_id
         JOIN topics t   ON t.id = p.topic_id
        WHERE pr.user_id = $1 AND pr.time_spent_seconds > 0
        GROUP BY t.name, t.position ORDER BY t.position`,
      [userId],
    ),
    queryOne<{ seconds: number; attempts: number; solves: number }>(
      `SELECT COALESCE(sum(time_spent_seconds), 0)::int AS seconds,
              COALESCE(sum(attempts), 0)::int           AS attempts,
              count(*) FILTER (WHERE status = 'solved')::int AS solves
         FROM user_problem_progress WHERE user_id = $1`,
      [userId],
    ),
  ]);

  const topicRows = await getTopicProgress(userId);
  const hardestTopics = topicRows
    .map((t) => ({
      topic: t.topicName,
      percent: percentOf(t.solved, t.total),
      solved: t.solved,
      total: t.total,
    }))
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 6);

  const solves = totals?.solves ?? 0;
  const attempts = totals?.attempts ?? 0;

  return {
    daily,
    byPattern,
    byPlatform,
    timeByTopic,
    hardestTopics,
    totalTimeSeconds: totals?.seconds ?? 0,
    totalAttempts: attempts,
    avgAttemptsPerSolve: solves ? Math.round((attempts / solves) * 10) / 10 : 0,
  };
}
