import Link from 'next/link';

import { Card, CardHeader, PageHeader, StatTile, buttonClass } from '@/components/ui/primitives';
import {
  DailySolvesChart,
  DifficultyDonut,
  PatternCoverageChart,
  TopicCompletionChart,
} from '@/components/charts';
import { PremiumLock } from '@/components/premium/lock';
import { requireUser } from '@/lib/auth/session';
import { getSubscription } from '@/lib/actions/subscription';
import { canAccessFeature } from '@/lib/premium';
import { getAnalytics, getDashboardStats, getTopicProgress } from '@/lib/data/dashboard';
import { formatDuration, percentOf } from '@/lib/progress';
import type { Difficulty } from '@/lib/types';

export const metadata = { title: 'Analytics' };
export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const user = await requireUser('/analytics');

  const [subscription, stats, topics] = await Promise.all([
    getSubscription(user.id),
    getDashboardStats(user.id),
    getTopicProgress(user.id),
  ]);

  const premium = canAccessFeature(subscription, user.role);

  const topicData = topics.map((t) => ({
    topic: t.topicName,
    percent: percentOf(t.solved, t.total),
    solved: t.solved,
    total: t.total,
  }));

  const difficultyData = (['Easy', 'Medium', 'Hard'] as Difficulty[]).map((d) => ({
    difficulty: d,
    solved: stats.byDifficulty[d].solved,
    total: stats.byDifficulty[d].total,
  }));

  // The basic half of this page is free; the pattern/time breakdown is not.
  const analytics = premium ? await getAnalytics(user.id) : null;

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Every figure on this page is computed from your own solve history in the database. Empty charts mean there is nothing recorded yet, not that something is broken."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Completion"
          value={`${stats.completionPercent}%`}
          sub={`${stats.solved} of ${stats.totalProblems}`}
          tone="brand"
        />
        <StatTile label="Current streak" value={`${stats.currentStreak}d`} />
        <StatTile label="Longest streak" value={`${stats.longestStreak}d`} />
        <StatTile
          label="Time logged"
          value={analytics ? formatDuration(analytics.totalTimeSeconds) : '—'}
          sub={premium ? 'across all problems' : 'Pro'}
        />
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        <DifficultyDonut data={difficultyData} totalSolved={stats.solved} />

        <Card>
          <CardHeader
            title="Completion by topic"
            description="Where the gaps are. Read it as a to-do list from the bottom up."
          />
          <div className="px-3 pb-5">
            <TopicCompletionChart data={topicData} />
          </div>
        </Card>
      </div>

      {/* ------------------------------------------------- premium section */}
      {premium && analytics ? (
        <>
          <div className="mb-5 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Solves per day"
                description="The last ninety days. Consistency beats intensity here."
              />
              <div className="px-3 pb-5">
                <DailySolvesChart data={analytics.daily} />
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Pattern coverage"
                description="Grouped by the algorithmic family rather than by topic. A low bar is a blind spot."
              />
              <div className="px-3 pb-5">
                <PatternCoverageChart data={analytics.byPattern} />
              </div>
            </Card>
          </div>

          <div className="mb-5 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Weakest topics"
                description="Ranked by completion. Start at the top of this list."
              />
              <ol className="space-y-2 px-4 pb-4">
                {analytics.hardestTopics.map((t, i) => (
                  <li
                    key={t.topic}
                    className="flex items-center gap-3 rounded-lg bg-[hsl(var(--surface-2))] px-3 py-2"
                  >
                    <span className="tabular w-5 text-sm font-semibold text-[hsl(var(--text-subtle))]">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-[hsl(var(--text))]">
                      {t.topic}
                    </span>
                    <span className="tabular shrink-0 text-xs text-[hsl(var(--text-muted))]">
                      {t.solved}/{t.total} · {t.percent}%
                    </span>
                  </li>
                ))}
              </ol>
            </Card>

            <Card>
              <CardHeader
                title="Effort"
                description="Only counts the time you logged yourself on a problem page."
              />
              <div className="px-4 pb-4">
                <dl className="mb-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-[hsl(var(--surface-2))] px-4 py-3">
                    <dt className="text-xs text-[hsl(var(--text-muted))]">Total attempts</dt>
                    <dd className="tabular mt-1 text-lg font-semibold">{analytics.totalAttempts}</dd>
                  </div>
                  <div className="rounded-lg bg-[hsl(var(--surface-2))] px-4 py-3">
                    <dt className="text-xs text-[hsl(var(--text-muted))]">Attempts per solve</dt>
                    <dd className="tabular mt-1 text-lg font-semibold">
                      {analytics.avgAttemptsPerSolve || '—'}
                    </dd>
                  </div>
                </dl>

                {analytics.timeByTopic.length ? (
                  <ul className="space-y-1.5">
                    {analytics.timeByTopic.map((t) => (
                      <li key={t.topic} className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate text-[hsl(var(--text-muted))]">{t.topic}</span>
                        <span className="tabular shrink-0 font-medium">
                          {formatDuration(t.minutes * 60)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[hsl(var(--text-muted))]">
                    You have not logged any time yet. Use the &ldquo;Time spent&rdquo; box on a
                    problem page and this fills in.
                  </p>
                )}
              </div>
            </Card>
          </div>
        </>
      ) : (
        <PremiumLock
          title="Advanced analytics is part of Pro"
          description="The completion charts above stay free. Pro adds solves-per-day over ninety days, pattern-level coverage, your weakest topics ranked, and time invested per topic."
          feature="advanced analytics"
        />
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <Link href="/topics" className={buttonClass('outline', 'md')}>
          Go to the roadmap
        </Link>
        <Link href="/settings#export" className={buttonClass('ghost', 'md')}>
          Export your data
        </Link>
      </div>
    </>
  );
}
