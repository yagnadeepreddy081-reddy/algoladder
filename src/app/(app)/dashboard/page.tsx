import Link from 'next/link';

import {
  Badge,
  Card,
  CardHeader,
  DifficultyBadge,
  EmptyState,
  PageHeader,
  ProgressBar,
  StatTile,
  buttonClass,
} from '@/components/ui/primitives';
import { DifficultyDonut, WeeklyActivityChart } from '@/components/charts';
import { requireUser } from '@/lib/auth/session';
import {
  getContinueProblem,
  getDashboardStats,
  getDueRevisions,
  getRecentActivity,
  getRecommendedProblem,
  getTopicProgress,
} from '@/lib/data/dashboard';
import { percentOf, precisePercentOf } from '@/lib/progress';
import { describeDue } from '@/lib/spaced-repetition';
import type { Difficulty } from '@/lib/types';

export const metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

const ACTION_LABEL: Record<string, string> = {
  solved: 'Solved',
  attempted: 'Attempted',
  reviewed: 'Reviewed',
  bookmarked: 'Bookmarked',
  unbookmarked: 'Removed bookmark from',
  note_added: 'Added a note to',
  status_changed: 'Updated',
  signed_in: 'Signed in',
  signed_up: 'Created your account',
  trial_started: 'Started a trial',
  mock_upgrade: 'Changed plan',
  password_reset: 'Reset your password',
  progress_reset: 'Cleared all progress',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default async function DashboardPage() {
  const user = await requireUser('/dashboard');

  const [stats, topics, activity, continueProblem, recommended, due] = await Promise.all([
    getDashboardStats(user.id),
    getTopicProgress(user.id),
    getRecentActivity(user.id, 10),
    getContinueProblem(user.id),
    getRecommendedProblem(user.id),
    getDueRevisions(user.id, 5),
  ]);

  const difficultyData = (['Easy', 'Medium', 'Hard'] as Difficulty[]).map((d) => ({
    difficulty: d,
    solved: stats.byDifficulty[d].solved,
    total: stats.byDifficulty[d].total,
  }));

  const topTopics = [...topics]
    .filter((t) => t.solved > 0 && t.solved < t.total)
    .sort((a, b) => percentOf(b.solved, b.total) - percentOf(a.solved, a.total))
    .slice(0, 5);

  const firstName = user.displayName.split(' ')[0];

  return (
    <>
      <PageHeader
        title={`Hello, ${firstName}`}
        description={
          stats.solved === 0
            ? `The ladder has ${stats.totalProblems} rungs. The first one is the only one that matters today.`
            : `${stats.solved} of ${stats.totalProblems} done — ${precisePercentOf(stats.solved, stats.totalProblems)}% of the way up.`
        }
        action={
          <Link href="/problems" className={buttonClass('outline', 'md')}>
            Browse all problems
          </Link>
        }
      />

      {/* --------------------------------------------------------- tiles */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Total problems"
          value={stats.totalProblems}
          sub="across 19 topics"
        />
        <StatTile
          label="Solved"
          value={stats.solved}
          sub={`${stats.completionPercent}% complete`}
          tone="brand"
        />
        <StatTile label="In progress" value={stats.inProgress} tone="amber" />
        <StatTile
          label="Needs revision"
          value={stats.needsRevision}
          sub={stats.dueForRevision ? `${stats.dueForRevision} due today` : 'nothing due'}
          tone="violet"
        />
      </div>

      <Card className="mb-5 p-4">
        <ProgressBar
          value={stats.solved}
          total={stats.totalProblems}
          size="lg"
          showLabel
          label="Overall completion"
        />
        <div className="tabular mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p className="text-xs text-[hsl(var(--text-muted))]">Current streak</p>
            <p className="mt-0.5 text-lg font-semibold text-[hsl(var(--text))]">
              {stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}
            </p>
          </div>
          <div>
            <p className="text-xs text-[hsl(var(--text-muted))]">Longest streak</p>
            <p className="mt-0.5 text-lg font-semibold text-[hsl(var(--text))]">
              {stats.longestStreak} {stats.longestStreak === 1 ? 'day' : 'days'}
            </p>
          </div>
          <div>
            <p className="text-xs text-[hsl(var(--text-muted))]">Solved this week</p>
            <p className="mt-0.5 text-lg font-semibold text-[hsl(var(--text))]">
              {stats.solvedThisWeek}
            </p>
          </div>
          <div>
            <p className="text-xs text-[hsl(var(--text-muted))]">Bookmarked</p>
            <p className="mt-0.5 text-lg font-semibold text-[hsl(var(--text))]">{stats.bookmarked}</p>
          </div>
        </div>
      </Card>

      {/* --------------------------------------------------- next up row */}
      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col p-4">
          <p className="text-xs font-medium tracking-wide text-[hsl(var(--text-muted))] uppercase">
            Continue where you left off
          </p>
          {continueProblem ? (
            <>
              <h2 className="mt-2 text-lg font-semibold text-[hsl(var(--text))]">
                <Link href={`/problems/${continueProblem.slug}`} className="hover:underline">
                  {continueProblem.title}
                </Link>
              </h2>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[hsl(var(--text-muted))]">
                <DifficultyBadge difficulty={continueProblem.difficulty} />
                <span>{continueProblem.topicName}</span>
              </p>
              <p className="mt-2 line-clamp-2 flex-1 text-sm text-[hsl(var(--text-muted))]">
                {continueProblem.description}
              </p>
              <div className="mt-4">
                <Link
                  href={`/problems/${continueProblem.slug}`}
                  className={buttonClass('primary', 'md')}
                >
                  Pick it back up
                </Link>
              </div>
            </>
          ) : (
            <p className="mt-2 flex-1 text-sm text-[hsl(var(--text-muted))]">
              Nothing is in progress. Start something below and it will show up here.
            </p>
          )}
        </Card>

        <Card className="flex flex-col p-4">
          <p className="text-xs font-medium tracking-wide text-[hsl(var(--text-muted))] uppercase">
            Recommended next
          </p>
          {recommended ? (
            <>
              <h2 className="mt-2 text-lg font-semibold text-[hsl(var(--text))]">
                <Link href={`/problems/${recommended.slug}`} className="hover:underline">
                  {recommended.title}
                </Link>
              </h2>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[hsl(var(--text-muted))]">
                <DifficultyBadge difficulty={recommended.difficulty} />
                <span>{recommended.topicName}</span>
                <Badge>{recommended.patternName}</Badge>
              </p>
              <p className="mt-2 line-clamp-2 flex-1 text-sm text-[hsl(var(--text-muted))]">
                {recommended.description}
              </p>
              <div className="mt-4">
                <Link href={`/problems/${recommended.slug}`} className={buttonClass('primary', 'md')}>
                  Start this one
                </Link>
              </div>
            </>
          ) : (
            <p className="mt-2 flex-1 text-sm text-[hsl(var(--text-muted))]">
              You have started every problem on the ladder. That is the whole thing.
            </p>
          )}
        </Card>
      </div>

      {/* --------------------------------------------------------- charts */}
      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        <WeeklyActivityChart data={stats.weeklyActivity} />
        <DifficultyDonut data={difficultyData} totalSolved={stats.solved} />
      </div>

      {/* ------------------------------------------------- revision + topics */}
      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Due for revision today"
            description={
              stats.dueForRevision
                ? `${stats.dueForRevision} problem${stats.dueForRevision === 1 ? '' : 's'} the scheduler wants you to see.`
                : 'Nothing is due. The scheduler will tell you when something is.'
            }
            action={
              due.length ? (
                <Link href="/revision" className={buttonClass('outline', 'sm')}>
                  Review now
                </Link>
              ) : null
            }
          />
          <div className="px-4 pb-4">
            {due.length ? (
              <ul className="space-y-1">
                {due.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/problems/${p.slug}`}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-[hsl(var(--surface-2))]"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm text-[hsl(var(--text))]">
                        {p.title}
                      </span>
                      <span className="shrink-0 text-xs text-[hsl(var(--text-muted))]">
                        {describeDue(p.dueDate)}
                      </span>
                      <DifficultyBadge difficulty={p.difficulty} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-sm text-[hsl(var(--text-muted))]">
                Nothing due today. Add problems to your revision list as you solve them.
              </p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Topics in flight"
            description="Started but not finished. Closing one out beats opening a sixth."
            action={
              <Link href="/topics" className={buttonClass('outline', 'sm')}>
                All topics
              </Link>
            }
          />
          <div className="px-4 pb-4">
            {topTopics.length ? (
              <ul className="space-y-3">
                {topTopics.map((t) => (
                  <li key={t.topicId}>
                    <Link href={`/topics/${t.topicSlug}`} className="group block">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="min-w-0 truncate text-sm text-[hsl(var(--text))] group-hover:underline">
                          {t.topicName}
                        </span>
                        <span className="tabular shrink-0 text-xs text-[hsl(var(--text-muted))]">
                          {t.solved}/{t.total}
                        </span>
                      </div>
                      <ProgressBar value={t.solved} total={t.total} size="sm" className="mt-1.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-sm text-[hsl(var(--text-muted))]">
                No topic is half-finished yet. Pick one from the roadmap and start at the top.
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* ------------------------------------------------- recent activity */}
      <Card>
        <CardHeader title="Recent activity" description="The last ten things you did here." />
        <div className="px-4 pb-4">
          {activity.length ? (
            <ul className="divide-y divide-[hsl(var(--border))]">
              {activity.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="text-[hsl(var(--text-muted))]">
                      {ACTION_LABEL[a.action] ?? a.action}
                    </span>{' '}
                    {a.problemSlug ? (
                      <Link
                        href={`/problems/${a.problemSlug}`}
                        className="font-medium text-[hsl(var(--text))] hover:underline"
                      >
                        {a.problemTitle}
                      </Link>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-xs text-[hsl(var(--text-subtle))]">
                    {timeAgo(a.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No activity yet"
              description="Everything you do — solving, attempting, bookmarking, noting — shows up here."
            />
          )}
        </div>
      </Card>
    </>
  );
}
