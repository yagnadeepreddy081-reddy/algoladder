'use server';

import { revalidatePath } from 'next/cache';

import { execute, queryOne } from '@/lib/db';
import { requireUser, getSessionUser } from '@/lib/auth/session';
import { FREE_SUBSCRIPTION, mockSubscriptionsEnabled, paymentsEnabled } from '@/lib/premium';
import type { PlanTier, Subscription, SubscriptionStatus } from '@/lib/types';

export interface SubscriptionResult {
  ok: boolean;
  message?: string;
  error?: string;
}

function mapSubscription(row: Record<string, unknown> | null): Subscription {
  if (!row) return FREE_SUBSCRIPTION;
  const iso = (v: unknown) => (v == null ? null : v instanceof Date ? v.toISOString() : String(v));
  return {
    plan: row.plan as PlanTier,
    status: row.status as SubscriptionStatus,
    trialEndsAt: iso(row.trial_ends_at),
    currentPeriodEnd: iso(row.current_period_end),
    provider: String(row.provider ?? 'mock'),
  };
}

/** Read the user's subscription, expiring it lazily if its period has passed. */
export async function getSubscription(userId: string): Promise<Subscription> {
  const row = await queryOne<Record<string, unknown>>(
    'SELECT * FROM subscriptions WHERE user_id = $1',
    [userId],
  );
  if (!row) return FREE_SUBSCRIPTION;

  const sub = mapSubscription(row);
  const now = Date.now();

  const trialOver = sub.status === 'trialing' && sub.trialEndsAt && new Date(sub.trialEndsAt).getTime() <= now;
  const periodOver =
    sub.status === 'active' &&
    sub.plan !== 'lifetime' &&
    sub.currentPeriodEnd &&
    new Date(sub.currentPeriodEnd).getTime() <= now;

  if (trialOver || periodOver) {
    await execute("UPDATE subscriptions SET status = 'expired' WHERE user_id = $1", [userId]);
    return { ...sub, status: 'expired' };
  }

  return sub;
}

export async function getMySubscription(): Promise<Subscription> {
  const user = await getSessionUser();
  if (!user) return FREE_SUBSCRIPTION;
  return getSubscription(user.id);
}

// ===========================================================================
// Mock subscription flow — development and testing only
// ===========================================================================

/**
 * Start a free trial. Only available when MOCK_SUBSCRIPTIONS is on, which is
 * how you exercise every premium path locally without a payment provider.
 */
export async function startTrialAction(): Promise<SubscriptionResult> {
  const user = await requireUser();
  if (!mockSubscriptionsEnabled()) {
    return { ok: false, error: 'Mock subscriptions are switched off. Set MOCK_SUBSCRIPTIONS=true.' };
  }

  const existing = await getSubscription(user.id);
  if (existing.trialEndsAt) {
    return { ok: false, error: 'You have already used your trial on this account.' };
  }

  const days = Number(process.env.TRIAL_DAYS ?? 7) || 7;
  await execute(
    `INSERT INTO subscriptions (user_id, plan, status, trial_ends_at, provider)
     VALUES ($1, 'pro', 'trialing', now() + ($2 || ' days')::interval, 'mock')
     ON CONFLICT (user_id) DO UPDATE SET
       plan = 'pro', status = 'trialing',
       trial_ends_at = now() + ($2 || ' days')::interval,
       provider = 'mock'`,
    [user.id, String(days)],
  );

  await execute(
    `INSERT INTO activity_logs (user_id, action, metadata) VALUES ($1,'trial_started',$2::jsonb)`,
    [user.id, JSON.stringify({ days })],
  );

  revalidatePath('/', 'layout');
  return { ok: true, message: `Your ${days}-day trial has started.` };
}

/**
 * Grant a plan without taking payment. Guarded by MOCK_SUBSCRIPTIONS so it can
 * never be reached on a deployment that has not explicitly opted in.
 */
export async function mockUpgradeAction(plan: PlanTier): Promise<SubscriptionResult> {
  const user = await requireUser();

  if (!mockSubscriptionsEnabled()) {
    return {
      ok: false,
      error:
        'Mock upgrades are disabled. Set MOCK_SUBSCRIPTIONS=true in .env.local to test premium features.',
    };
  }
  if (paymentsEnabled()) {
    return {
      ok: false,
      error: 'Real payments are enabled on this deployment, so mock upgrades are blocked.',
    };
  }
  if (!['free', 'pro', 'lifetime'].includes(plan)) {
    return { ok: false, error: 'Unknown plan' };
  }

  if (plan === 'free') {
    await execute(
      `UPDATE subscriptions SET plan = 'free', status = 'active', current_period_end = NULL
        WHERE user_id = $1`,
      [user.id],
    );
    revalidatePath('/', 'layout');
    return { ok: true, message: 'Switched back to the free plan.' };
  }

  const periodEnd = plan === 'lifetime' ? null : "now() + interval '30 days'";
  await execute(
    `INSERT INTO subscriptions (user_id, plan, status, current_period_end, provider)
     VALUES ($1, $2::plan_tier, 'active', ${periodEnd ?? 'NULL'}, 'mock')
     ON CONFLICT (user_id) DO UPDATE SET
       plan = EXCLUDED.plan, status = 'active',
       current_period_end = ${periodEnd ?? 'NULL'},
       provider = 'mock'`,
    [user.id, plan],
  );

  await execute(
    `INSERT INTO activity_logs (user_id, action, metadata) VALUES ($1,'mock_upgrade',$2::jsonb)`,
    [user.id, JSON.stringify({ plan })],
  );

  revalidatePath('/', 'layout');
  return { ok: true, message: `Mock upgrade applied — you are on the ${plan} plan. No payment was taken.` };
}

export async function cancelSubscriptionAction(): Promise<SubscriptionResult> {
  const user = await requireUser();
  await execute("UPDATE subscriptions SET status = 'canceled' WHERE user_id = $1", [user.id]);
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Subscription cancelled. Access continues until the period ends.' };
}

/**
 * Real checkout. Intentionally not wired to a provider: turning this on needs
 * both PAYMENTS_ENABLED=true and provider keys, and you should write the
 * webhook handler yourself against whichever provider you sign up with.
 */
export async function startCheckoutAction(plan: PlanTier): Promise<SubscriptionResult> {
  await requireUser();
  if (!paymentsEnabled()) {
    return {
      ok: false,
      error:
        'Payments are disabled. Set PAYMENTS_ENABLED=true and configure a provider before taking real money.',
    };
  }
  return {
    ok: false,
    error: `No payment provider is implemented for "${plan}". See README > Payments before enabling this.`,
  };
}
