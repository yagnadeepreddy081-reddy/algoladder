import Link from 'next/link';

import { Badge, DifficultyBadge, EmptyState } from '@/components/ui/primitives';
import {
  BookmarkToggle,
  RevisionToggle,
  StarToggle,
  StatusSelect,
} from '@/components/problems/controls';
import type { ProblemWithProgress } from '@/lib/types';

/**
 * The problem list. Renders as a table on wide screens and as stacked cards on
 * narrow ones — same markup, one responsive switch, so there is no second
 * implementation to keep in step.
 */
export function ProblemList({
  problems,
  showTopic = true,
  numbering = 'overall',
  emptyTitle = 'No problems match these filters',
  emptyDescription = 'Try clearing a filter or two, or search for something else.',
  emptyAction,
}: {
  problems: ProblemWithProgress[];
  showTopic?: boolean;
  numbering?: 'overall' | 'topic' | 'none';
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
}) {
  if (problems.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-[hsl(var(--border))]">
      {/* header — desktop only */}
      <div className="hidden items-center gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-4 py-2.5 text-xs font-medium tracking-wide text-[hsl(var(--text-muted))] uppercase lg:flex">
        {numbering !== 'none' ? <span className="w-10 shrink-0">#</span> : null}
        <span className="min-w-0 flex-1">Problem</span>
        {showTopic ? <span className="w-44 shrink-0">Topic</span> : null}
        <span className="w-20 shrink-0">Level</span>
        <span className="w-36 shrink-0">Status</span>
        <span className="w-28 shrink-0 text-right">Actions</span>
      </div>

      <ul className="divide-y divide-[hsl(var(--border))]">
        {problems.map((p) => {
          const progress = p.progress;
          const status = progress?.status ?? 'not_started';
          const num = numbering === 'topic' ? p.problemNoInTopic : p.overallNo;

          return (
            <li
              key={p.id}
              className="group flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-[hsl(var(--surface-2))] lg:flex-row lg:items-center lg:gap-3"
            >
              {/* number */}
              {numbering !== 'none' ? (
                <span className="tabular hidden w-10 shrink-0 text-sm text-[hsl(var(--text-subtle))] lg:block">
                  {num}
                </span>
              ) : null}

              {/* title + meta */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {numbering !== 'none' ? (
                    <span className="tabular text-xs text-[hsl(var(--text-subtle))] lg:hidden">
                      {num}.
                    </span>
                  ) : null}
                  <Link
                    href={`/problems/${p.slug}`}
                    prefetch={false}
                    className="truncate text-[15px] font-medium text-[hsl(var(--text))] hover:text-brand-600 hover:underline dark:hover:text-brand-400"
                  >
                    {p.title}
                  </Link>
                  {p.isPremium ? <Badge tone="violet">Pro</Badge> : null}
                  {progress?.isStarred ? (
                    <span className="text-xs text-amber-500" title="Starred">
                      ★
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 truncate text-xs text-[hsl(var(--text-subtle))]">
                  {p.patternName} · {p.platform}
                  {progress?.attempts ? ` · ${progress.attempts} attempt${progress.attempts === 1 ? '' : 's'}` : ''}
                </p>
              </div>

              {/* topic */}
              {showTopic ? (
                <div className="w-44 shrink-0">
                  <Link
                    href={`/topics/${p.topicSlug}`}
                    prefetch={false}
                    className="truncate text-xs text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))] hover:underline"
                  >
                    {p.topicName}
                  </Link>
                </div>
              ) : null}

              {/* difficulty */}
              <div className="w-20 shrink-0">
                <DifficultyBadge difficulty={p.difficulty} />
              </div>

              {/* status */}
              <div className="w-36 shrink-0">
                <StatusSelect problemId={p.id} slug={p.slug} status={status} />
              </div>

              {/* actions */}
              <div className="flex w-28 shrink-0 items-center justify-start gap-0.5 transition-opacity lg:justify-end lg:opacity-45 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
                <BookmarkToggle
                  problemId={p.id}
                  slug={p.slug}
                  bookmarked={Boolean(progress?.isBookmarked)}
                />
                <StarToggle problemId={p.id} slug={p.slug} starred={Boolean(progress?.isStarred)} />
                <RevisionToggle
                  problemId={p.id}
                  slug={p.slug}
                  inRevision={Boolean(progress?.inRevision)}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
