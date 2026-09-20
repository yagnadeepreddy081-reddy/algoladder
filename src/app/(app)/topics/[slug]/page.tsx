import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  Card,
  CardHeader,
  DifficultySplitBar,
  PageHeader,
  ProgressBar,
  StatTile,
  buttonClass,
} from '@/components/ui/primitives';
import { ProblemList } from '@/components/problems/problem-list';
import { requireUser } from '@/lib/auth/session';
import { getTopicBySlug, listProblemsForTopic, listSubtopics } from '@/lib/data/problems';
import { nextProblem, percentOf, summarise } from '@/lib/progress';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = await getTopicBySlug(slug).catch(() => null);
  return { title: topic?.name ?? 'Topic' };
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/topics/${slug}`);

  const topic = await getTopicBySlug(slug);
  if (!topic) notFound();

  const [subtopics, problems] = await Promise.all([
    listSubtopics(slug),
    listProblemsForTopic(slug, user.id),
  ]);

  const summary = summarise(problems);
  const next = nextProblem(problems);

  return (
    <>
      <PageHeader
        breadcrumb={
          <Link href="/topics" className="text-[hsl(var(--text-muted))] hover:underline">
            ← All topics
          </Link>
        }
        title={topic.name}
        description={topic.description}
        action={
          next ? (
            <Link href={`/problems/${next.slug}`} className={buttonClass('primary', 'md')}>
              {summary.solved === 0 ? 'Start learning' : 'Continue learning'}
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-lg bg-brand-50 px-4 py-2 text-sm font-medium text-brand-800 dark:bg-brand-950 dark:text-brand-300">
              ✓ Topic complete
            </span>
          )
        }
      />

      {/* ------------------------------------------------------- summary */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Problems" value={summary.total} sub={`${subtopics.length} subtopics`} />
        <StatTile
          label="Completed"
          value={summary.solved}
          sub={`${summary.percent}% of this topic`}
          tone="brand"
        />
        <StatTile label="In progress" value={summary.inProgress} tone="amber" />
        <StatTile label="Needs revision" value={summary.needsRevision} tone="violet" />
      </div>

      <Card className="mb-5 p-4">
        <ProgressBar
          value={summary.solved}
          total={summary.total}
          size="lg"
          showLabel
          label="Topic progress"
        />

        <div className="mt-5">
          <p className="mb-2 text-xs font-medium tracking-wide text-[hsl(var(--text-muted))] uppercase">
            Difficulty distribution
          </p>
          <DifficultySplitBar
            easy={summary.byDifficulty.Easy.total}
            medium={summary.byDifficulty.Medium.total}
            hard={summary.byDifficulty.Hard.total}
            total={summary.total}
          />
          <dl className="mt-3 grid grid-cols-3 gap-3">
            {(['Easy', 'Medium', 'Hard'] as const).map((d) => {
              const b = summary.byDifficulty[d];
              const dot = d === 'Easy' ? 'bg-emerald-500' : d === 'Medium' ? 'bg-amber-500' : 'bg-rose-500';
              return (
                <div key={d} className="rounded-lg bg-[hsl(var(--surface-2))] px-3 py-2.5">
                  <dt className="flex items-center gap-1.5 text-xs text-[hsl(var(--text-muted))]">
                    <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
                    {d}
                  </dt>
                  <dd className="tabular mt-1 text-sm font-semibold text-[hsl(var(--text))]">
                    {b.solved}/{b.total}
                    <span className="ml-1.5 text-xs font-normal text-[hsl(var(--text-muted))]">
                      {percentOf(b.solved, b.total)}%
                    </span>
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </Card>

      {/* ----------------------------------------------------- subtopics */}
      <Card className="mb-5">
        <CardHeader
          title="Subtopics"
          description="Each one is a coherent block. Finishing a block beats scattering across three."
        />
        <ul className="grid gap-2 px-4 pb-4 sm:grid-cols-2">
          {subtopics.map((s) => {
            const inSub = problems.filter((p) => p.subtopicId === s.id);
            const solved = inSub.filter((p) => p.progress?.status === 'solved').length;
            return (
              <li key={s.id}>
                <Link
                  href={`/topics/${topic.slug}/${s.slug}`}
                  className="block rounded-lg border border-[hsl(var(--border))] p-4 transition-colors hover:bg-[hsl(var(--surface-2))]"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate text-sm font-medium text-[hsl(var(--text))]">
                      {s.name}
                    </span>
                    <span className="tabular shrink-0 text-xs text-[hsl(var(--text-muted))]">
                      {solved}/{inSub.length}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs text-[hsl(var(--text-muted))]">
                    {s.description}
                  </p>
                  <ProgressBar value={solved} total={inSub.length} className="mt-3" size="sm" />
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* ------------------------------------------------------ problems */}
      <h2 className="mb-3 text-lg font-semibold text-[hsl(var(--text))]">
        All {summary.total} problems in this topic
      </h2>
      <ProblemList problems={problems} showTopic={false} numbering="topic" />
    </>
  );
}
