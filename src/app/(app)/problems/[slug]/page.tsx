import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  Badge,
  Card,
  CardHeader,
  DifficultyBadge,
  PageHeader,
  StatusPill,
  buttonClass,
} from '@/components/ui/primitives';
import {
  MarkSolvedButton,
  RevisionToggle,
  BookmarkToggle,
  StarToggle,
  SolveLink,
  StatusSelect,
} from '@/components/problems/controls';
import { ApproachDisclosure, HintList } from '@/components/problems/hints';
import { CodePlayground } from '@/components/problems/code-playground';
import { ProblemStatement } from '@/components/problems/statement';
import { ProgressPanel } from '@/components/problems/progress-panel';
import { NotesPanel } from '@/components/problems/notes-panel';
import { ReportDialog } from '@/components/problems/report-dialog';
import { PremiumLock } from '@/components/premium/lock';
import { requireUser } from '@/lib/auth/session';
import { getSubscription } from '@/lib/actions/subscription';
import { canAccessProblem, FREE_NOTE_PROBLEM_LIMIT, isPremiumActive } from '@/lib/premium';
import {
  getAdjacentProblems,
  getProblemBySlug,
  getRelatedProblems,
} from '@/lib/data/problems';
import { listNotesForProblem } from '@/lib/actions/notes';
import { getCodeDrafts } from '@/lib/data/code';
import { queryOne } from '@/lib/db';
import { describeDue } from '@/lib/spaced-repetition';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const problem = await getProblemBySlug(slug, null).catch(() => null);
  if (!problem) return { title: 'Problem not found' };
  return {
    title: problem.title,
    description: problem.description,
  };
}

