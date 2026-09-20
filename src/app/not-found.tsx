import Link from 'next/link';

import { LadderMark } from '@/components/brand';
import { buttonClass } from '@/components/ui/primitives';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <main
      id="main"
      className="flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center"
    >
      <LadderMark className="h-12 w-12" />
      <p className="tabular mt-6 text-6xl font-semibold tracking-tight text-[hsl(var(--text))]">404</p>
      <h1 className="mt-3 text-xl font-semibold text-[hsl(var(--text))]">
        That rung is not on the ladder
      </h1>
      <p className="mt-2 max-w-md text-sm text-[hsl(var(--text-muted))]">
        The page you were looking for does not exist, or it has been moved. If you followed a link
        from inside AlgoLadder, it is worth reporting the problem from its detail page.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link href="/dashboard" className={buttonClass('primary', 'md')}>
          Go to dashboard
        </Link>
        <Link href="/problems" className={buttonClass('outline', 'md')}>
          Browse all 474 problems
        </Link>
      </div>
    </main>
  );
}
