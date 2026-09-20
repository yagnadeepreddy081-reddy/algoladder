import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  Card,
  PageHeader,
  ProgressBar,
  StatTile,
  buttonClass,
} from '@/components/ui/primitives';
import { ProblemList } from '@/components/problems/problem-list';
import { requireUser } from '@/lib/auth/session';
import {
  getSubtopic,
  getTopicBySlug,
  listProblemsForSubtopic,
  listSubtopics,
} from '@/lib/data/problems';
import { nextProblem, summarise } from '@/lib/progress';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; subtopic: string }>;
}) {
  const { slug, subtopic } = await params;
  const s = await getSubtopic(slug, subtopic).catch(() => null);
  return { title: s?.name ?? 'Subtopic' };
}

export default async function SubtopicPage({
  params,
}: {
  params: Promise<{ slug: string; subtopic: string }>;
}) {
  const { slug, subtopic } = await params;
  const user = await requireUser(`/topics/${slug}/${subtopic}`);

  const [topic, sub] = await Promise.all([getTopicBySlug(slug), getSubtopic(slug, subtopic)]);
  if (!topic || !sub) notFound();

  const [problems, siblings] = await Promise.all([
    listProblemsForSubtopic(slug, subtopic, user.id),
    listSubtopics(slug),
  ]);

  const summary = summarise(problems);
  const next = nextProblem(problems);

  const index = siblings.findIndex((s) => s.slug === sub.slug);
  const prevSub = index > 0 ? siblings[index - 1] : null;
  const nextSub = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null;

  return (
    <>
      <PageHeader
        breadcrumb={
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[hsl(var(--text-muted))]">
            <Link href="/topics" className="hover:underline">
              Topics
            </Link>
            <span aria-hidden>/</span>
            <Link href={`/topics/${topic.slug}`} className="hover:underline">
              {topic.name}
            </Link>
          </nav>
        }
        title={sub.name}
        description={sub.description}
        action={
          next ? (
            <Link href={`/problems/${next.slug}`} className={buttonClass('primary', 'md')}>
              Continue learning
            </Link>
          ) : null
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatTile label="Problems" value={summary.total} />
        <StatTile label="Solved" value={summary.solved} sub={`${summary.percent}%`} tone="brand" />
        <StatTile
          label="Difficulty mix"
          value={
            <span className="tabular text-base">
              {summary.byDifficulty.Easy.total}E · {summary.byDifficulty.Medium.total}M ·{' '}
              {summary.byDifficulty.Hard.total}H
            </span>
          }
        />
      </div>

      <Card className="mb-5 p-4">
        <ProgressBar
          value={summary.solved}
          total={summary.total}
          size="lg"
          showLabel
          label="Subtopic progress"
        />
      </Card>

      <ProblemList problems={problems} showTopic={false} numbering="topic" />

      <nav className="mt-5 flex items-stretch gap-3" aria-label="Subtopic navigation">
        {prevSub ? (
          <Link
            href={`/topics/${topic.slug}/${prevSub.slug}`}
            className="flex min-w-0 flex-1 flex-col rounded-[var(--radius-card)] border border-[hsl(var(--border))] px-4 py-3 hover:bg-[hsl(var(--surface-2))]"
          >
            <span className="text-xs text-[hsl(var(--text-subtle))]">← Previous subtopic</span>
            <span className="truncate text-sm font-medium">{prevSub.name}</span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {nextSub ? (
          <Link
            href={`/topics/${topic.slug}/${nextSub.slug}`}
            className="flex min-w-0 flex-1 flex-col rounded-[var(--radius-card)] border border-[hsl(var(--border))] px-4 py-3 text-right hover:bg-[hsl(var(--surface-2))]"
          >
            <span className="text-xs text-[hsl(var(--text-subtle))]">Next subtopic →</span>
            <span className="truncate text-sm font-medium">{nextSub.name}</span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </nav>
    </>
  );
}
