'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import clsx from 'clsx';

import { Card, CardHeader, ErrorState, buttonClass, inputClass } from '@/components/ui/primitives';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import {
  createStudyPlanAction,
  deleteStudyPlanAction,
  type PlanResult,
} from '@/lib/actions/study-plan';
import { DIFFICULTIES, type Topic } from '@/lib/types';

const EMPTY: PlanResult = { ok: false };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass('primary', 'md')}>
      {pending ? 'Building your plan…' : 'Generate plan'}
    </button>
  );
}

export function PlanForm({ topics }: { topics: Topic[] }) {
  const router = useRouter();
  const { success } = useToast();

  const [state, formAction] = useActionState(async (prev: PlanResult, data: FormData) => {
    const res = await createStudyPlanAction(prev, data);
    if (res.ok) {
      success(res.message ?? 'Plan created');
      router.refresh();
    }
    return res;
  }, EMPTY);

  return (
    <Card>
      <CardHeader
        title="Build a study plan"
        description="Pick the topics, the pace and the horizon. Unsolved problems are dated out in recommended order."
      />
      <form action={formAction} className="space-y-4 px-5 pb-5">
        {state.error ? <ErrorState title={state.error} /> : null}

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-[hsl(var(--text))]">Plan name</span>
          <input
            name="name"
            required
            maxLength={80}
            defaultValue="Placement sprint"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-[hsl(var(--text))]">
            What is this plan for? (optional)
          </span>
          <input
            name="description"
            maxLength={400}
            placeholder="Cover graphs and DP properly before campus season"
            className={inputClass}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[hsl(var(--text))]">
              Problems per day
            </span>
            <input
              name="problemsPerDay"
              type="number"
              min={1}
              max={20}
              defaultValue={3}
              required
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[hsl(var(--text))]">
              Over how many days
            </span>
            <input
              name="days"
              type="number"
              min={1}
              max={365}
              defaultValue={30}
              required
              className={inputClass}
            />
          </label>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-[hsl(var(--text))]">
            Topics <span className="font-normal text-[hsl(var(--text-subtle))]">(none = all)</span>
          </legend>
          <div className="grid max-h-56 gap-1.5 overflow-y-auto rounded-lg border border-[hsl(var(--border))] p-3 sm:grid-cols-2">
            {topics.map((t) => (
              <label key={t.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="topicIds" value={t.id} className="accent-brand-600" />
                <span className="min-w-0 truncate text-[hsl(var(--text-muted))]">
                  {t.name}{' '}
                  <span className="tabular text-xs text-[hsl(var(--text-subtle))]">
                    ({t.problemCount})
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-[hsl(var(--text))]">
            Difficulty <span className="font-normal text-[hsl(var(--text-subtle))]">(none = all)</span>
          </legend>
          <div className="flex gap-3">
            {DIFFICULTIES.map((d) => (
              <label key={d} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="difficulties" value={d} className="accent-brand-600" />
                <span className="text-[hsl(var(--text-muted))]">{d}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="includeSolved" className="accent-brand-600" />
          <span className="text-[hsl(var(--text-muted))]">
            Include problems I have already solved (for a revision-style plan)
          </span>
        </label>

        <div className="pt-1">
          <Submit />
        </div>
      </form>
    </Card>
  );
}

export function DeletePlanButton({ planId }: { planId: string }) {
  const router = useRouter();
  const [, start] = useTransition();
  const { success, error } = useToast();

  return (
    <ConfirmDialog
      title="Delete this study plan?"
      description="The schedule goes away. Your progress on the problems themselves is untouched."
      confirmLabel="Delete plan"
      onConfirm={() =>
        start(async () => {
          const res = await deleteStudyPlanAction(planId);
          if (res.ok) {
            success('Plan deleted');
            router.refresh();
          } else {
            error(res.error ?? 'Could not delete that');
          }
        })
      }
      trigger={(open) => (
        <button type="button" onClick={open} className={clsx(buttonClass('ghost', 'sm'), 'text-rose-600')}>
          Delete plan
        </button>
      )}
    />
  );
}
