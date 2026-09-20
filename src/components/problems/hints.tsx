'use client';

import { useState } from 'react';

import { buttonClass, Card, CardHeader } from '@/components/ui/primitives';

/**
 * Hints revealed one at a time. The whole point of a hint is that it is not the
 * answer, so showing all three at once defeats it — you get exactly as much
 * nudge as you ask for.
 */
export function HintList({ hints }: { hints: string[] }) {
  const [revealed, setRevealed] = useState(0);

  if (hints.length === 0) return null;

  return (
    <Card>
      <CardHeader
        title="Hints"
        description="Revealed one at a time. Try the next line of thinking before you open another."
      />
      <div className="px-5 pb-5">
        <ol className="space-y-2">
          {hints.map((hint, i) => (
            <li key={i}>
              {i < revealed ? (
                <div className="animate-in-up flex gap-3 rounded-lg bg-[hsl(var(--surface-2))] px-4 py-3">
                  <span
                    aria-hidden
                    className="tabular mt-0.5 shrink-0 text-xs font-semibold text-brand-600 dark:text-brand-400"
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm text-pretty text-[hsl(var(--text))]">{hint}</p>
                </div>
              ) : i === revealed ? (
                <button
                  type="button"
                  onClick={() => setRevealed(i + 1)}
                  className="w-full rounded-lg border border-dashed border-[hsl(var(--border-strong))] px-4 py-3 text-left text-sm text-[hsl(var(--text-muted))] transition-colors hover:bg-[hsl(var(--surface-2))] hover:text-[hsl(var(--text))]"
                >
                  Reveal hint {i + 1} of {hints.length}
                </button>
              ) : null}
            </li>
          ))}
        </ol>

        {revealed > 0 && revealed < hints.length ? null : null}
        {revealed === hints.length ? (
          <button
            type="button"
            onClick={() => setRevealed(0)}
            className={buttonClass('ghost', 'sm', 'mt-3')}
          >
            Hide hints again
          </button>
        ) : null}
      </div>
    </Card>
  );
}

/** The approach write-up, collapsed by default so it cannot spoil you by accident. */
export function ApproachDisclosure({
  approach,
  patternName,
  timeComplexity,
  spaceComplexity,
}: {
  approach: string;
  patternName: string;
  timeComplexity: string;
  spaceComplexity: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader
        title="Approach"
        description={`Pattern: ${patternName}`}
        action={
          <button type="button" onClick={() => setOpen((v) => !v)} className={buttonClass('outline', 'sm')}>
            {open ? 'Hide' : 'Show approach'}
          </button>
        }
      />
      {open ? (
        <div className="animate-in-up px-5 pb-5">
          <p className="text-sm leading-relaxed text-pretty text-[hsl(var(--text))]">{approach}</p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-[hsl(var(--surface-2))] px-4 py-3">
              <dt className="text-xs font-medium tracking-wide text-[hsl(var(--text-muted))] uppercase">
                Time complexity
              </dt>
              <dd className="mt-1 font-mono text-sm text-[hsl(var(--text))]">{timeComplexity}</dd>
            </div>
            <div className="rounded-lg bg-[hsl(var(--surface-2))] px-4 py-3">
              <dt className="text-xs font-medium tracking-wide text-[hsl(var(--text-muted))] uppercase">
                Space complexity
              </dt>
              <dd className="mt-1 font-mono text-sm text-[hsl(var(--text))]">{spaceComplexity}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-[hsl(var(--text-subtle))]">
            These are the typical bounds for this pattern and a reasonable target for your own
            solution. A different valid approach may land somewhere else.
          </p>
        </div>
      ) : (
        <div className="px-5 pb-5">
          <p className="text-sm text-[hsl(var(--text-muted))]">
            Hidden so you do not spoil the problem by scrolling. Open it once you have had a real go,
            or once the hints have run out.
          </p>
        </div>
      )}
    </Card>
  );
}