export default async function ProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/problems/${slug}`);

  const problem = await getProblemBySlug(slug, user.id);
  if (!problem) notFound();

  const [subscription, adjacent, related, notes, noteProblemCount, codeDrafts] = await Promise.all([
    getSubscription(user.id),
    getAdjacentProblems(problem.recommendedOrder),
    getRelatedProblems(problem, user.id, 6),
    listNotesForProblem(user.id, problem.id),
    queryOne<{ n: number }>(
      'SELECT count(DISTINCT problem_id)::int AS n FROM notes WHERE user_id = $1',
      [user.id],
    ),
    getCodeDrafts(user.id, problem.id),
  ]);

  const premium = isPremiumActive(subscription) || user.role === 'admin';
  const unlocked = canAccessProblem(problem, subscription, user.role);
  const status = problem.progress?.status ?? 'not_started';

  // Free accounts can keep notes on a limited number of distinct problems.
  const notesUsed = noteProblemCount?.n ?? 0;
  const notesLocked =
    !premium && notes.length === 0 && notesUsed >= FREE_NOTE_PROBLEM_LIMIT;

  return (
    <>
      <PageHeader
        breadcrumb={
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[hsl(var(--text-muted))]">
            <Link href="/topics" className="hover:text-[hsl(var(--text))] hover:underline">
              Topics
            </Link>
            <span aria-hidden>/</span>
            <Link href={`/topics/${problem.topicSlug}`} className="hover:text-[hsl(var(--text))] hover:underline">
              {problem.topicName}
            </Link>
            <span aria-hidden>/</span>
            <Link
              href={`/topics/${problem.topicSlug}/${problem.subtopicSlug}`}
              className="hover:text-[hsl(var(--text))] hover:underline"
            >
              {problem.subtopicName}
            </Link>
          </nav>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="tabular text-[hsl(var(--text-subtle))]">#{problem.overallNo}</span>
            {problem.title}
          </span>
        }
        description={`${problem.topicName} · ${problem.subtopicName} · problem ${problem.problemNoInTopic} of this topic`}
      />

      {/* ------------------------------------------------- action toolbar */}
      <Card className="mb-6 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyBadge difficulty={problem.difficulty} />
          <StatusPill status={status} />
          {problem.isPremium ? <Badge tone="violet">Premium</Badge> : null}
          {problem.progress?.nextReviewDate ? (
            <Badge tone="blue">{describeDue(problem.progress.nextReviewDate)}</Badge>
          ) : null}

          <span className="flex-1" />

          <div className="flex items-center gap-1">
            <BookmarkToggle
              problemId={problem.id}
              slug={problem.slug}
              bookmarked={Boolean(problem.progress?.isBookmarked)}
            />
            <StarToggle
              problemId={problem.id}
              slug={problem.slug}
              starred={Boolean(problem.progress?.isStarred)}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <SolveLink url={problem.externalUrl} platform={problem.platform} />
          <MarkSolvedButton problemId={problem.id} slug={problem.slug} status={status} />
          <RevisionToggle
            problemId={problem.id}
            slug={problem.slug}
            inRevision={Boolean(problem.progress?.inRevision)}
            variant="button"
          />
          <StatusSelect problemId={problem.id} slug={problem.slug} status={status} size="md" />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* -------------------------------------------------------- main */}
        <div className="min-w-0 space-y-6">
          <ProblemStatement
            description={problem.description}
            ioFormat={problem.ioFormat}
            examples={problem.examples}
            constraints={problem.constraints}
            platform={problem.platform}
            externalUrl={problem.externalUrl}
          />

          {/* write and run a solution without leaving the page */}
          <CodePlayground problemId={problem.id} drafts={codeDrafts} />

          {/* hints + approach, or the lock */}
          {unlocked ? (
            <>
              <HintList hints={problem.hints} />
              <ApproachDisclosure
                approach={problem.approach}
                patternName={problem.patternName}
                timeComplexity={problem.timeComplexity}
                spaceComplexity={problem.spaceComplexity}
              />
            </>
          ) : (
            <PremiumLock
              title="Hints and approach are part of Pro"
              description="You can still open this problem on its host site, mark it solved and keep notes — the free preview above is the whole statement. Pro unlocks the progressive hints, the written approach and the complexity targets."
              feature="premium learning paths"
              preview={
                <div className="p-5">
                  <p className="text-sm font-semibold text-[hsl(var(--text))]">Hints</p>
                  <p className="mt-2 text-sm text-[hsl(var(--text-muted))]">
                    {problem.hints[0]?.slice(0, 90)}…
                  </p>
                </div>
              }
            />
          )}

          <NotesPanel
            problemId={problem.id}
            slug={problem.slug}
            notes={notes}
            locked={notesLocked}
            lockReason={`Free accounts keep notes on ${FREE_NOTE_PROBLEM_LIMIT} problems, and you have used all of them. Upgrade for unlimited notes, or delete some from the Notes page.`}
          />

          {/* previous / next */}
          <nav className="flex items-stretch gap-3" aria-label="Problem navigation">
            {adjacent.prev ? (
              <Link
                href={`/problems/${adjacent.prev.slug}`}
                className="group flex min-w-0 flex-1 flex-col rounded-[var(--radius-card)] border border-[hsl(var(--border))] px-4 py-3 hover:bg-[hsl(var(--surface-2))]"
              >
                <span className="text-xs text-[hsl(var(--text-subtle))]">← Previous</span>
                <span className="truncate text-sm font-medium text-[hsl(var(--text))]">
                  {adjacent.prev.title}
                </span>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
            {adjacent.next ? (
              <Link
                href={`/problems/${adjacent.next.slug}`}
                className="group flex min-w-0 flex-1 flex-col rounded-[var(--radius-card)] border border-[hsl(var(--border))] px-4 py-3 text-right hover:bg-[hsl(var(--surface-2))]"
              >
                <span className="text-xs text-[hsl(var(--text-subtle))]">Next →</span>
                <span className="truncate text-sm font-medium text-[hsl(var(--text))]">
                  {adjacent.next.title}
                </span>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
          </nav>
        </div>

        {/* -------------------------------------------------------- side */}
        <aside className="min-w-0 space-y-6">
          <ProgressPanel problemId={problem.id} slug={problem.slug} progress={problem.progress} />

          <Card>
            <CardHeader title="Classification" />
            <dl className="space-y-3 px-5 pb-5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-[hsl(var(--text-muted))]">Topic</dt>
                <dd className="text-right">
                  <Link href={`/topics/${problem.topicSlug}`} className="hover:underline">
                    {problem.topicName}
                  </Link>
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[hsl(var(--text-muted))]">Subtopic</dt>
                <dd className="text-right">
                  <Link
                    href={`/topics/${problem.topicSlug}/${problem.subtopicSlug}`}
                    className="hover:underline"
                  >
                    {problem.subtopicName}
                  </Link>
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[hsl(var(--text-muted))]">Pattern</dt>
                <dd className="text-right">{problem.patternName}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[hsl(var(--text-muted))]">In topic</dt>
                <dd className="tabular text-right">
                  {problem.problemNoInTopic} of this topic
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[hsl(var(--text-muted))]">Platform</dt>
                <dd className="text-right">{problem.platform}</dd>
              </div>

              <div className="border-t border-[hsl(var(--border))] pt-3">
                <dt className="mb-1.5 text-[hsl(var(--text-muted))]">Tags</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {problem.tags.map((t) => (
                    <Link key={t} href={`/problems?tags=${encodeURIComponent(t)}`}>
                      <Badge>{t}</Badge>
                    </Link>
                  ))}
                </dd>
              </div>

              {problem.companies.length ? (
                <div className="border-t border-[hsl(var(--border))] pt-3">
                  <dt className="mb-1.5 text-[hsl(var(--text-muted))]">Reported by candidates at</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {problem.companies.map((c) =>
                      premium ? (
                        <Link key={c} href={`/problems?companies=${encodeURIComponent(c)}`}>
                          <Badge tone="blue">{c}</Badge>
                        </Link>
                      ) : (
                        <Badge key={c} tone="blue">
                          {c}
                        </Badge>
                      ),
                    )}
                  </dd>
                  {!premium ? (
                    <p className="mt-2 text-xs text-[hsl(var(--text-subtle))]">
                      Filtering the whole ladder by company is a Pro feature.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </dl>
          </Card>

          {related.length ? (
            <Card>
              <CardHeader title="Related problems" description="Same pattern or same corner of the topic." />
              <ul className="space-y-1 px-5 pb-5">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/problems/${r.slug}`}
                      className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-[hsl(var(--surface-2))]"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm text-[hsl(var(--text))]">
                        {r.title}
                      </span>
                      <DifficultyBadge difficulty={r.difficulty} />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <div className="flex flex-col items-start gap-2 px-1">
            <ReportDialog problemId={problem.id} title={problem.title} />
            <Link href="/problems" className={buttonClass('ghost', 'sm', 'px-1')}>
              ← Back to all problems
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
