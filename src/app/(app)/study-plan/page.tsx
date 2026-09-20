import Link from 'next/link';

import {
  Card,
  CardHeader,
  DifficultyBadge,
  PageHeader,
  ProgressBar,
  StatTile,
} from '@/components/ui/primitives';
import { DeletePlanButton, PlanForm } from '@/components/study-plan/plan-form';
import { PremiumLock } from '@/components/premium/lock';
import { requireUser } from '@/lib/auth/session';
import { getSubscription } from '@/lib/actions/subscription';
import { canAccessFeature } from '@/lib/premium';
import { getActivePlan, getPlanSchedule } from '@/lib/actions/study-plan';
import { listTopics } from '@/lib/data/problems';
import { percentOf } from '@/lib/progress';

export const metadata = { title: 'Study plan' };
export const dynamic = 'force-dynamic';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function StudyPlanPage() {
  const user = await requireUser('/study-plan');
  const subscription = await getSubscription(user.id);
  const premium = canAccessFeature(subscription, user.role);

  if (!premium) {
    return (
      <>
        <PageHeader
          title="Study plan"
          description="Turn the ladder into a dated schedule you can actually follow."
        />
        <PremiumLock
          title="Custom study plans are part of Pro"
          description="Choose your topics, your difficulty mix and your pace, and AlgoLadder dates out the unsolved problems in recommended order — then tracks the plan day by day against your real progress."
          feature="custom study plans"
        />
      </>
    );
  }

  const [plan, topics] = await Promise.all([getActivePlan(user.id), listTopics()]);
  const schedule = plan ? await getPlanSchedule(plan.id, user.id) : [];

  const today = todayISO();
  const todayDay = schedule.find((d) => d.date === today);
  const overdue = schedule.filter((d) => d.date < today && d.problems.some((p) => !p.solved));
  const upcoming = schedule.filter((d) => d.date > today).slice(0, 7);

  return (
    <>
      <PageHeader
        title="Study plan"
        description="A dated schedule built from your unsolved problems. Completing a problem anywhere in AlgoLadder ticks it off here."
        action={plan ? <DeletePlanButton planId={plan.id} /> : null}
      />

      {plan ? (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Plan" value={<span className="text-base">{plan.name}</span>} />
            <StatTile
              label="Progress"
              value={`${percentOf(plan.completedItems, plan.totalItems)}%`}
              sub={`${plan.completedItems} of ${plan.totalItems}`}
              tone="brand"
            />
            <StatTile label="Pace" value={`${plan.problemsPerDay}/day`} />
            <StatTile
              label="Runs until"
              value={<span className="text-base">{plan.endDate ?? '—'}</span>}
            />
          </div>

          <Card className="mb-6 p-5">
            <ProgressBar
              value={plan.completedItems}
              total={plan.totalItems}
              size="lg"
              showLabel
              label="Plan completion"
            />
            {plan.description ? (
              <p className="mt-3 text-sm text-[hsl(var(--text-muted))]">{plan.description}</p>
            ) : null}
          </Card>

          {/* -------------------------------------------------- overdue */}
          {overdue.length ? (
            <Card className="mb-6 border-amber-300 dark:border-amber-900">
              <CardHeader
                title={`Behind schedule (${overdue.reduce((n, d) => n + d.problems.filter((p) => !p.solved).length, 0)})`}
                description="Days that have passed with problems still unsolved. Catch up or rebuild the plan at a gentler pace."
              />
              <ul className="divide-y divide-[hsl(var(--border))] px-5 pb-3">
                {overdue.flatMap((d) =>
                  d.problems
                    .filter((p) => !p.solved)
                    .map((p) => (
                      <li key={`${d.date}-${p.id}`} className="flex items-center gap-3 py-2.5">
                        <span className="tabular w-24 shrink-0 text-xs text-[hsl(var(--text-subtle))]">
                          {d.date}
                        </span>
                        <Link
                          href={`/problems/${p.slug}`}
                          className="min-w-0 flex-1 truncate text-sm hover:underline"
                        >
                          {p.title}
                        </Link>
                        <DifficultyBadge difficulty={p.difficulty} />
                      </li>
                    )),
                )}
              </ul>
            </Card>
          ) : null}

          {/* ---------------------------------------------------- today */}
          <Card className="mb-6">
            <CardHeader
              title="Today"
              description={
                todayDay
                  ? `${todayDay.problems.filter((p) => p.solved).length} of ${todayDay.problems.length} done.`
                  : 'Nothing scheduled for today.'
              }
            />
            <div className="px-5 pb-5">
              {todayDay ? (
                <ul className="space-y-1">
                  {todayDay.problems.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/problems/${p.slug}`}
                        className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-[hsl(var(--surface-2))]"
                      >
                        <span
                          aria-hidden
                          className={
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ' +
                            (p.solved
                              ? 'border-brand-500 bg-brand-500 text-white dark:text-brand-950'
                              : 'border-[hsl(var(--border-strong))]')
                          }
                        >
                          {p.solved ? '✓' : ''}
                        </span>
                        <span
                          className={
                            'min-w-0 flex-1 truncate text-sm ' +
                            (p.solved
                              ? 'text-[hsl(var(--text-subtle))] line-through'
                              : 'text-[hsl(var(--text))]')
                          }
                        >
                          {p.title}
                        </span>
                        <span className="hidden shrink-0 text-xs text-[hsl(var(--text-muted))] sm:block">
                          {p.topicName}
                        </span>
                        <DifficultyBadge difficulty={p.difficulty} />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-4 text-center text-sm text-[hsl(var(--text-muted))]">
                  Rest day, or the plan has finished. Either is fine.
                </p>
              )}
            </div>
          </Card>

          {/* ------------------------------------------------- upcoming */}
          {upcoming.length ? (
            <Card className="mb-6">
              <CardHeader title="The week ahead" description="What the plan has queued up next." />
              <div className="space-y-4 px-5 pb-5">
                {upcoming.map((d) => (
                  <div key={d.date}>
                    <p className="mb-1.5 text-xs font-medium tracking-wide text-[hsl(var(--text-muted))] uppercase">
                      {new Date(`${d.date}T00:00:00Z`).toLocaleDateString(undefined, {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                    <ul className="space-y-0.5">
                      {d.problems.map((p) => (
                        <li key={p.id} className="flex items-center gap-2 text-sm">
                          <Link
                            href={`/problems/${p.slug}`}
                            className="min-w-0 flex-1 truncate text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))] hover:underline"
                          >
                            {p.title}
                          </Link>
                          <DifficultyBadge difficulty={p.difficulty} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </>
      ) : null}

      <PlanForm topics={topics} />
    </>
  );
}
