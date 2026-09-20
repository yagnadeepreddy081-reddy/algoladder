'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import clsx from 'clsx';

import { buttonClass, Card, CardHeader, inputClass } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import {
  addTimeSpentAction,
  recordAttemptAction,
  setConfidenceAction,
  setCustomTagsAction,
  setReviewDateAction,
  setSolutionUrlAction,
} from '@/lib/actions/progress';
import { formatDuration } from '@/lib/progress';
import type { UserProgress } from '@/lib/types';

/**
 * The personal tracking panel: attempts, time spent, confidence, your own
 * solution link, your own tags, and a manual review date. Everything here
 * writes straight to the database against your account.
 */
export function ProgressPanel({
  problemId,
  slug,
  progress,
}: {
  problemId: string;
  slug: string;
  progress: UserProgress | null;
}) {
  const router = useRouter();
  const { success, error } = useToast();
  const [pending, start] = useTransition();

  const [minutes, setMinutes] = useState('');
  const [solutionUrl, setSolutionUrl] = useState(progress?.solutionUrl ?? '');
  const [tags, setTags] = useState((progress?.customTags ?? []).join(', '));
  const [reviewDate, setReviewDate] = useState(progress?.nextReviewDate ?? '');
  const [confidence, setConfidence] = useState<number | null>(progress?.confidence ?? null);

  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        success(res.message ?? 'Saved');
        router.refresh();
      } else {
        error(res.error ?? 'Could not save that');
      }
    });

  return (
    <Card>
      <CardHeader
        title="Your tracking"
        description="Private to your account, and it survives a sign-out."
      />

      <div className="space-y-5 px-5 pb-5">
        {/* attempts + time */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-[hsl(var(--surface-2))] px-4 py-3">
            <p className="text-xs font-medium tracking-wide text-[hsl(var(--text-muted))] uppercase">
              Attempts
            </p>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="tabular text-xl font-semibold text-[hsl(var(--text))]">
                {progress?.attempts ?? 0}
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => recordAttemptAction(problemId, slug))}
                className={buttonClass('outline', 'sm')}
              >
                + 1
              </button>
            </div>
          </div>

          <div className="rounded-lg bg-[hsl(var(--surface-2))] px-4 py-3">
            <p className="text-xs font-medium tracking-wide text-[hsl(var(--text-muted))] uppercase">
              Time spent
            </p>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="tabular text-xl font-semibold text-[hsl(var(--text))]">
                {formatDuration(progress?.timeSpentSeconds ?? 0)}
              </span>
              <div className="flex items-center gap-1">
                <label className="sr-only" htmlFor="minutes">
                  Minutes to add
                </label>
                <input
                  id="minutes"
                  type="number"
                  min={0}
                  max={1440}
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  placeholder="30"
                  className={clsx(inputClass, 'h-8 w-20 px-2 py-0 text-xs')}
                />
                <button
                  type="button"
                  disabled={pending || !minutes}
                  onClick={() =>
                    run(async () => {
                      const res = await addTimeSpentAction(problemId, Number(minutes), slug);
                      if (res.ok) setMinutes('');
                      return res;
                    })
                  }
                  className={buttonClass('outline', 'sm')}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* confidence */}
        <div>
          <p className="mb-1.5 text-sm font-medium text-[hsl(var(--text))]">
            How confident are you on this one?
          </p>
          <div className="flex gap-1.5" role="radiogroup" aria-label="Confidence">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={confidence === n}
                disabled={pending}
                onClick={() => {
                  const next = confidence === n ? null : n;
                  setConfidence(next);
                  run(() => setConfidenceAction(problemId, next, slug));
                }}
                className={clsx(
                  'h-9 flex-1 rounded-lg border text-sm font-medium transition-colors',
                  confidence === n
                    ? 'border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-300'
                    : 'border-[hsl(var(--border-strong))] text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--surface-2))]',
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-[hsl(var(--text-subtle))]">
            1 means you would not get it again; 5 means you could write it from memory.
          </p>
        </div>

        {/* solution link */}
        <div>
          <label htmlFor="solutionUrl" className="mb-1.5 block text-sm font-medium text-[hsl(var(--text))]">
            Your solution link
          </label>
          <div className="flex gap-2">
            <input
              id="solutionUrl"
              type="url"
              value={solutionUrl}
              onChange={(e) => setSolutionUrl(e.target.value)}
              placeholder="https://github.com/you/dsa/blob/main/two-sum.java"
              className={inputClass}
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => setSolutionUrlAction(problemId, solutionUrl, slug))}
              className={buttonClass('outline', 'md')}
            >
              Save
            </button>
          </div>
        </div>

        {/* custom tags */}
        <div>
          <label htmlFor="customTags" className="mb-1.5 block text-sm font-medium text-[hsl(var(--text))]">
            Your own tags
          </label>
          <div className="flex gap-2">
            <input
              id="customTags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="revisit before interviews, got stuck on edge case"
              className={inputClass}
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => setCustomTagsAction(problemId, tags, slug))}
              className={buttonClass('outline', 'md')}
            >
              Save
            </button>
          </div>
          {progress?.customTags?.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {progress.customTags.map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-[hsl(var(--surface-3))] px-2 py-0.5 text-xs text-[hsl(var(--text-muted))]"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-1.5 text-xs text-[hsl(var(--text-subtle))]">Comma separated.</p>
          )}
        </div>

        {/* review date */}
        <div>
          <label htmlFor="reviewDate" className="mb-1.5 block text-sm font-medium text-[hsl(var(--text))]">
            Review this on
          </label>
          <div className="flex gap-2">
            <input
              id="reviewDate"
              type="date"
              value={reviewDate}
              onChange={(e) => setReviewDate(e.target.value)}
              className={inputClass}
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => setReviewDateAction(problemId, reviewDate, slug))}
              className={buttonClass('outline', 'md')}
            >
              Set
            </button>
          </div>
          <p className="mt-1.5 text-xs text-[hsl(var(--text-subtle))]">
            Setting a date adds this problem to your revision list. The scheduler moves it after each
            graded review.
          </p>
        </div>
      </div>
    </Card>
  );
}
