'use client';

import { useActionState, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import clsx from 'clsx';

import { Card, CardHeader, ErrorState, buttonClass, inputClass } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { importProblemsAction, runDatasetValidation, type ImportResult } from '@/lib/actions/admin';
import type { ValidationReport } from '@/lib/validate-dataset';

const EMPTY: ImportResult = { ok: false };

function ImportButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass('primary', 'md')}>
      {pending ? 'Importing…' : 'Import problems'}
    </button>
  );
}

/* --------------------------------------------------------- validation --- */

export function ValidationRunner({ initial }: { initial: ValidationReport }) {
  const [report, setReport] = useState<ValidationReport>(initial);
  const [pending, start] = useTransition();
  const { success, error } = useToast();

  const line = (label: string, value: React.ReactNode) => (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
      <span className="text-[hsl(var(--text-muted))]">{label}</span>
      <span className="tabular font-medium text-[hsl(var(--text))]">{value}</span>
    </div>
  );

  return (
    <Card>
      <CardHeader
        title="Dataset validation"
        description="The same checks the build gate runs, but against what is in the database right now."
        action={
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                try {
                  const next = await runDatasetValidation();
                  setReport(next);
                  if (next.passed) success(`Passed — exactly ${next.total} problems.`);
                  else error(`${next.errors.length} problem${next.errors.length === 1 ? '' : 's'} found.`);
                } catch (err) {
                  error(err instanceof Error ? err.message : 'Validation failed to run');
                }
              })
            }
            className={buttonClass('outline', 'sm')}
          >
            {pending ? 'Running…' : 'Re-run'}
          </button>
        }
      />

      <div className="px-4 pb-4">
        <div
          className={clsx(
            'mb-4 rounded-lg border px-4 py-3',
            report.passed
              ? 'border-brand-300 bg-brand-50 dark:border-brand-800 dark:bg-brand-950'
              : 'border-rose-300 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/50',
          )}
        >
          <p
            className={clsx(
              'text-sm font-semibold',
              report.passed
                ? 'text-brand-800 dark:text-brand-300'
                : 'text-rose-800 dark:text-rose-300',
            )}
          >
            {report.passed
              ? `PASSED — exactly ${report.total} valid problems.`
              : `FAILED — ${report.errors.length} issue${report.errors.length === 1 ? '' : 's'}.`}
          </p>
          {!report.passed ? (
            <ul className="mt-2 space-y-1">
              {report.errors.map((e, i) => (
                <li key={i} className="text-sm text-rose-700 dark:text-rose-400">
                  • {e}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="grid gap-x-8 sm:grid-cols-2">
          <div className="divide-y divide-[hsl(var(--border))]">
            {line('Total problems', `${report.total} / ${report.expectedTotal}`)}
            {line('Duplicate IDs', report.duplicateIds.length)}
            {line('Duplicate titles', report.duplicateTitles.length)}
            {line('Duplicate slugs', report.duplicateSlugs.length)}
            {line('Missing fields', report.missingFields.length)}
            {line('Invalid URLs', report.invalidUrls.length)}
            {line('Broken topic mappings', report.missingMappings.length)}
            {line('Numbering gaps', report.numberingGaps.length)}
            {line('Premium problems', report.premiumCount)}
          </div>

          <div>
            <p className="mt-3 mb-1 text-xs font-semibold tracking-wide text-[hsl(var(--text-muted))] uppercase sm:mt-0">
              By difficulty
            </p>
            <div className="divide-y divide-[hsl(var(--border))]">
              {Object.entries(report.byDifficulty).map(([k, v]) => line(k, v))}
            </div>

            <p className="mt-4 mb-1 text-xs font-semibold tracking-wide text-[hsl(var(--text-muted))] uppercase">
              By platform
            </p>
            <div className="divide-y divide-[hsl(var(--border))]">
              {Object.entries(report.byPlatform).map(([k, v]) => line(k, v))}
            </div>
          </div>
        </div>

        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-[hsl(var(--text-muted))]">
            Problems per topic
          </summary>
          <div className="mt-2 divide-y divide-[hsl(var(--border))]">
            {Object.entries(report.byTopic).map(([k, v]) => line(k, v))}
          </div>
        </details>

        {report.invalidUrls.length ? (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-rose-700 dark:text-rose-400">
              Invalid URLs ({report.invalidUrls.length})
            </summary>
            <ul className="mt-2 space-y-1">
              {report.invalidUrls.map((u, i) => (
                <li key={i} className="font-mono text-xs break-all text-[hsl(var(--text-muted))]">
                  {u}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------- import --- */

export function ImportPanel() {
  const [state, action] = useActionState(importProblemsAction, EMPTY);
  const [payload, setPayload] = useState('');
  const { success } = useToast();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setPayload(text);
    success(`Loaded ${file.name} (${(file.size / 1024).toFixed(0)} KB) — review, then import.`);
  }

  return (
    <Card>
      <CardHeader
        title="Import problems"
        description="Paste or upload a JSON array in the same shape as data/problems.json. Existing IDs are updated; new ones are inserted. The whole import runs in one transaction, so a bad row rolls the lot back."
      />
      <form action={action} className="space-y-4 px-4 pb-4">
        {state.error ? <ErrorState title="Import failed" detail={state.error} /> : null}

        {state.ok ? (
          <p className="rounded-lg border border-brand-300 bg-brand-50 px-4 py-2.5 text-sm text-brand-800 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-300">
            {state.message}
          </p>
        ) : null}

        {state.issues?.length ? (
          <details className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/50">
            <summary className="cursor-pointer text-sm font-medium text-amber-900 dark:text-amber-300">
              {state.issues.length} rows had problems
            </summary>
            <ul className="mt-2 space-y-1">
              {state.issues.map((i, n) => (
                <li key={n} className="text-xs text-amber-800 dark:text-amber-400">
                  {i}
                </li>
              ))}
            </ul>
          </details>
        ) : null}

        <div>
          <label htmlFor="file" className="mb-1.5 block text-sm font-medium text-[hsl(var(--text))]">
            Upload a JSON file
          </label>
          <input
            id="file"
            type="file"
            accept="application/json,.json"
            onChange={onFile}
            className="block w-full text-sm text-[hsl(var(--text-muted))] file:mr-3 file:rounded-lg file:border-0 file:bg-[hsl(var(--surface-3))] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[hsl(var(--text))]"
          />
        </div>

        <div>
          <label htmlFor="payload" className="mb-1.5 block text-sm font-medium text-[hsl(var(--text))]">
            …or paste the JSON here
          </label>
          <textarea
            id="payload"
            name="payload"
            rows={10}
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            spellCheck={false}
            placeholder='[{"id":"al-0001","slug":"two-sum","title":"Two Sum", ...}]'
            className={clsx(inputClass, 'resize-y font-mono text-xs')}
          />
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="replace" className="mt-0.5 accent-rose-600" />
          <span className="text-[hsl(var(--text-muted))]">
            <strong className="text-rose-700 dark:text-rose-400">Replace everything.</strong> Deletes
            every existing problem first — and with it every user&rsquo;s progress, notes and
            revision entries, because those rows cascade. Leave this unticked unless you mean it.
          </span>
        </label>

        <ImportButton />
      </form>
    </Card>
  );
}
