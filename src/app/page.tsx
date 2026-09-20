import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Wordmark, LadderMark } from '@/components/brand';
import { ThemeToggle } from '@/components/theme';
import { buttonClass } from '@/components/ui/primitives';
import { getSessionUser } from '@/lib/auth/session';
import { isDatabaseReachable } from '@/lib/db';
import { listTopics, getTotalProblemCount } from '@/lib/data/problems';
import { LANGUAGE_LIST } from '@/lib/runner/languages';
import { PREMIUM_FEATURES } from '@/lib/premium';
import { TOTAL_PROBLEMS } from '@/lib/types';

export const dynamic = 'force-dynamic';

/* ---------------------------------------------------------------- icons --- */

function Icon({ path }: { path: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      {path}
    </svg>
  );
}

const ICON = {
  ladder: <Icon path={<><path d="M8 3v18M16 3v18" /><path d="M8 7h8M8 12h8M8 17h8" /></>} />,
  play: <Icon path={<><path d="m9 8 7 4-7 4V8Z" /><rect x="3" y="4" width="18" height="16" rx="2.5" /></>} />,
  refresh: <Icon path={<><path d="M21 12a9 9 0 1 1-2.6-6.4" /><path d="M21 3v6h-6" /></>} />,
  bulb: <Icon path={<><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5.9 1.2.9 2h5.4c0-.8.3-1.5.9-2A6 6 0 0 0 12 3Z" /></>} />,
  check: <Icon path={<path d="m5 13 4 4L19 7" />} />,
};

/* ------------------------------------------------------------- sections --- */

const FEATURES = [
  {
    icon: ICON.ladder,
    title: 'Ordered, not piled up',
    body: 'Every problem leans on the one before it. Nineteen topics, sixty-one subtopics, one recommended path from start to finish.',
  },
  {
    icon: ICON.play,
    title: 'Solve it right here',
    body: 'A real editor, four languages and your own test input — run your solution on the problem page instead of juggling tabs.',
  },
  {
    icon: ICON.refresh,
    title: 'Revision that schedules itself',
    body: 'Grade a review and the interval grows or collapses. Shaky problems return tomorrow; solid ones get out of your way for weeks.',
  },
  {
    icon: ICON.bulb,
    title: 'Patterns, not answers',
    body: 'Progressive hints, a written approach and complexity targets for the underlying pattern — enough to unstick you, never the solution.',
  },
];

const STEPS = [
  { n: '01', title: 'Pick up where the ladder left off', body: 'Your next unsolved problem is always one click from the dashboard.' },
  { n: '02', title: 'Read, think, then write code', body: 'Hints open one at a time. The editor sits under the statement, not on another site.' },
  { n: '03', title: 'Mark it and let revision take over', body: 'Solved problems come back on a schedule that matches how well you knew them.' },
];

/* --------------------------------------------------------- hero preview --- */

/** A small, honest mock of the problem page — the thing the CTA leads to. */
function HeroPreview() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-4 -z-10 rounded-[2rem] bg-brand-500/10 blur-2xl dark:bg-brand-500/15"
      />
      <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] shadow-[0_24px_60px_-24px_rgb(0_0_0/0.35)]">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          </span>
          <span className="ml-1 truncate text-xs font-medium text-[hsl(var(--text-muted))]">
            #14 · Longest substring without repeating characters
          </span>
        </div>

        {/* editor */}
        <div className="bg-[hsl(var(--surface-3))] px-4 py-3 font-mono text-[11px] leading-[1.7]">
          <pre className="text-[hsl(var(--text-muted))]">
            <span className="text-violet-600 dark:text-violet-400">def</span>{' '}
            <span className="text-blue-600 dark:text-blue-400">length_of_longest</span>(s):
            {'\n'}    seen, best, left = {'{}'}, 0, 0
            {'\n'}    <span className="text-violet-600 dark:text-violet-400">for</span> right, ch{' '}
            <span className="text-violet-600 dark:text-violet-400">in</span> enumerate(s):
            {'\n'}        <span className="text-violet-600 dark:text-violet-400">if</span> ch{' '}
            <span className="text-violet-600 dark:text-violet-400">in</span> seen:
            {'\n'}            left = max(left, seen[ch] + 1)
            {'\n'}        seen[ch] = right
            {'\n'}        best = max(best, right - left + 1)
            {'\n'}    <span className="text-violet-600 dark:text-violet-400">return</span> best
          </pre>
        </div>

        {/* output */}
        <div className="flex items-center gap-2 border-t border-[hsl(var(--border))] px-4 py-2.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
            Ran successfully
          </span>
          <span className="font-mono text-[11px] text-[hsl(var(--text))]">3</span>
          <span className="flex-1" />
          <span className="tabular text-[10px] text-[hsl(var(--text-subtle))]">86 ms</span>
        </div>

        {/* progress footer */}
        <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-4 py-3">
          <div className="mb-1.5 flex items-baseline justify-between text-[11px]">
            <span className="text-[hsl(var(--text-muted))]">Sliding window</span>
            <span className="tabular font-medium text-[hsl(var(--text))]">9/14</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--surface-3))]">
            <div className="h-full w-[64%] rounded-full bg-brand-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ page --- */

