import { describe, it, expect } from 'vitest';

import {
  canAccessFeature,
  canAccessProblem,
  describePlan,
  FREE_SUBSCRIPTION,
  isPremiumActive,
  trialDaysRemaining,
} from '@/lib/premium';
import { checkPasswordStrength } from '@/lib/password-strength';
import { hashPassword, verifyPassword, generateResetToken, hashToken } from '@/lib/auth/password';
import {
  addDaysISO,
  describeDue,
  initialSchedule,
  isDue,
  schedule,
} from '@/lib/spaced-repetition';
import type { Subscription } from '@/lib/types';

const NOW = new Date('2026-09-20T12:00:00Z');

const sub = (over: Partial<Subscription>): Subscription => ({ ...FREE_SUBSCRIPTION, ...over });

describe('isPremiumActive', () => {
  it('is false for the free plan and for nothing at all', () => {
    expect(isPremiumActive(null)).toBe(false);
    expect(isPremiumActive(undefined)).toBe(false);
    expect(isPremiumActive(FREE_SUBSCRIPTION)).toBe(false);
  });

  it('is true for an active lifetime plan', () => {
    expect(isPremiumActive(sub({ plan: 'lifetime', status: 'active' }), NOW)).toBe(true);
  });

  it('is true for a pro plan inside its period', () => {
    expect(
      isPremiumActive(
        sub({ plan: 'pro', status: 'active', currentPeriodEnd: '2026-10-20T00:00:00Z' }),
        NOW,
      ),
    ).toBe(true);
  });

  it('is false once the period has passed', () => {
    expect(
      isPremiumActive(
        sub({ plan: 'pro', status: 'active', currentPeriodEnd: '2026-09-01T00:00:00Z' }),
        NOW,
      ),
    ).toBe(false);
  });

  it('is true during a live trial and false after it', () => {
    expect(
      isPremiumActive(sub({ plan: 'pro', status: 'trialing', trialEndsAt: '2026-09-25T00:00:00Z' }), NOW),
    ).toBe(true);
    expect(
      isPremiumActive(sub({ plan: 'pro', status: 'trialing', trialEndsAt: '2026-09-19T00:00:00Z' }), NOW),
    ).toBe(false);
  });

  it('is false for expired and cancelled subscriptions', () => {
    expect(isPremiumActive(sub({ plan: 'pro', status: 'expired' }), NOW)).toBe(false);
    expect(isPremiumActive(sub({ plan: 'pro', status: 'canceled' }), NOW)).toBe(false);
  });
});

describe('canAccessProblem', () => {
  it('always allows a free problem', () => {
    expect(canAccessProblem({ isPremium: false }, FREE_SUBSCRIPTION)).toBe(true);
  });

  it('locks a premium problem for a free account', () => {
    expect(canAccessProblem({ isPremium: true }, FREE_SUBSCRIPTION)).toBe(false);
  });

  it('unlocks a premium problem for an active plan', () => {
    expect(canAccessProblem({ isPremium: true }, sub({ plan: 'lifetime', status: 'active' }))).toBe(true);
  });

  it('always lets an admin through', () => {
    expect(canAccessProblem({ isPremium: true }, FREE_SUBSCRIPTION, 'admin')).toBe(true);
    expect(canAccessFeature(FREE_SUBSCRIPTION, 'admin')).toBe(true);
  });
});

describe('trial helpers', () => {
  it('counts the days left, rounding up', () => {
    expect(
      trialDaysRemaining(sub({ plan: 'pro', status: 'trialing', trialEndsAt: '2026-09-23T12:00:00Z' }), NOW),
    ).toBe(3);
  });

  it('returns null when not trialling', () => {
    expect(trialDaysRemaining(FREE_SUBSCRIPTION, NOW)).toBeNull();
  });

  it('describes each plan state in words', () => {
    expect(describePlan(FREE_SUBSCRIPTION, NOW)).toBe('Free plan');
    expect(describePlan(sub({ plan: 'lifetime', status: 'active' }), NOW)).toBe('Lifetime access');
    expect(
      describePlan(sub({ plan: 'pro', status: 'trialing', trialEndsAt: '2026-09-22T12:00:00Z' }), NOW),
    ).toMatch(/trial — 2 days left/);
  });
});

