/**
 * A small SM-2-flavoured scheduler for the revision list.
 *
 * You grade a review on a four-point scale, and the interval to the next one
 * grows or collapses accordingly. Deliberately simple: the point is to stop you
 * re-reading the problems you already know while dragging the shaky ones back
 * in front of you.
 */

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';

export const REVIEW_GRADES: { value: ReviewGrade; label: string; hint: string }[] = [
  { value: 'again', label: 'Again', hint: 'Could not solve it — show me tomorrow' },
  { value: 'hard', label: 'Hard', hint: 'Solved it, but it was a struggle' },
  { value: 'good', label: 'Good', hint: 'Solved it at a normal pace' },
  { value: 'easy', label: 'Easy', hint: 'Straight away — push this far out' },
];

export interface SchedulerState {
  intervalDays: number;
  ease: number;
  reviewCount: number;
  lapses: number;
}

export interface SchedulerResult extends SchedulerState {
  dueDate: string;
}

const MIN_EASE = 1.3;
const MAX_INTERVAL = 365;

const EASE_DELTA: Record<ReviewGrade, number> = {
  again: -0.2,
  hard: -0.15,
  good: 0,
  easy: 0.15,
};

function clampEase(ease: number): number {
  return Math.max(MIN_EASE, Math.min(3.0, Math.round(ease * 100) / 100));
}

export function addDaysISO(days: number, from: Date | string = new Date()): string {
  const base = typeof from === 'string' ? new Date(`${from.slice(0, 10)}T00:00:00Z`) : from;
  const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Given the current schedule and a grade, work out the next one. */
export function schedule(
  state: SchedulerState,
  grade: ReviewGrade,
  today: Date | string = new Date(),
): SchedulerResult {
  const ease = clampEase(state.ease + EASE_DELTA[grade]);
  let intervalDays: number;
  let lapses = state.lapses;

  if (grade === 'again') {
    // Reset — you did not have it. Back tomorrow.
    intervalDays = 1;
    lapses += 1;
  } else if (state.reviewCount === 0) {
    intervalDays = grade === 'easy' ? 4 : grade === 'good' ? 2 : 1;
  } else if (state.reviewCount === 1) {
    intervalDays = grade === 'easy' ? 10 : grade === 'good' ? 6 : 3;
  } else {
    const multiplier = grade === 'hard' ? 1.2 : ease;
    intervalDays = Math.round(state.intervalDays * multiplier);
    if (grade === 'easy') intervalDays = Math.round(intervalDays * 1.3);
  }

  intervalDays = Math.max(1, Math.min(MAX_INTERVAL, intervalDays));

  return {
    intervalDays,
    ease,
    reviewCount: state.reviewCount + 1,
    lapses,
    dueDate: addDaysISO(intervalDays, today),
  };
}

/** The starting schedule when a problem first joins the revision list. */
export function initialSchedule(today: Date | string = new Date()): SchedulerResult {
  return {
    intervalDays: 1,
    ease: 2.5,
    reviewCount: 0,
    lapses: 0,
    dueDate: addDaysISO(1, today),
  };
}

/** Is this item due today or overdue? */
export function isDue(dueDate: string, today: Date | string = new Date()): boolean {
  const todayKey = typeof today === 'string' ? today.slice(0, 10) : today.toISOString().slice(0, 10);
  return dueDate.slice(0, 10) <= todayKey;
}

export function describeDue(dueDate: string, today: Date | string = new Date()): string {
  const todayKey = typeof today === 'string' ? today.slice(0, 10) : today.toISOString().slice(0, 10);
  const diff = Math.round(
    (Date.parse(`${dueDate.slice(0, 10)}T00:00:00Z`) - Date.parse(`${todayKey}T00:00:00Z`)) /
      86_400_000,
  );
  if (diff < -1) return `${Math.abs(diff)} days overdue`;
  if (diff === -1) return '1 day overdue';
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  if (diff < 7) return `Due in ${diff} days`;
  if (diff < 30) return `Due in ${Math.round(diff / 7)} weeks`;
  return `Due in ${Math.round(diff / 30)} months`;
}
