'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import clsx from 'clsx';

import { Card, DifficultyBadge, buttonClass } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { reviewProblemAction } from '@/lib/actions/progress';
import { REVIEW_GRADES, describeDue, type ReviewGrade } from '@/lib/spaced-repetition';
import type { Difficulty } from '@/lib/types';

/**
 * One due problem, with the four grading buttons. Grading is what moves the
 * schedule — the interval grows on "good" and "easy" and collapses to a day on
 * "again".
 */
export function ReviewCard({
  problemId,
  slug,
  title,
  difficulty,
  topicName,
  platform,
  externalUrl,
  dueDate,
  reviewCount,
  intervalDays,
}: {
  problemId: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  topicName: string;
  platform: string;
  externalUrl: string;
  dueDate: string;
  reviewCount: number;
  intervalDays: number;
}) {
  const router = useRouter();
  const { success, error } = useToast();
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  function grade(g: ReviewGrade) {
    start(async () => {
      const res = await reviewProblemAction(problemId, g);
      if (res.ok) {
        setDone(true);
        success(res.message ?? 'Scheduled');
        router.refresh();
      } else {
        error(res.error ?? 'Could not save that review');
      }
    });
  }

  if (done) {
    return (
      <Card className="p-4 opacity-60">
        <p className="text-sm text-[hsl(var(--text-muted))]">
          ✓ <span className="font-medium text-[hsl(var(--text))]">{title}</span> — rescheduled.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[hsl(var(--text))]">
            <Link href={`/problems/${slug}`} className="hover:underline">
              {title}
            </Link>
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--text-muted))]">
            <DifficultyBadge difficulty={difficulty} />
            <span>{topicName}</span>
            <span aria-hidden>·</span>
            <span>{describeDue(dueDate)}</span>
            <span aria-hidden>·</span>
            <span>
              {reviewCount} review{reviewCount === 1 ? '' : 's'}, currently every {intervalDays}d
            </span>
          </p>
        </div>
        <Link
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass('outline', 'sm')}
        >
          Solve on {platform}
        </Link>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs text-[hsl(var(--text-muted))]">
          Attempt it from memory first, then grade yourself honestly:
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {REVIEW_GRADES.map((g) => (
            <button
              key={g.value}
              type="button"
              disabled={pending}
              onClick={() => grade(g.value)}
              title={g.hint}
              className={clsx(
                'flex h-auto flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors disabled:opacity-50',
                g.value === 'again'
                  ? 'border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/50'
                  : g.value === 'easy'
                    ? 'border-brand-300 text-brand-700 hover:bg-brand-50 dark:border-brand-800 dark:text-brand-400 dark:hover:bg-brand-950/50'
                    : 'border-[hsl(var(--border-strong))] text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--surface-2))]',
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}