describe('password hashing', () => {
  it('produces a verifiable hash', async () => {
    const hash = await hashPassword('CorrectHorse1');
    expect(hash.startsWith('scrypt$')).toBe(true);
    expect(await verifyPassword('CorrectHorse1', hash)).toBe(true);
  });

  it('rejects the wrong password', async () => {
    const hash = await hashPassword('CorrectHorse1');
    expect(await verifyPassword('correcthorse1', hash)).toBe(false);
    expect(await verifyPassword('', hash)).toBe(false);
  });

  it('salts, so the same password hashes differently each time', async () => {
    const a = await hashPassword('CorrectHorse1');
    const b = await hashPassword('CorrectHorse1');
    expect(a).not.toBe(b);
    expect(await verifyPassword('CorrectHorse1', b)).toBe(true);
  });

  it('never throws on a malformed stored hash', async () => {
    expect(await verifyPassword('x', 'garbage')).toBe(false);
    expect(await verifyPassword('x', '')).toBe(false);
  });

  it('stores reset tokens only as a hash', () => {
    const { token, tokenHash } = generateResetToken();
    expect(token).not.toBe(tokenHash);
    expect(tokenHash).toBe(hashToken(token));
    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('checkPasswordStrength', () => {
  it('rejects short passwords', () => {
    expect(checkPasswordStrength('Ab1').ok).toBe(false);
  });

  it('requires a mix', () => {
    expect(checkPasswordStrength('alllowercase').ok).toBe(false);
    expect(checkPasswordStrength('ALLUPPERCASE1').ok).toBe(false);
    expect(checkPasswordStrength('NoDigitsHere').ok).toBe(false);
  });

  it('accepts a reasonable password', () => {
    const r = checkPasswordStrength('LadderClimb7');
    expect(r.ok).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(3);
  });

  it('rejects an obvious one even when it meets the rules', () => {
    expect(checkPasswordStrength('Password123').ok).toBe(false);
  });
});

describe('the revision scheduler', () => {
  const today = '2026-09-20';

  it('starts one day out', () => {
    const s = initialSchedule(today);
    expect(s.intervalDays).toBe(1);
    expect(s.dueDate).toBe('2026-09-21');
  });

  it('collapses to tomorrow and records a lapse on "again"', () => {
    const next = schedule({ intervalDays: 30, ease: 2.5, reviewCount: 5, lapses: 0 }, 'again', today);
    expect(next.intervalDays).toBe(1);
    expect(next.lapses).toBe(1);
    expect(next.dueDate).toBe('2026-09-21');
  });

  it('grows the interval on "good"', () => {
    const next = schedule({ intervalDays: 6, ease: 2.5, reviewCount: 3, lapses: 0 }, 'good', today);
    expect(next.intervalDays).toBeGreaterThan(6);
  });

  it('grows further on "easy" than on "good"', () => {
    const state = { intervalDays: 6, ease: 2.5, reviewCount: 3, lapses: 0 };
    const good = schedule(state, 'good', today);
    const easy = schedule(state, 'easy', today);
    expect(easy.intervalDays).toBeGreaterThan(good.intervalDays);
  });

  it('grows least on "hard" and lowers the ease', () => {
    const state = { intervalDays: 10, ease: 2.5, reviewCount: 3, lapses: 0 };
    const hard = schedule(state, 'hard', today);
    expect(hard.intervalDays).toBe(12);
    expect(hard.ease).toBeLessThan(2.5);
  });

  it('never lets the ease fall below the floor', () => {
    let state = { intervalDays: 1, ease: 1.3, reviewCount: 9, lapses: 0 };
    for (let i = 0; i < 10; i += 1) state = schedule(state, 'again', today);
    expect(state.ease).toBeGreaterThanOrEqual(1.3);
  });

  it('caps the interval at a year', () => {
    const next = schedule({ intervalDays: 360, ease: 3, reviewCount: 20, lapses: 0 }, 'easy', today);
    expect(next.intervalDays).toBeLessThanOrEqual(365);
  });

  it('counts every review', () => {
    const next = schedule({ intervalDays: 1, ease: 2.5, reviewCount: 4, lapses: 1 }, 'good', today);
    expect(next.reviewCount).toBe(5);
  });

  it('knows what is due', () => {
    expect(isDue('2026-09-19', today)).toBe(true);
    expect(isDue('2026-09-20', today)).toBe(true);
    expect(isDue('2026-09-21', today)).toBe(false);
  });

  it('describes due dates in plain words', () => {
    expect(describeDue('2026-09-20', today)).toBe('Due today');
    expect(describeDue('2026-09-21', today)).toBe('Due tomorrow');
    expect(describeDue('2026-09-18', today)).toBe('2 days overdue');
    expect(describeDue('2026-09-24', today)).toBe('Due in 4 days');
  });

  it('adds days across a month boundary', () => {
    expect(addDaysISO(11, '2026-09-20')).toBe('2026-10-01');
  });
});
