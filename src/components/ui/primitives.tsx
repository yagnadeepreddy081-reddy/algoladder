import type { ReactNode } from 'react';
import clsx from 'clsx';

import type { Difficulty, ProgressStatus } from '@/lib/types';

/* ---------------------------------------------------------------- Card --- */

export function Card({
  children,
  className,
  id,
  testId,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  testId?: string;
  as?: 'div' | 'section' | 'article' | 'li';
}) {
  return (
    <Tag
      id={id}
      data-testid={testId}
      className={clsx(
        'rounded-[var(--radius-card)] border border-[hsl(var(--border))] bg-[hsl(var(--surface))]',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('flex items-start justify-between gap-4 px-5 pt-5 pb-3', className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-[hsl(var(--text))]">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-[hsl(var(--text-muted))]">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------- Button --- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors ' +
  'disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2';

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 dark:bg-brand-500 dark:hover:bg-brand-400 dark:text-brand-950',
  secondary:
    'bg-[hsl(var(--surface-3))] text-[hsl(var(--text))] hover:bg-[hsl(var(--border))]',
  outline:
    'border border-[hsl(var(--border-strong))] bg-transparent text-[hsl(var(--text))] hover:bg-[hsl(var(--surface-2))]',
  ghost: 'bg-transparent text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--surface-2))] hover:text-[hsl(var(--text))]',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
};

const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'h-9 w-9 p-0',
};

export function buttonClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return clsx(BUTTON_BASE, BUTTON_VARIANT[variant], BUTTON_SIZE[size], className);
}

/* --------------------------------------------------------------- Badge --- */

export function Badge({
  children,
  tone = 'zinc',
  className,
}: {
  children: ReactNode;
  tone?: 'zinc' | 'brand' | 'amber' | 'red' | 'blue' | 'violet';
  className?: string;
}) {
  const tones = {
    zinc: 'bg-[hsl(var(--surface-3))] text-[hsl(var(--text-muted))]',
    brand: 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    violet: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
  };
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const styles: Record<Difficulty, string> = {
    Easy: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300',
    Medium: 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300',
    Hard: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300',
  };
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold',
        styles[difficulty],
      )}
    >
      {difficulty}
    </span>
  );
}

const STATUS_STYLE: Record<ProgressStatus, { label: string; className: string; dot: string }> = {
  not_started: {
    label: 'Not started',
    className: 'text-[hsl(var(--text-subtle))]',
    dot: 'bg-[hsl(var(--border-strong))]',
  },
  in_progress: {
    label: 'In progress',
    className: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  solved: {
    label: 'Solved',
    className: 'text-brand-700 dark:text-brand-400',
    dot: 'bg-brand-500',
  },
  needs_revision: {
    label: 'Needs revision',
    className: 'text-violet-700 dark:text-violet-400',
    dot: 'bg-violet-500',
  },
};

export function StatusPill({ status }: { status: ProgressStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-xs font-medium', s.className)}>
      <span className={clsx('h-1.5 w-1.5 rounded-full', s.dot)} aria-hidden />
      {s.label}
    </span>
  );
}

/* --------------------------------------------------------- ProgressBar --- */

export function ProgressBar({
  value,
  total,
  className,
  label,
  showLabel = false,
  size = 'md',
}: {
  value: number;
  total: number;
  className?: string;
  label?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };
  return (
    <div className={className}>
      {showLabel ? (
        <div className="mb-1.5 flex items-baseline justify-between text-xs">
          <span className="text-[hsl(var(--text-muted))]">{label ?? 'Progress'}</span>
          <span className="tabular font-medium text-[hsl(var(--text))]">
            {value}/{total} · {pct}%
          </span>
        </div>
      ) : null}
      <div
        className={clsx('w-full overflow-hidden rounded-full bg-[hsl(var(--surface-3))]', heights[size])}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
      >
        <div
          className="h-full rounded-full bg-brand-500 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Stacked bar showing the easy/medium/hard split of what is solved. */
export function DifficultySplitBar({
  easy,
  medium,
  hard,
  total,
}: {
  easy: number;
  medium: number;
  hard: number;
  total: number;
}) {
  if (total <= 0) return null;
  const pct = (n: number) => (n / total) * 100;
  return (
    <div
      className="flex h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--surface-3))]"
      role="img"
      aria-label={`${easy} easy, ${medium} medium and ${hard} hard problems solved out of ${total}`}
    >
      <div className="bg-emerald-500" style={{ width: `${pct(easy)}%` }} />
      <div className="bg-amber-500" style={{ width: `${pct(medium)}%` }} />
      <div className="bg-rose-500" style={{ width: `${pct(hard)}%` }} />
    </div>
  );
}

/* ------------------------------------------------------------ StatTile --- */

export function StatTile({
  label,
  value,
  sub,
  tone = 'default',
  icon,
  testId,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'default' | 'brand' | 'amber' | 'violet' | 'red';
  icon?: ReactNode;
  testId?: string;
}) {
  const valueTone = {
    default: 'text-[hsl(var(--text))]',
    brand: 'text-brand-600 dark:text-brand-400',
    amber: 'text-amber-600 dark:text-amber-400',
    violet: 'text-violet-600 dark:text-violet-400',
    red: 'text-rose-600 dark:text-rose-400',
  };
  return (
    <Card
      className="p-4"
      testId={testId ?? `stat-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium tracking-wide text-[hsl(var(--text-muted))] uppercase">
          {label}
        </p>
        {icon ? <span className="text-[hsl(var(--text-subtle))]">{icon}</span> : null}
      </div>
      <p className={clsx('tabular mt-2 text-2xl font-semibold', valueTone[tone])}>{value}</p>
      {sub ? <p className="mt-1 text-xs text-[hsl(var(--text-muted))]">{sub}</p> : null}
    </Card>
  );
}

/* ------------------------------------------------- Empty / Error states --- */

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-[hsl(var(--border-strong))] px-6 py-14 text-center">
      {icon ? <div className="mb-3 text-[hsl(var(--text-subtle))]">{icon}</div> : null}
      <p className="text-base font-medium text-[hsl(var(--text))]">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm text-[hsl(var(--text-muted))]">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div
      role="alert"
      className="rounded-[var(--radius-card)] border border-rose-300 bg-rose-50 px-5 py-4 dark:border-rose-900 dark:bg-rose-950/40"
    >
      <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">{title}</p>
      {detail ? (
        <p className="mt-1 text-sm break-words text-rose-700 dark:text-rose-400">{detail}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------ Skeleton --- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('shimmer rounded-md', className)} aria-hidden />;
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

/* --------------------------------------------------------- Page header --- */

export function PageHeader({
  title,
  description,
  action,
  breadcrumb,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  breadcrumb?: ReactNode;
}) {
  return (
    <header className="mb-6">
      {breadcrumb ? <div className="mb-2 text-sm">{breadcrumb}</div> : null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-balance text-[hsl(var(--text))] sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm text-pretty text-[hsl(var(--text-muted))]">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}

/* --------------------------------------------------------------- Field --- */

export const inputClass =
  'w-full rounded-lg border border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] px-3 py-2 ' +
  'text-sm text-[hsl(var(--text))] placeholder:text-[hsl(var(--text-subtle))] ' +
  'focus:border-brand-500 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-0 ' +
  'disabled:opacity-60';

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-[hsl(var(--text))]">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-[hsl(var(--text-muted))]">{hint}</p>
      ) : null}
    </div>
  );
}
