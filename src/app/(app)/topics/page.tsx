import Link from 'next/link';

import { Badge, Card, PageHeader, ProgressBar } from '@/components/ui/primitives';
import { requireUser } from '@/lib/auth/session';
import { listTopics } from '@/lib/data/problems';
import { getTopicProgress } from '@/lib/data/dashboard';
import { percentOf } from '@/lib/progress';

export const metadata = { title: 'Topics' };
export const dynamic = 'force-dynamic';

/** A tiny coloured count, used for the easy/medium/hard split on each card. */
function Split({ tone, n, title }: { tone: string; n: number; title: string }) {
  return (
    <span className="inline-flex items-center gap-1" title={title}>
      <span className={`h-1.5 w-1.5 rounded-full ${tone}`} aria-hidden />
      <span className="tabular">{n}</span>
      <span className="sr-only">{title}</span>
    </span>
  );
}

export default async function TopicsPage() {
  const user = await requireUser('/topics');
  const [topics, progress] = await Promise.all([listTopics(), getTopicProgress(user.id)]);

  const byTopic = new Map(progress.map((p) => [p.topicId, p]));

  const grandTotal = topics.reduce((n, t) => n + t.problemCount, 0);
  const grandSolved = progress.reduce((n, p) => n + p.solved, 0);
  const grandInProgress = progress.reduce((n, p) => n + p.inProgress, 0);
  const grandRevision = progress.reduce((n, p) => n + p.needsRevision, 0);
  const topicsDone = progress.filter((p) => p.total > 0 && p.solved === p.total).length;
  const grandPct = percentOf(grandSolved, grandTotal);

  return (
    <>
      <PageHeader
        title="The roadmap"
        description="Nineteen topics, ordered so each one leans on the last."
      />

      {/* ------------------------------------------------ overall progress */}
      <Card className="mb-8 p-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-medium tracking-wide text-[hsl(var(--text-muted))] uppercase">
              Whole ladder
            </p>
            <p className="tabular mt-1 text-4xl font-semibold tracking-tight text-[hsl(var(--text))]">
              {grandPct}
              <span className="text-2xl text-[hsl(var(--text-subtle))]">%</span>
            </p>
            <p className="tabular mt-1 text-sm text-[hsl(var(--text-muted))]">
              {grandSolved} of {grandTotal} problems solved
            </p>
          </div>

          <dl className="flex gap-8">
            {[
              { label: 'In progress', value: grandInProgress },
              { label: 'To revise', value: grandRevision },
              { label: 'Topics done', value: `${topicsDone}/${topics.length}` },
            ].map((s) => (
              <div key={s.label}>
                <dt className="text-xs text-[hsl(var(--text-muted))]">{s.label}</dt>
                <dd className="tabular mt-0.5 text-xl font-semibold text-[hsl(var(--text))]">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <ProgressBar value={grandSolved} total={grandTotal} size="lg" className="mt-6" />
      </Card>

      {/* ------------------------------------------------------ the rungs */}
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {topics.map((t) => {
          const p = byTopic.get(t.id);
          const solved = p?.solved ?? 0;
          const total = p?.total ?? t.problemCount;
          const pct = percentOf(solved, total);
          const complete = total > 0 && solved === total;

          return (
            <li key={t.id}>
              <Link
                href={`/topics/${t.slug}`}
                prefetch={false}
                className="group flex h-full flex-col rounded-[var(--radius-card)] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5 transition-all hover:border-brand-400 hover:shadow-[var(--shadow-soft)] dark:hover:border-brand-700"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={
                      'tabular flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ' +
                      (complete
                        ? 'bg-brand-600 text-white dark:bg-brand-500 dark:text-brand-950'
                        : 'bg-[hsl(var(--surface-3))] text-[hsl(var(--text-muted))]')
                    }
                  >
                    {complete ? '✓' : t.position}
                  </span>

                  <h2 className="min-w-0 flex-1 truncate text-[15px] font-semibold text-[hsl(var(--text))] group-hover:text-brand-700 dark:group-hover:text-brand-400">
                    {t.name}
                  </h2>

                  {t.isPremium ? <Badge tone="violet">Pro</Badge> : null}

                  <span
                    className={
                      'tabular shrink-0 text-sm font-semibold ' +
                      (complete
                        ? 'text-brand-600 dark:text-brand-400'
                        : 'text-[hsl(var(--text-subtle))]')
                    }
                  >
                    {pct}%
                  </span>
                </div>

                <p className="mt-3 line-clamp-2 flex-1 text-sm text-pretty text-[hsl(var(--text-muted))]">
                  {t.description}
                </p>

                <ProgressBar value={solved} total={total} className="mt-4" />

                <div className="tabular mt-2.5 flex items-center justify-between text-xs text-[hsl(var(--text-muted))]">
                  <span>
                    {solved}/{total} solved
                  </span>

                  {p ? (
                    <span className="flex items-center gap-2.5 text-[hsl(var(--text-subtle))]">
                      <Split tone="bg-emerald-500" n={p.easyTotal} title="easy" />
                      <Split tone="bg-amber-500" n={p.mediumTotal} title="medium" />
                      <Split tone="bg-rose-500" n={p.hardTotal} title="hard" />
                    </span>
                  ) : null}
                </div>

                {p && p.inProgress + p.needsRevision > 0 ? (
                  <p className="mt-1.5 text-xs text-[hsl(var(--text-subtle))]">
                    {p.inProgress ? `${p.inProgress} in progress` : ''}
                    {p.inProgress && p.needsRevision ? ' · ' : ''}
                    {p.needsRevision ? `${p.needsRevision} to revise` : ''}
                  </p>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
