import Link from 'next/link';

import { Badge, Card, CardHeader, PageHeader, StatTile } from '@/components/ui/primitives';
import { CancelButton, PlanButton, StartTrialButton } from '@/components/premium/upgrade-controls';
import { requireUser } from '@/lib/auth/session';
import { getSubscription } from '@/lib/actions/subscription';
import {
  describePlan,
  isPremiumActive,
  mockSubscriptionsEnabled,
  paymentsEnabled,
  PLAN_PRICING,
  PREMIUM_FEATURES,
  STATUS_BADGE,
  trialDaysRemaining,
} from '@/lib/premium';

export const metadata = { title: 'Plans' };
export const dynamic = 'force-dynamic';

export default async function PremiumPage() {
  const user = await requireUser('/premium');
  const subscription = await getSubscription(user.id);

  const premium = isPremiumActive(subscription);
  const mockMode = mockSubscriptionsEnabled();
  const paymentsOn = paymentsEnabled();
  const trialDays = trialDaysRemaining(subscription);
  const trialUsed = Boolean(subscription.trialEndsAt);
  const badge = STATUS_BADGE[subscription.status];

  return (
    <>
      <PageHeader
        title="Plans"
        description="The 474 problems, the progress tracking, the notes and the bookmarks are free and stay free. Pro buys the tooling that decides what you should do next."
      />

      {/* ------------------------------------------------- current status */}
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Current plan"
          value={<span className="text-base">{describePlan(subscription)}</span>}
          tone={premium ? 'brand' : 'default'}
        />
        <StatTile
          label="Status"
          value={<span className="text-base">{badge.label}</span>}
          sub={
            subscription.currentPeriodEnd
              ? `Until ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
              : subscription.plan === 'lifetime'
                ? 'No renewal'
                : undefined
          }
        />
        <StatTile
          label="Premium access"
          value={<span className="text-base">{premium || user.role === 'admin' ? 'Active' : 'Not active'}</span>}
          sub={user.role === 'admin' ? 'Admins always have full access' : undefined}
          tone={premium ? 'brand' : 'default'}
        />
      </div>

      {/* ------------------------------------------------- dev-mode notice */}
      {mockMode && !paymentsOn ? (
        <Card className="mb-5 border-amber-300 p-4 dark:border-amber-900">
          <div className="flex flex-wrap items-start gap-3">
            <Badge tone="amber">Development mode</Badge>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[hsl(var(--text))]">
                Mock subscriptions are on, and real payments are off.
              </p>
              <p className="mt-1 text-sm text-[hsl(var(--text-muted))]">
                The buttons below change your plan in the database immediately so you can exercise
                every premium path. No card is asked for and nothing is charged. Turn this off by
                setting <code className="font-mono text-xs">MOCK_SUBSCRIPTIONS=false</code> in{' '}
                <code className="font-mono text-xs">.env.local</code>.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {!paymentsOn && !mockMode ? (
        <Card className="mb-5 p-4">
          <p className="text-sm text-[hsl(var(--text-muted))]">
            No payment provider is configured on this deployment, so upgrades are unavailable. See
            the Payments section of the README before enabling{' '}
            <code className="font-mono text-xs">PAYMENTS_ENABLED</code>.
          </p>
        </Card>
      ) : null}

      {/* -------------------------------------------------------- trial */}
      <div id="trial" className="mb-5 scroll-mt-20">
        {!premium && mockMode ? (
          <Card className="p-4">
            <h2 className="text-base font-semibold text-[hsl(var(--text))]">
              Try Pro for {process.env.TRIAL_DAYS ?? 7} days
            </h2>
            <p className="mt-1.5 mb-4 text-sm text-[hsl(var(--text-muted))]">
              No card, no commitment. Everything reverts to the free plan when it ends and nothing
              you wrote is lost.
            </p>
            <StartTrialButton
              disabled={trialUsed}
              reason={trialUsed ? 'You have already used the trial on this account.' : undefined}
            />
          </Card>
        ) : null}

        {trialDays != null ? (
          <Card className="border-brand-300 p-4 dark:border-brand-800">
            <p className="text-sm font-medium text-[hsl(var(--text))]">
              Your trial has {trialDays} day{trialDays === 1 ? '' : 's'} left.
            </p>
            <p className="mt-1 text-sm text-[hsl(var(--text-muted))]">
              After that the account falls back to the free plan unless you pick one below.
            </p>
          </Card>
        ) : null}
      </div>

      {/* --------------------------------------------------------- plans */}
      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        {PLAN_PRICING.map((p) => (
          <Card
            key={p.plan}
            className={
              'flex flex-col p-4 ' +
              (p.highlight ? 'border-brand-400 ring-1 ring-brand-400 dark:border-brand-600 dark:ring-brand-600' : '')
            }
          >
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold text-[hsl(var(--text))]">{p.name}</h2>
              {p.highlight ? <Badge tone="brand">Most useful</Badge> : null}
            </div>
            <p className="mt-2">
              <span className="text-3xl font-semibold text-[hsl(var(--text))]">{p.price}</span>{' '}
              <span className="text-sm text-[hsl(var(--text-muted))]">{p.period}</span>
            </p>
            <p className="mt-2 text-sm text-[hsl(var(--text-muted))]">{p.blurb}</p>

            <ul className="mt-5 flex-1 space-y-2">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2.5 text-sm">
                  <span aria-hidden className="mt-0.5 text-brand-600 dark:text-brand-400">
                    ✓
                  </span>
                  <span className="text-[hsl(var(--text-muted))]">{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5">
              <PlanButton
                plan={p.plan}
                current={subscription.plan === p.plan && subscription.status !== 'expired'}
                mockMode={mockMode}
                paymentsOn={paymentsOn}
                highlight={p.highlight}
              />
            </div>
          </Card>
        ))}
      </div>

      {/* ------------------------------------------------------ features */}
      <Card className="mb-5">
        <CardHeader
          title="What Pro unlocks, precisely"
          description="Each of these links to where the feature lives, so you can see what you would be paying for."
        />
        <ul className="grid gap-x-8 gap-y-4 px-4 pb-4 sm:grid-cols-2">
          {PREMIUM_FEATURES.map((f) => (
            <li key={f.key}>
              <Link
                href={f.href}
                className="text-sm font-medium text-[hsl(var(--text))] hover:text-brand-600 hover:underline dark:hover:text-brand-400"
              >
                {f.name}
              </Link>
              <p className="mt-0.5 text-sm text-[hsl(var(--text-muted))]">{f.description}</p>
            </li>
          ))}
        </ul>
      </Card>

      {premium && subscription.plan !== 'lifetime' ? (
        <div className="flex justify-end">
          <CancelButton />
        </div>
      ) : null}

      <p className="mt-8 text-xs text-[hsl(var(--text-subtle))]">
        AlgoLadder never locks or resells anybody else&rsquo;s paid material. A problem marked
        premium here still links to exactly the same public URL as a free one — what premium gates is
        the hints, approach notes and study tooling written for this project.
      </p>
    </>
  );
}
