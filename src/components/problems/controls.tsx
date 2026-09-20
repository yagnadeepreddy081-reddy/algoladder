'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import clsx from 'clsx';

import { useToast } from '@/components/ui/toast';
import { buttonClass } from '@/components/ui/primitives';
import {
  setProblemStatusAction,
  toggleBookmarkAction,
  toggleRevisionAction,
  toggleStarAction,
  recordAttemptAction,
} from '@/lib/actions/progress';
import { PROGRESS_STATUSES, STATUS_LABEL, type ProgressStatus } from '@/lib/types';

/* ------------------------------------------------------- status select --- */

export function StatusSelect({
  problemId,
  slug,
  status,
  size = 'sm',
}: {
  problemId: string;
  slug?: string;
  status: ProgressStatus;
  size?: 'sm' | 'md';
}) {
  const [value, setValue] = useState<ProgressStatus>(status);
  const [pending, startTransition] = useTransition();
  const { success, error } = useToast();
  const router = useRouter();

  const tone: Record<ProgressStatus, string> = {
    not_started: 'border-[hsl(var(--border-strong))] text-[hsl(var(--text-muted))]',
    in_progress:
      'border-amber-400 text-amber-800 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    solved:
      'border-brand-400 text-brand-800 bg-brand-50 dark:bg-brand-950/50 dark:text-brand-300 dark:border-brand-800',
    needs_revision:
      'border-violet-400 text-violet-800 bg-violet-50 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800',
  };

  function onChange(next: ProgressStatus) {
    const previous = value;
    setValue(next); // optimistic
    startTransition(async () => {
      const res = await setProblemStatusAction(problemId, next, slug);
      if (res.ok) {
        success(res.message ?? 'Saved');
        router.refresh();
      } else {
        setValue(previous);
        error(res.error ?? 'Could not save that');
      }
    });
  }

  return (
    <label className="relative inline-flex">
      <span className="sr-only">Status</span>
      <select
        value={value}
        disabled={pending}
        onChange={(e) => onChange(e.target.value as ProgressStatus)}
        className={clsx(
          'cursor-pointer appearance-none rounded-lg border bg-[hsl(var(--surface))] pr-7 pl-2.5 font-medium transition-colors disabled:opacity-60',
          size === 'sm' ? 'h-8 text-xs' : 'h-10 text-sm',
          tone[value],
        )}
      >
        {PROGRESS_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2 opacity-60"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </label>
  );
}

/* --------------------------------------------------------- icon toggles --- */

function IconToggle({
  active,
  onToggle,
  label,
  children,
  activeClass,
}: {
  active: boolean;
  onToggle: () => void;
  label: string;
  children: React.ReactNode;
  activeClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      title={label}
      className={clsx(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
        active ? activeClass : 'text-[hsl(var(--text-subtle))] hover:bg-[hsl(var(--surface-2))]',
      )}
    >
      <span className="sr-only">{label}</span>
      {children}
    </button>
  );
}

export function BookmarkToggle({
  problemId,
  slug,
  bookmarked,
}: {
  problemId: string;
  slug?: string;
  bookmarked: boolean;
}) {
  const [on, setOn] = useState(bookmarked);
  const [, start] = useTransition();
  const { toast, error } = useToast();
  const router = useRouter();

  return (
    <IconToggle
      active={on}
      label={on ? 'Remove bookmark' : 'Bookmark this problem'}
      activeClass="text-brand-600 dark:text-brand-400"
      onToggle={() => {
        setOn((v) => !v);
        start(async () => {
          const res = await toggleBookmarkAction(problemId, slug);
          if (res.ok) {
            toast(res.message ?? 'Saved');
            router.refresh();
          } else {
            setOn(bookmarked);
            error(res.error ?? 'Could not save that');
          }
        });
      }}
    >
      <svg viewBox="0 0 24 24" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden>
        <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />
      </svg>
    </IconToggle>
  );
}

export function StarToggle({
  problemId,
  slug,
  starred,
}: {
  problemId: string;
  slug?: string;
  starred: boolean;
}) {
  const [on, setOn] = useState(starred);
  const [, start] = useTransition();
  const { toast, error } = useToast();
  const router = useRouter();

  return (
    <IconToggle
      active={on}
      label={on ? 'Remove star' : 'Star this problem'}
      activeClass="text-amber-500"
      onToggle={() => {
        setOn((v) => !v);
        start(async () => {
          const res = await toggleStarAction(problemId, slug);
          if (res.ok) {
            toast(res.message ?? 'Saved');
            router.refresh();
          } else {
            setOn(starred);
            error(res.error ?? 'Could not save that');
          }
        });
      }}
    >
      <svg viewBox="0 0 24 24" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden>
        <path d="m12 2 2.6 6.3 6.8.5-5.2 4.4 1.6 6.6L12 16.3 6.2 19.8l1.6-6.6L2.6 8.8l6.8-.5Z" />
      </svg>
    </IconToggle>
  );
}

export function RevisionToggle({
  problemId,
  slug,
  inRevision,
  variant = 'icon',
}: {
  problemId: string;
  slug?: string;
  inRevision: boolean;
  variant?: 'icon' | 'button';
}) {
  const [on, setOn] = useState(inRevision);
  const [pending, start] = useTransition();
  const { toast, error } = useToast();
  const router = useRouter();

  const run = () => {
    setOn((v) => !v);
    start(async () => {
      const res = await toggleRevisionAction(problemId, slug);
      if (res.ok) {
        toast(res.message ?? 'Saved');
        router.refresh();
      } else {
        setOn(inRevision);
        error(res.error ?? 'Could not save that');
      }
    });
  };

  if (variant === 'button') {
    return (
      <button type="button" onClick={run} disabled={pending} className={buttonClass(on ? 'secondary' : 'outline', 'md')}>
        {on ? 'In revision list' : 'Add to revision'}
      </button>
    );
  }

  return (
    <IconToggle
      active={on}
      label={on ? 'Remove from revision list' : 'Add to revision list'}
      activeClass="text-violet-600 dark:text-violet-400"
      onToggle={run}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden>
        <path d="M21 12a9 9 0 1 1-3-6.7" />
        <path d="M21 4v5h-5" />
      </svg>
    </IconToggle>
  );
}

/* -------------------------------------------------------- solve button --- */

export function MarkSolvedButton({
  problemId,
  slug,
  status,
}: {
  problemId: string;
  slug?: string;
  status: ProgressStatus;
}) {
  const [solved, setSolved] = useState(status === 'solved');
  const [pending, start] = useTransition();
  const { success, error } = useToast();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const next: ProgressStatus = solved ? 'not_started' : 'solved';
        setSolved(!solved);
        start(async () => {
          const res = await setProblemStatusAction(problemId, next, slug);
          if (res.ok) {
            success(res.message ?? 'Saved');
            router.refresh();
          } else {
            setSolved(solved);
            error(res.error ?? 'Could not save that');
          }
        });
      }}
      className={buttonClass(solved ? 'secondary' : 'primary', 'md')}
    >
      {pending ? 'Saving…' : solved ? '✓ Solved — undo' : 'Mark as solved'}
    </button>
  );
}

export function RecordAttemptButton({ problemId, slug }: { problemId: string; slug?: string }) {
  const [pending, start] = useTransition();
  const { toast, error } = useToast();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await recordAttemptAction(problemId, slug);
          if (res.ok) {
            toast(`Attempt ${res.attempts} recorded`);
            router.refresh();
          } else {
            error(res.error ?? 'Could not record that');
          }
        })
      }
      className={buttonClass('outline', 'md')}
    >
      + Attempt
    </button>
  );
}

/* --------------------------------------------------------- external link --- */

export function SolveLink({ url, platform }: { url: string; platform: string }) {
  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClass('outline', 'md')}
    >
      Open on {platform}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
      </svg>
    </Link>
  );
}
