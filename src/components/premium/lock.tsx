import Link from 'next/link';

import { Card, buttonClass } from '@/components/ui/primitives';

/**
 * The lock screen shown in place of a premium-only panel or page.
 *
 * It always explains exactly what is behind the lock, and — where there is a
 * free preview — that preview stays visible above it rather than being hidden.
 */
export function PremiumLock({
  title,
  description,
  feature,
  compact = false,
  preview,
}: {
  title: string;
  description: string;
  feature?: string;
  compact?: boolean;
  preview?: React.ReactNode;
}) {
  const body = (
    <div className={compact ? 'p-4' : 'px-6 py-10'}>
      <div className="mx-auto max-w-md text-center">
        <span
          aria-hidden
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 1 1 8 0v3" />
          </svg>
        </span>

        <h3 className="mt-4 text-base font-semibold text-[hsl(var(--text))]">{title}</h3>
        <p className="mt-2 text-sm text-pretty text-[hsl(var(--text-muted))]">{description}</p>
        {feature ? (
          <p className="mt-2 text-xs text-[hsl(var(--text-subtle))]">Part of {feature}.</p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Link href="/premium" className={buttonClass('primary', 'md')}>
            See what Pro includes
          </Link>
          <Link href="/premium#trial" className={buttonClass('outline', 'md')}>
            Start a free trial
          </Link>
        </div>
      </div>
    </div>
  );

  if (preview) {
    return (
      <Card className="overflow-hidden">
        <div className="relative">
          <div className="pointer-events-none max-h-56 overflow-hidden opacity-60 select-none" aria-hidden>
            {preview}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[hsl(var(--surface))] to-transparent" />
        </div>
        <div className="border-t border-[hsl(var(--border))]">{body}</div>
      </Card>
    );
  }

  return <Card>{body}</Card>;
}

/** Small inline badge for a locked nav item or list row. */
export function PremiumBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-violet-800 uppercase dark:bg-violet-950 dark:text-violet-300">
      Pro
    </span>
  );
}
