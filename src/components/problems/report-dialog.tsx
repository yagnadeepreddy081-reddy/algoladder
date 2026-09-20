'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import clsx from 'clsx';

import { buttonClass, ErrorState, inputClass } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { reportProblemAction, type ReportResult } from '@/lib/actions/reports';
import { REPORT_REASONS } from '@/lib/constants';

const EMPTY: ReportResult = { ok: false };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass('primary', 'md')}>
      {pending ? 'Sending…' : 'Send report'}
    </button>
  );
}

export function ReportDialog({ problemId, title }: { problemId: string; title: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, formAction] = useActionState(reportProblemAction, EMPTY);
  const { success } = useToast();

  useEffect(() => {
    if (state.ok) {
      success(state.message ?? 'Report sent');
      ref.current?.close();
    }
  }, [state, success]);

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="text-xs text-[hsl(var(--text-subtle))] underline-offset-2 hover:text-[hsl(var(--text-muted))] hover:underline"
      >
        Report a problem with this entry
      </button>

      <dialog
        ref={ref}
        className="m-auto w-[calc(100vw-2rem)] max-w-md rounded-[var(--radius-card)] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-0 text-[hsl(var(--text))] backdrop:bg-black/50"
      >
        <form action={formAction} className="space-y-4 p-5">
          <div>
            <h2 className="text-base font-semibold">Report an issue</h2>
            <p className="mt-1 text-sm text-[hsl(var(--text-muted))]">
              About <span className="font-medium text-[hsl(var(--text))]">{title}</span>. This goes
              to the admin queue.
            </p>
          </div>

          {state.error ? <ErrorState title={state.error} /> : null}
          <input type="hidden" name="problemId" value={problemId} />

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">What is wrong?</span>
            <select name="reason" required className={clsx(inputClass, 'cursor-pointer')}>
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Details (optional)</span>
            <textarea
              name="details"
              rows={3}
              className={clsx(inputClass, 'resize-y')}
              placeholder="The link 404s, or this should be Medium not Hard…"
            />
          </label>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className={buttonClass('outline', 'md')}
            >
              Cancel
            </button>
            <Submit />
          </div>
        </form>
      </dialog>
    </>
  );
}
