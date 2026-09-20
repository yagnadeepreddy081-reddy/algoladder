import Link from 'next/link';

import { Card, CardHeader, PageHeader, StatTile, buttonClass } from '@/components/ui/primitives';
import { TopicPremiumToggle } from '@/components/admin/controls';
import { getAdminStats, listTopicsForAdmin } from '@/lib/actions/admin';
import { EXPECTED_TOTAL } from '@/lib/validate-dataset';

export const metadata = { title: 'Admin' };
export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  const [stats, topics] = await Promise.all([getAdminStats(), listTopicsForAdmin()]);
  const countOk = stats.activeProblems === EXPECTED_TOTAL;

  return (
    <>
      <PageHeader
        title="Admin overview"
        description="The state of the dataset and the people using it."
        action={
          <Link href="/admin/data" className={buttonClass('outline', 'md')}>
            Run dataset validation
          </Link>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Active problems"
          value={stats.activeProblems}
          sub={countOk ? `exactly ${EXPECTED_TOTAL}` : `expected ${EXPECTED_TOTAL}`}
          tone={countOk ? 'brand' : 'red'}
        />
        <StatTile label="Topics" value={stats.topics} sub={`${stats.subtopics} subtopics`} />
        <StatTile label="Premium problems" value={stats.premiumProblems} tone="violet" />
        <StatTile label="Open reports" value={stats.openReports} tone={stats.openReports ? 'amber' : 'default'} />
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Users" value={stats.users} sub={`${stats.admins} admin`} />
        <StatTile label="New this week" value={stats.newUsersThisWeek} />
        <StatTile label="Active this week" value={stats.activeUsersThisWeek} />
        <StatTile label="Paid accounts" value={stats.paidUsers} tone="brand" />
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <StatTile label="Total solves recorded" value={stats.totalSolves} />
        <StatTile label="Notes written" value={stats.notes} />
      </div>

      {!countOk ? (
        <Card className="mb-6 border-rose-300 p-5 dark:border-rose-900">
          <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">
            The dataset does not hold exactly {EXPECTED_TOTAL} active problems.
          </p>
          <p className="mt-1 text-sm text-rose-700 dark:text-rose-400">
            There are {stats.activeProblems}. `npm run build` will refuse to run until this is fixed —
            either re-seed with <code className="font-mono">npm run db:seed -- --prune</code> or add
            the missing entries from the problem editor.
          </p>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title="Topics"
          description="Flipping a topic to premium marks every problem inside it premium too."
        />
        <ul className="divide-y divide-[hsl(var(--border))] px-5 pb-2">
          {topics.map((t) => (
            <li key={String(t.id)} className="flex flex-wrap items-center gap-3 py-3">
              <span className="tabular w-6 shrink-0 text-sm text-[hsl(var(--text-subtle))]">
                {Number(t.position)}
              </span>
              <Link
                href={`/topics/${String(t.slug)}`}
                className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
              >
                {String(t.name)}
              </Link>
              <span className="tabular w-16 shrink-0 text-right text-xs text-[hsl(var(--text-muted))]">
                {Number(t.problem_count)}
              </span>
              <TopicPremiumToggle topicId={String(t.id)} isPremium={Boolean(t.is_premium)} />
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