export default async function LandingPage() {
  const user = await getSessionUser();
  if (user) redirect('/dashboard');

  const health = await isDatabaseReachable();
  const [topics, total] = health.ok
    ? await Promise.all([listTopics(), getTotalProblemCount()])
    : [[], 0];

  const problemCount = health.ok ? total : TOTAL_PROBLEMS;

  const STATS = [
    { value: String(problemCount), label: 'problems' },
    { value: '19', label: 'topics' },
    { value: '61', label: 'subtopics' },
    { value: String(LANGUAGE_LIST.length), label: 'languages you can run' },
  ];

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      {/* ambient background — one soft brand glow, nothing that fights the text */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(60%_100%_at_50%_0%,hsl(var(--ring)/0.14),transparent_70%)]"
      />

      {/* ---------------------------------------------------------- nav */}
      <header className="sticky top-0 z-40 border-b border-[hsl(var(--border))] bg-[hsl(var(--surface))]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Wordmark />
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <Link href="/login" className={buttonClass('ghost', 'sm')}>
              Log in
            </Link>
            <Link href="/signup" className={buttonClass('primary', 'sm')}>
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        {/* -------------------------------------------------------- hero */}
        <section className="mx-auto max-w-6xl px-4 pt-14 pb-16 sm:px-6 sm:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-16">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 dark:border-brand-900 dark:bg-brand-950/60 dark:text-brand-300">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden />
                {problemCount} problems · 19 topics · now with a built-in editor
              </span>

              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance text-[hsl(var(--text))] sm:text-5xl lg:text-[3.4rem] lg:leading-[1.05]">
                Climb the whole DSA ladder,{' '}
                <span className="text-brand-600 dark:text-brand-400">one rung at a time</span>.
              </h1>

              <p className="mt-5 max-w-xl text-lg text-pretty text-[hsl(var(--text-muted))]">
                A structured A-to-Z roadmap of {problemCount} coding problems — read the question,
                write the code and run it on the same page, then let spaced revision decide what
                comes back.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/signup" className={buttonClass('primary', 'lg')}>
                  Start the ladder — free
                </Link>
                <Link href="/login" className={buttonClass('outline', 'lg')}>
                  I already have an account
                </Link>
              </div>

              <p className="mt-4 text-xs text-[hsl(var(--text-subtle))]">
                No card needed. The full ladder, the editor and all progress tracking are free.
              </p>
            </div>

            <HeroPreview />
          </div>

          {!health.ok ? (
            <div
              role="alert"
              className="mt-12 rounded-[var(--radius-card)] border border-amber-300 bg-amber-50 px-5 py-4 dark:border-amber-900 dark:bg-amber-950/40"
            >
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                The database is not reachable yet
              </p>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                Copy <code className="font-mono">.env.example</code> to{' '}
                <code className="font-mono">.env.local</code>, set{' '}
                <code className="font-mono">DATABASE_URL</code>, then run{' '}
                <code className="font-mono">npm run db:migrate &amp;&amp; npm run db:seed</code>.
              </p>
              <p className="mt-2 font-mono text-xs break-words text-amber-700 dark:text-amber-400">
                {health.error}
              </p>
            </div>
          ) : null}
        </section>

        {/* ------------------------------------------------------- stats */}
        <section className="border-y border-[hsl(var(--border))] bg-[hsl(var(--surface-2))]">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-[hsl(var(--border))] px-4 sm:px-6 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-[hsl(var(--surface-2))] px-2 py-7 text-center">
                <p className="tabular text-3xl font-semibold tracking-tight text-[hsl(var(--text))]">
                  {s.value}
                </p>
                <p className="mt-1 text-xs text-[hsl(var(--text-muted))]">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------- features */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-balance text-[hsl(var(--text))] sm:text-3xl">
            Four things that make a list of problems into actual practice
          </h2>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-[var(--radius-card)] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6 transition-colors hover:border-[hsl(var(--border-strong))]"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">
                  {f.icon}
                </span>
                <h3 className="mt-4 text-base font-semibold text-[hsl(var(--text))]">{f.title}</h3>
                <p className="mt-2 text-sm text-pretty text-[hsl(var(--text-muted))]">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------ code runner */}
        <section className="border-y border-[hsl(var(--border))] bg-[hsl(var(--surface-2))]">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-xs font-semibold tracking-wider text-brand-700 uppercase dark:text-brand-400">
                New
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance text-[hsl(var(--text))] sm:text-3xl">
                Write the solution without leaving the question
              </h2>
              <p className="mt-4 text-pretty text-[hsl(var(--text-muted))]">
                The statement, the hints and a real code editor sit on one page. Feed your program
                any input you like, run it in a sandbox, and read stdout, stderr and compile errors
                side by side. Your draft is kept per language, per problem.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {LANGUAGE_LIST.map((l) => (
                  <span
                    key={l.id}
                    className="rounded-lg border border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--text))]"
                  >
                    {l.label}
                  </span>
                ))}
              </div>
            </div>

            <ul className="space-y-4">
              {[
                'Syntax highlighting, bracket matching and ⌘/Ctrl + Enter to run.',
                'Your own test input — not a fixed set of hidden cases.',
                'Compile errors shown in full, not swallowed.',
                'Drafts saved as you type, so a refresh costs you nothing.',
              ].map((line) => (
                <li key={line} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-400">
                    {ICON.check}
                  </span>
                  <span className="text-sm text-[hsl(var(--text))]">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ------------------------------------------------------- steps */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-[hsl(var(--text))] sm:text-3xl">
            How a session goes
          </h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="border-t-2 border-brand-500/70 pt-5">
                <p className="tabular text-xs font-semibold text-brand-700 dark:text-brand-400">
                  {s.n}
                </p>
                <h3 className="mt-2 text-base font-semibold text-[hsl(var(--text))]">{s.title}</h3>
                <p className="mt-2 text-sm text-pretty text-[hsl(var(--text-muted))]">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ------------------------------------------------------ topics */}
        {topics.length ? (
          <section className="border-t border-[hsl(var(--border))] bg-[hsl(var(--surface-2))]">
            <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
              <h2 className="text-2xl font-semibold tracking-tight text-[hsl(var(--text))] sm:text-3xl">
                The nineteen rungs
              </h2>
              <p className="mt-3 max-w-2xl text-pretty text-[hsl(var(--text-muted))]">
                Ordered so each topic uses something the previous one taught. You can jump around —
                the recommended order just exists for a reason.
              </p>

              <ol className="mt-10 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {topics.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-4 py-3"
                  >
                    <span className="tabular flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--surface-3))] text-xs font-semibold text-[hsl(var(--text-muted))]">
                      {t.position}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-[hsl(var(--text))]">
                      {t.name}
                    </span>
                    <span className="tabular shrink-0 text-xs text-[hsl(var(--text-subtle))]">
                      {t.problemCount}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        ) : null}

        {/* ----------------------------------------------------- premium */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="rounded-[var(--radius-card)] border border-[hsl(var(--border))] p-6 sm:p-10">
            <h2 className="text-2xl font-semibold tracking-tight text-[hsl(var(--text))]">
              What the paid tier actually adds
            </h2>
            <p className="mt-3 max-w-2xl text-pretty text-[hsl(var(--text-muted))]">
              The problems are free and always will be — they are public links. Premium buys the
              tooling around them.
            </p>
            <ul className="mt-8 grid gap-x-10 gap-y-4 sm:grid-cols-2">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f.key} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-400">
                    {ICON.check}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-[hsl(var(--text))]">
                      {f.name}
                    </span>
                    <span className="block text-sm text-[hsl(var(--text-muted))]">
                      {f.description}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* --------------------------------------------------------- CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-6 py-16 text-center">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_120%_at_50%_0%,hsl(var(--ring)/0.16),transparent_70%)]"
            />
            <div className="relative flex flex-col items-center gap-5">
              <LadderMark className="h-11 w-11" />
              <h2 className="max-w-lg text-2xl font-semibold text-balance text-[hsl(var(--text))] sm:text-3xl">
                Stop collecting problem lists. Start finishing one.
              </h2>
              <Link href="/signup" className={buttonClass('primary', 'lg')}>
                Create your free account
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <Wordmark showTagline />
          <p className="max-w-xl text-xs text-[hsl(var(--text-subtle))]">
            AlgoLadder is an independent study tracker, not affiliated with or endorsed by any
            company or course. The problem selection follows the widely used A2Z progression that
            most DSA roadmaps share. Problem titles refer to publicly available problems hosted on
            LeetCode and GeeksforGeeks, and all links point to those sites. Every statement,
            example, hint and explanation on this site was written from scratch for AlgoLadder.
          </p>
        </div>
      </footer>
    </div>
  );
}
