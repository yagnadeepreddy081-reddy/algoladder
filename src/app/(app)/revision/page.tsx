import Link from 'next/link';

import {
  Card,
  CardHeader,
  DifficultyBadge,
  EmptyState,
  PageHeader,
  StatTile,
  buttonClass,
} from '@/components/ui/primitives';
import { ReviewCard } from '@/components/revision/review-card';
import { PremiumLock } from '@/components/premium/lock';
import { requireUser } from '@/lib/auth/session';
import { getSubscription } from '@/lib/actions/subscription';
import { canAccessFeature } from '@/lib/premium';
import { getAllRevisions, getDueRevisions } from '@/lib/data/dashboard';
import { describeDue } from '@/lib/spaced-repetition';

export const metadata = { title: 'Revision' };
export const dynamic = 'force-dynamic';

export default async function RevisionPage() {
  const user = await requireUser('/revision');

  const [subscription, due, all] = await Promise.all([
    getSubscription(user.id),
    getDueRevisions(user.id, 50),
    getAllRevisions(user.id),
  ]);

  const premium = canAccessFeature(subscription, user.role);
  const upcoming = all.filter((r) => !due.some((d) => d.id === r.id));

  return (
    <>
      <PageHeader
        title="Revision"
        description="Spaced repetition for problems you have solved. Grade each review honestly and the scheduler decides when you see it again."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatTile label="On the list" value={all.length} />
        <StatTile label="Due today" value={due.length} tone="violet" />
        <StatTile
          label="Next up"
          value={
            upcoming.length ? (
              <span className="text-base">{describeDue(upcoming[0].dueDate)}</span>
            ) : (
              <span className="text-base">—</span>
            )
          }
        />
      </div>

      {/* ------------------------------------------------------ due today */}
      <section className="mb-5">
        <h2 className="mb-3 text-lg font-semibold text-[hsl(var(--text))]">
          Due now {due.length ? `(${due.length})` : ''}
        </h2>

        {!premium && due.length > 0 ? (
          <PremiumLock
            title="The grading scheduler is part of Pro"
            description="Your revision list, the due dates you set by hand and the problems on it all stay free. What Pro adds is the four-point grading that moves each problem's next date automatically."
            feature="the revision scheduler"
            preview={
              <div className="space-y-2 p-4">
                {due.slice(0, 2).map((p) => (
                  <p key={p.id} className="text-sm text-[hsl(var(--text))]">
                    {p.title}
                  </p>
                ))}
              </div>
            }
          />
        ) : due.length ? (
          <div className="space-y-3">
            {due.map((p) => (
              <ReviewCard
                key={p.id}
                problemId={p.id}
                slug={p.slug}
                title={p.title}
                difficulty={p.difficulty}
                topicName={p.topicName}
                platform={p.platform}
                externalUrl={p.externalUrl}
                dueDate={p.dueDate}
                reviewCount={p.reviewCount}
                intervalDays={p.intervalDays}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nothing due right now"
            description={
              all.length
                ? 'Everything on your revision list is scheduled for later. Come back when something is due.'
                : 'Add problems to your revision list from any problem page, or mark one as "needs revision".'
            }
            action={
              <Link href="/problems" className={buttonClass('outline', 'md')}>
                Find problems to add
              </Link>
            }
          />
        )}
      </section>

      {/* ------------------------------------------------------- upcoming */}
      {upcoming.length ? (
        <Card>
          <CardHeader
            title={`Scheduled later (${upcoming.length})`}
            description="Problems the scheduler has pushed out. The interval grows each time you grade one well."
          />
          <ul className="divide-y divide-[hsl(var(--border))] px-4 pb-2">
            {upcoming.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                <Link
                  href={`/problems/${p.slug}`}
                  className="min-w-0 flex-1 truncate text-sm font-medium text-[hsl(var(--text))] hover:underline"
                >
                  {p.title}
                </Link>
                <DifficultyBadge difficulty={p.difficulty} />
                <span className="tabular w-32 shrink-0 text-right text-xs text-[hsl(var(--text-muted))]">
                  {describeDue(p.dueDate)}
                </span>
                <span className="tabular w-24 shrink-0 text-right text-xs text-[hsl(var(--text-subtle))]">
                  every {p.intervalDays}d
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </>
  );
}
