'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import clsx from 'clsx';

import { buttonClass, inputClass } from '@/components/ui/primitives';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import {
  deleteProblemAction,
  reorderProblemAction,
  setProblemPremiumAction,
  setTopicPremiumAction,
  setUserPlanAction,
  setUserRoleAction,
} from '@/lib/actions/admin';
import { setReportStatusAction } from '@/lib/actions/reports';
import type { PlanTier, ReportStatus } from '@/lib/types';

function useAction() {
  const router = useRouter();
  const { success, error } = useToast();
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        success(res.message ?? 'Done');
        router.refresh();
      } else {
        error(res.error ?? 'That did not work');
      }
    });

  return { run, pending };
}

/* --------------------------------------------------------------- topics --- */

export function TopicPremiumToggle({
  topicId,
  isPremium,
}: {
  topicId: string;
  isPremium: boolean;
}) {
  const { run, pending } = useAction();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => run(() => setTopicPremiumAction(topicId, !isPremium))}
      className={clsx(
        'w-20 shrink-0 rounded-md border px-2 py-1 text-xs font-medium transition-colors',
        isPremium
          ? 'border-violet-400 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300'
          : 'border-[hsl(var(--border-strong))] text-[hsl(var(--text-muted))]',
      )}
    >
      {isPremium ? 'Premium' : 'Free'}
    </button>
  );
}

/* ------------------------------------------------------------- problems --- */

export function ProblemRowActions({
  problemId,
  title,
  isPremium,
}: {
  problemId: string;
  title: string;
  isPremium: boolean;
}) {
  const { run, pending } = useAction();

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <button
        type="button"
        disabled={pending}
        title="Move up in recommended order"
        onClick={() => run(() => reorderProblemAction(problemId, 'up'))}
        className={buttonClass('ghost', 'icon')}
      >
        <span className="sr-only">Move up</span>↑
      </button>
      <button
        type="button"
        disabled={pending}
        title="Move down in recommended order"
        onClick={() => run(() => reorderProblemAction(problemId, 'down'))}
        className={buttonClass('ghost', 'icon')}
      >
        <span className="sr-only">Move down</span>↓
      </button>
      <button
        type="button"
        disabled={pending}
        title={isPremium ? 'Make free' : 'Make premium'}
        onClick={() => run(() => setProblemPremiumAction(problemId, !isPremium))}
        className={clsx(
          buttonClass('ghost', 'icon'),
          isPremium && 'text-violet-600 dark:text-violet-400',
        )}
      >
        <span className="sr-only">{isPremium ? 'Make free' : 'Make premium'}</span>★
      </button>
      <ConfirmDialog
        title={`Delete "${title}"?`}
        description="This removes the problem and every user's progress, notes and revision entries for it. The dataset will then hold fewer than 474 problems and the build gate will fail until you fix it. This cannot be undone."
        confirmLabel="Delete permanently"
        onConfirm={() => run(() => deleteProblemAction(problemId))}
        trigger={(open) => (
          <button
            type="button"
            onClick={open}
            title="Delete problem"
            className={clsx(buttonClass('ghost', 'icon'), 'text-rose-600 dark:text-rose-400')}
          >
            <span className="sr-only">Delete</span>×
          </button>
        )}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- users --- */

export function UserPlanSelect({ userId, plan }: { userId: string; plan: string }) {
  const { run, pending } = useAction();
  const [value, setValue] = useState(plan);

  return (
    <label>
      <span className="sr-only">Plan</span>
      <select
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as PlanTier;
          setValue(next);
          run(() => setUserPlanAction(userId, next));
        }}
        className={clsx(inputClass, 'h-8 w-28 cursor-pointer py-0 text-xs')}
      >
        <option value="free">Free</option>
        <option value="pro">Pro</option>
        <option value="lifetime">Lifetime</option>
      </select>
    </label>
  );
}

export function UserRoleToggle({
  userId,
  role,
  isSelf,
}: {
  userId: string;
  role: string;
  isSelf: boolean;
}) {
  const { run, pending } = useAction();
  const isAdmin = role === 'admin';

  if (isSelf) {
    return (
      <span className="w-20 text-center text-xs text-[hsl(var(--text-subtle))]">You</span>
    );
  }

  return (
    <ConfirmDialog
      title={isAdmin ? 'Revoke admin access?' : 'Grant admin access?'}
      description={
        isAdmin
          ? 'They will lose access to the admin panel immediately, on their next page load.'
          : 'They will be able to add, edit and delete problems, see every user, and change anyone’s plan. Only do this for someone you trust with the whole dataset.'
      }
      confirmLabel={isAdmin ? 'Revoke admin' : 'Grant admin'}
      tone={isAdmin ? 'danger' : 'primary'}
      onConfirm={() => run(() => setUserRoleAction(userId, isAdmin ? 'user' : 'admin'))}
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          disabled={pending}
          className={clsx(
            'w-20 rounded-md border px-2 py-1 text-xs font-medium',
            isAdmin
              ? 'border-violet-400 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300'
              : 'border-[hsl(var(--border-strong))] text-[hsl(var(--text-muted))]',
          )}
        >
          {isAdmin ? 'Admin' : 'User'}
        </button>
      )}
    />
  );
}

/* -------------------------------------------------------------- reports --- */

export function ReportStatusSelect({ id, status }: { id: string; status: string }) {
  const { run, pending } = useAction();
  const [value, setValue] = useState(status);

  return (
    <label>
      <span className="sr-only">Report status</span>
      <select
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as ReportStatus;
          setValue(next);
          run(() => setReportStatusAction(id, next));
        }}
        className={clsx(inputClass, 'h-8 w-32 cursor-pointer py-0 text-xs')}
      >
        <option value="open">Open</option>
        <option value="in_review">In review</option>
        <option value="resolved">Resolved</option>
        <option value="dismissed">Dismissed</option>
      </select>
    </label>
  );
}
