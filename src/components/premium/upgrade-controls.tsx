'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import clsx from 'clsx';

import { buttonClass } from '@/components/ui/primitives';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import {
  cancelSubscriptionAction,
  mockUpgradeAction,
  startCheckoutAction,
  startTrialAction,
} from '@/lib/actions/subscription';
import type { PlanTier } from '@/lib/types';

export function StartTrialButton({ disabled, reason }: { disabled?: boolean; reason?: string }) {
  const router = useRouter();
  const { success, error } = useToast();
  const [pending, start] = useTransition();

  return (
    <div>
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() =>
          start(async () => {
            const res = await startTrialAction();
            if (res.ok) {
              success(res.message ?? 'Trial started');
              router.refresh();
            } else {
              error(res.error ?? 'Could not start the trial');
            }
          })
        }
        className={buttonClass('primary', 'lg')}
      >
        {pending ? 'Starting…' : 'Start free trial'}
      </button>
      {reason ? <p className="mt-2 text-xs text-[hsl(var(--text-subtle))]">{reason}</p> : null}
    </div>
  );
}

export function PlanButton({
  plan,
  current,
  mockMode,
  paymentsOn,
  highlight,
}: {
  plan: PlanTier;
  current: boolean;
  mockMode: boolean;
  paymentsOn: boolean;
  highlight?: boolean;
}) {
  const router = useRouter();
  const { success, error } = useToast();
  const [pending, start] = useTransition();

  if (current) {
    return (
      <span className={clsx(buttonClass('secondary', 'md', 'w-full'), 'pointer-events-none')}>
        Your current plan
      </span>
    );
  }

  const run = () =>
    start(async () => {
      const res = paymentsOn ? await startCheckoutAction(plan) : await mockUpgradeAction(plan);
      if (res.ok) {
        success(res.message ?? 'Updated');
        router.refresh();
      } else {
        error(res.error ?? 'Could not change the plan');
      }
    });

  if (plan === 'free') {
    return (
      <ConfirmDialog
        title="Move back to the free plan?"
        description="You keep every problem, all your progress, notes and bookmarks. You lose analytics, study plans, the grading scheduler and company filters."
        confirmLabel="Switch to free"
        tone="primary"
        onConfirm={run}
        trigger={(open) => (
          <button type="button" onClick={open} className={buttonClass('outline', 'md', 'w-full')}>
            Switch to free
          </button>
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={pending}
      className={buttonClass(highlight ? 'primary' : 'outline', 'md', 'w-full')}
    >
      {pending
        ? 'Working…'
        : paymentsOn
          ? `Upgrade to ${plan}`
          : mockMode
            ? `Apply mock ${plan} plan`
            : `Upgrade to ${plan}`}
    </button>
  );
}

export function CancelButton() {
  const router = useRouter();
  const { success, error } = useToast();
  const [, start] = useTransition();

  return (
    <ConfirmDialog
      title="Cancel your subscription?"
      description="Premium features stay available until the end of the current period, then the account falls back to the free plan. Nothing you have written is deleted."
      confirmLabel="Cancel subscription"
      onConfirm={() =>
        start(async () => {
          const res = await cancelSubscriptionAction();
          if (res.ok) {
            success(res.message ?? 'Cancelled');
            router.refresh();
          } else {
            error(res.error ?? 'Could not cancel');
          }
        })
      }
      trigger={(open) => (
        <button type="button" onClick={open} className={buttonClass('ghost', 'sm')}>
          Cancel subscription
        </button>
      )}
    />
  );
}
