'use client';

import { Card, CardHeader } from '@/components/ui/primitives';
import type { ProblemExample } from '@/lib/types';

/**
 * The problem statement: what is being asked, the exact input and output
 * format, worked examples and constraints.
 *
 * This is a client component for one reason — the "Use this input" button.
 * Clicking it fires an event the editor below listens for, so a reader can go
 * from an example to a run without retyping anything.
 */

export const USE_INPUT_EVENT = 'algoladder:use-input';

function Block({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-wide text-[hsl(var(--text-subtle))] uppercase">
        {label}
      </p>
      <pre className="mt-1 font-mono text-xs leading-relaxed whitespace-pre-wrap text-[hsl(var(--text))]">
        {text}
      </pre>
    </div>
  );
}

export function ProblemStatement({
  description,
  ioFormat,
  examples,
  constraints,
  platform,
  externalUrl,
}: {
  description: string;
  ioFormat: { input: string; output: string } | null;
  examples: ProblemExample[];
  constraints: string[];
  platform: string;
  externalUrl: string;
}) {
  const complete = Boolean(ioFormat && examples.length);

  return (
    <Card>
      <CardHeader title="The problem" />

      <div className="px-5 pb-5">
        <p className="text-[15px] leading-relaxed text-pretty text-[hsl(var(--text))]">
          {description}
        </p>

        {/* ------------------------------------------------- i/o format */}
        {ioFormat ? (
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-4 py-3">
              <dt className="text-[11px] font-semibold tracking-wide text-[hsl(var(--text-subtle))] uppercase">
                Input
              </dt>
              <dd className="mt-1 text-sm text-[hsl(var(--text))]">{ioFormat.input}</dd>
            </div>
            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-4 py-3">
              <dt className="text-[11px] font-semibold tracking-wide text-[hsl(var(--text-subtle))] uppercase">
                Output
              </dt>
              <dd className="mt-1 text-sm text-[hsl(var(--text))]">{ioFormat.output}</dd>
            </div>
          </dl>
        ) : null}

        {/* --------------------------------------------------- examples */}
        {examples.length ? (
          <div className="mt-6 space-y-4">
            <h3 className="text-sm font-semibold text-[hsl(var(--text))]">
              Example{examples.length > 1 ? 's' : ''}
            </h3>

            {examples.map((ex, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-lg border border-[hsl(var(--border))]"
              >
                <div className="flex items-center gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-4 py-2">
                  <span className="text-xs font-semibold text-[hsl(var(--text-muted))]">
                    Example {i + 1}
                  </span>
                  <span className="flex-1" />
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(
                        new CustomEvent(USE_INPUT_EVENT, { detail: ex.input }),
                      );
                      document
                        .getElementById('playground')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="rounded-md px-2 py-1 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/60"
                  >
                    Use this input ↓
                  </button>
                </div>

                <div className="grid gap-4 px-4 py-3 sm:grid-cols-2">
                  <Block label="Input" text={ex.input} />
                  <Block label="Output" text={ex.output} />
                </div>

                {ex.explanation ? (
                  <p className="border-t border-[hsl(var(--border))] px-4 py-3 text-sm text-pretty text-[hsl(var(--text-muted))]">
                    {ex.explanation}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {/* ------------------------------------------------- constraints */}
        {constraints.length ? (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-[hsl(var(--text))]">Constraints</h3>
            <ul className="mt-2 space-y-1">
              {constraints.map((c, i) => (
                <li
                  key={i}
                  className="font-mono text-xs text-[hsl(var(--text-muted))] before:mr-2 before:text-[hsl(var(--text-subtle))] before:content-['•']"
                >
                  {c}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* ------------------------------ honest note on unwritten ones */}
        {!complete ? (
          <p className="mt-5 rounded-lg border border-dashed border-[hsl(var(--border-strong))] px-4 py-3 text-xs text-[hsl(var(--text-subtle))]">
            The full statement for this problem is still being written. Until it lands, open it on{' '}
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-700 hover:underline dark:text-brand-400"
            >
              {platform}
            </a>{' '}
            for the exact input format, examples and constraints — you can still write and run your
            solution here.
          </p>
        ) : null}
      </div>
    </Card>
  );
}
