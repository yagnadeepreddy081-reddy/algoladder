import Link from 'next/link';
import clsx from 'clsx';

/**
 * AlgoLadder's mark: three rungs climbing to the right. Drawn here rather than
 * shipped as an asset so it inherits the current text colour in both themes.
 * Original artwork for this project.
 */
export function LadderMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={clsx('h-7 w-7', className)}
      aria-hidden
      role="presentation"
    >
      <rect width="32" height="32" rx="9" className="fill-brand-600 dark:fill-brand-500" />
      {/* two rails */}
      <path
        d="M10.5 24.5 L14.5 7.5"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        className="dark:stroke-brand-950"
      />
      <path
        d="M19 24.5 L23 7.5"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        className="dark:stroke-brand-950"
      />
      {/* three rungs */}
      <path
        d="M11.7 20 L20.2 20 M13 14.7 L21.5 14.7 M14.3 9.4 L22.8 9.4"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        className="dark:stroke-brand-950"
      />
    </svg>
  );
}

export function Wordmark({
  href = '/',
  className,
  showTagline = false,
}: {
  href?: string;
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <Link href={href} className={clsx('inline-flex items-center gap-2.5', className)}>
      <LadderMark />
      <span className="flex flex-col leading-none">
        <span className="text-[17px] font-semibold tracking-tight text-[hsl(var(--text))]">
          AlgoLadder
        </span>
        {showTagline ? (
          <span className="mt-0.5 text-[11px] text-[hsl(var(--text-subtle))]">
            474 problems, one rung at a time
          </span>
        ) : null}
      </span>
    </Link>
  );
}
