import type { PlanTier, Subscription, SubscriptionStatus } from '@/lib/types';

/**
 * Premium access control.
 *
 * This is a technical access-control feature only. AlgoLadder locks *its own*
 * extra tooling — analytics, study plans, the revision scheduler, company
 * filters, exports. It never locks, mirrors or resells anybody else's paid
 * material, and it never bypasses another site's paywall: a premium problem
 * here still links out to the same free public URL as a free one.
 */

export const PREMIUM_FEATURES = [
  {
    key: 'advanced-analytics',
    name: 'Advanced analytics',
    description: 'Pattern-level accuracy, time invested per topic, and your weakest areas ranked.',
    href: '/analytics',
  },
  {
    key: 'study-plans',
    name: 'Custom study plans',
    description: 'Generate a dated plan from any topics and difficulty mix, and track it day by day.',
    href: '/study-plan',
  },
  {
    key: 'revision-scheduler',
    name: 'Spaced revision scheduler',
    description: 'Grade each review and let the interval grow, so you revisit shaky problems first.',
    href: '/revision',
  },
  {
    key: 'company-filters',
    name: 'Company-wise filters',
    description: 'Narrow the 474 to the companies you are actually interviewing with.',
    href: '/problems',
  },
  {
    key: 'interview-mode',
    name: 'Interview preparation mode',
    description: 'A timed, hint-free run through a shuffled set drawn from your weakest patterns.',
    href: '/study-plan',
  },
  {
    key: 'recommendations',
    name: 'Personalised recommendations',
    description: 'What to attempt next, chosen from your own solve history rather than a fixed list.',
    href: '/dashboard',
  },
  {
    key: 'export',
    name: 'Progress export',
    description: 'Download every status, note and code snippet as JSON or CSV. Your data stays yours.',
    href: '/settings',
  },
  {
    key: 'private-notes',
    name: 'Unlimited private notes',
    description: 'Free accounts keep notes on 25 problems. Premium removes the cap.',
    href: '/notes',
  },
] as const;

export type PremiumFeatureKey = (typeof PREMIUM_FEATURES)[number]['key'];

export const FREE_NOTE_PROBLEM_LIMIT = 25;

export const PLAN_LABEL: Record<PlanTier, string> = {
  free: 'Free',
  pro: 'Pro',
  lifetime: 'Lifetime',
};

export const FREE_SUBSCRIPTION: Subscription = {
  plan: 'free',
  status: 'active',
  trialEndsAt: null,
  currentPeriodEnd: null,
  provider: 'mock',
};

/** Is this subscription currently giving premium access? Pure. */
export function isPremiumActive(
  sub: Subscription | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!sub) return false;
  if (sub.plan === 'free') return false;
  if (sub.plan === 'lifetime' && sub.status === 'active') return true;

  const notExpired = (value: string | null) => value != null && new Date(value).getTime() > now.getTime();

  if (sub.status === 'trialing') return notExpired(sub.trialEndsAt);
  if (sub.status === 'active') return sub.currentPeriodEnd == null || notExpired(sub.currentPeriodEnd);
  return false;
}

/** Days left on a trial, or null when not trialling. */
export function trialDaysRemaining(
  sub: Subscription | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!sub || sub.status !== 'trialing' || !sub.trialEndsAt) return null;
  const ms = new Date(sub.trialEndsAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export function describePlan(sub: Subscription | null | undefined, now: Date = new Date()): string {
  if (!sub || sub.plan === 'free') return 'Free plan';
  if (sub.status === 'trialing') {
    const days = trialDaysRemaining(sub, now);
    return `${PLAN_LABEL[sub.plan]} trial — ${days} day${days === 1 ? '' : 's'} left`;
  }
  if (sub.plan === 'lifetime') return 'Lifetime access';
  if (sub.status === 'active' && sub.currentPeriodEnd) {
    return `${PLAN_LABEL[sub.plan]} — renews ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`;
  }
  if (sub.status === 'expired') return `${PLAN_LABEL[sub.plan]} — expired`;
  if (sub.status === 'canceled') return `${PLAN_LABEL[sub.plan]} — cancelled`;
  return PLAN_LABEL[sub.plan];
}

/**
 * Can this user open this problem in full?
 *
 * A locked problem still shows its title, topic, difficulty, tags and the
 * external link — that is the free preview. What premium unlocks is the
 * AlgoLadder-written hints, approach and complexity notes.
 */
export function canAccessProblem(
  problem: { isPremium: boolean },
  sub: Subscription | null | undefined,
  role: 'user' | 'admin' = 'user',
): boolean {
  if (role === 'admin') return true;
  if (!problem.isPremium) return true;
  return isPremiumActive(sub);
}

export function canAccessFeature(
  sub: Subscription | null | undefined,
  role: 'user' | 'admin' = 'user',
): boolean {
  if (role === 'admin') return true;
  return isPremiumActive(sub);
}

/** Is the mock (no-payment) subscription flow switched on? */
export function mockSubscriptionsEnabled(): boolean {
  return (
    process.env.MOCK_SUBSCRIPTIONS === 'true' ||
    process.env.NEXT_PUBLIC_MOCK_SUBSCRIPTIONS === 'true'
  );
}

/** Real payments are off unless explicitly enabled AND configured. */
export function paymentsEnabled(): boolean {
  return process.env.PAYMENTS_ENABLED === 'true' && Boolean(process.env.PAYMENT_PROVIDER);
}

export const PLAN_PRICING: Array<{
  plan: PlanTier;
  name: string;
  price: string;
  period: string;
  blurb: string;
  features: string[];
  highlight?: boolean;
}> = [
  {
    plan: 'free',
    name: 'Free',
    price: '₹0',
    period: 'forever',
    blurb: 'The whole 474-problem ladder, tracked properly.',
    features: [
      'All 474 problems across 19 topics',
      'Status tracking, bookmarks and stars',
      'Notes and code snippets on up to 25 problems',
      'Topic and difficulty progress',
      'Basic dashboard and streaks',
    ],
  },
  {
    plan: 'pro',
    name: 'Pro',
    price: '₹299',
    period: 'per month',
    blurb: 'Everything above, plus the tools that tell you what to do next.',
    highlight: true,
    features: [
      'Everything in Free',
      'Advanced analytics and weak-area ranking',
      'Custom study plans with dated schedules',
      'Spaced-repetition revision scheduler',
      'Company-wise filters',
      'Unlimited notes and code snippets',
      'Progress export as JSON or CSV',
    ],
  },
  {
    plan: 'lifetime',
    name: 'Lifetime',
    price: '₹2,499',
    period: 'one-off',
    blurb: 'Pay once. Sensible if you are more than a year from graduating.',
    features: ['Everything in Pro', 'No renewals, ever', 'All future premium features included'],
  },
];

export const STATUS_BADGE: Record<SubscriptionStatus, { label: string; tone: string }> = {
  active: { label: 'Active', tone: 'brand' },
  trialing: { label: 'Trial', tone: 'amber' },
  expired: { label: 'Expired', tone: 'red' },
  canceled: { label: 'Cancelled', tone: 'zinc' },
};
