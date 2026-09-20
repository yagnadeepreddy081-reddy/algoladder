import type { Difficulty, ProblemWithProgress, ProgressStatus } from '@/lib/types';

/**
 * Pure progress arithmetic. No database, no React — so the test suite can
 * assert on it directly, and so the same numbers are produced whether they are
 * rendered on a topic card, the dashboard or the analytics page.
 */

export interface DifficultyBreakdown {
  total: number;
  solved: number;
  inProgress: number;
  needsRevision: number;
  notStarted: number;
}

export interface ProgressSummary {
  total: number;
  solved: number;
  inProgress: number;
  needsRevision: number;
  notStarted: number;
  bookmarked: number;
  percent: number;
  byDifficulty: Record<Difficulty, DifficultyBreakdown>;
}

const emptyBreakdown = (): DifficultyBreakdown => ({
  total: 0,
  solved: 0,
  inProgress: 0,
  needsRevision: 0,
  notStarted: 0,
});

/** Percentage solved, rounded to the nearest whole number, 0 when empty. */
export function percentOf(solved: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.round((solved / total) * 100);
}

/** Same thing but with one decimal, for the big headline figure. */
export function precisePercentOf(solved: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.round((solved / total) * 1000) / 10;
}

export function statusOf(p: { progress: { status: ProgressStatus } | null }): ProgressStatus {
  return p.progress?.status ?? 'not_started';
}

/** Roll a list of problems up into every count the UI needs. */
export function summarise(problems: ProblemWithProgress[]): ProgressSummary {
  const byDifficulty: Record<Difficulty, DifficultyBreakdown> = {
    Easy: emptyBreakdown(),
    Medium: emptyBreakdown(),
    Hard: emptyBreakdown(),
  };

  let solved = 0;
  let inProgress = 0;
  let needsRevision = 0;
  let bookmarked = 0;

  for (const p of problems) {
    const status = statusOf(p);
    const bucket = byDifficulty[p.difficulty] ?? emptyBreakdown();
    bucket.total += 1;

    switch (status) {
      case 'solved':
        solved += 1;
        bucket.solved += 1;
        break;
      case 'in_progress':
        inProgress += 1;
        bucket.inProgress += 1;
        break;
      case 'needs_revision':
        needsRevision += 1;
        bucket.needsRevision += 1;
        break;
      default:
        bucket.notStarted += 1;
    }

    if (p.progress?.isBookmarked) bookmarked += 1;
  }

  const total = problems.length;
  const notStarted = total - solved - inProgress - needsRevision;

  return {
    total,
    solved,
    inProgress,
    needsRevision,
    notStarted,
    bookmarked,
    percent: percentOf(solved, total),
    byDifficulty,
  };
}

/**
 * The next problem to attempt inside a list: the first unsolved one in
 * recommended order, preferring something already started.
 */
export function nextProblem(problems: ProblemWithProgress[]): ProblemWithProgress | null {
  const ordered = [...problems].sort((a, b) => a.recommendedOrder - b.recommendedOrder);
  return (
    ordered.find((p) => statusOf(p) === 'in_progress') ??
    ordered.find((p) => statusOf(p) === 'not_started') ??
    ordered.find((p) => statusOf(p) === 'needs_revision') ??
    null
  );
}

// ------------------------------------------------------------- streaks ---

/** Normalise a Date or ISO string to a YYYY-MM-DD key. */
export function dayKey(value: Date | string): string {
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function addDays(key: string, delta: number): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export interface Streaks {
  current: number;
  longest: number;
}

/**
 * Current and longest daily streak from a set of active days.
 *
 * The current streak counts back from today; a day of inactivity today does
 * not break it until tomorrow, which is the behaviour people expect — you have
 * until the end of the day to keep it alive.
 */
export function computeStreaks(days: Array<Date | string>, today: Date | string = new Date()): Streaks {
  const keys = [...new Set(days.map(dayKey))].sort();
  if (keys.length === 0) return { current: 0, longest: 0 };

  // Longest run of consecutive days anywhere in the history.
  let longest = 1;
  let run = 1;
  for (let i = 1; i < keys.length; i += 1) {
    if (keys[i] === addDays(keys[i - 1], 1)) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  // Current run, anchored on today or yesterday.
  const todayKey = dayKey(today);
  const yesterdayKey = addDays(todayKey, -1);
  const present = new Set(keys);

  let cursor: string;
  if (present.has(todayKey)) cursor = todayKey;
  else if (present.has(yesterdayKey)) cursor = yesterdayKey;
  else return { current: 0, longest };

  let current = 0;
  while (present.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  return { current, longest: Math.max(longest, current) };
}

/** The last `days` calendar days, oldest first, with zero-filled gaps. */
export function weeklyActivity(
  events: Array<{ date: string; solved: number; events: number }>,
  days = 7,
  today: Date | string = new Date(),
): Array<{ date: string; solved: number; events: number; label: string }> {
  const byDate = new Map(events.map((e) => [dayKey(e.date), e]));
  const todayKey = dayKey(today);
  const LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const out: Array<{ date: string; solved: number; events: number; label: string }> = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const key = addDays(todayKey, -i);
    const hit = byDate.get(key);
    out.push({
      date: key,
      solved: hit?.solved ?? 0,
      events: hit?.events ?? 0,
      label: LABELS[new Date(`${key}T00:00:00Z`).getUTCDay()],
    });
  }
  return out;
}

/** Human-readable duration from a seconds count. */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}
