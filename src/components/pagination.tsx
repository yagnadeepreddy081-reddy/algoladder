import Link from 'next/link';
import clsx from 'clsx';

/** Query-string pagination. Server-rendered so it works without JavaScript. */
export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v == null || k === 'page') continue;
      params.set(k, Array.isArray(v) ? v.join(',') : v);
    }
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  // Always show first, last, current and its neighbours.
  const pages: (number | 'gap')[] = [];
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== 'gap') pages.push('gap');
  }

  const cell =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm transition-colors';

  return (
    <nav aria-label="Pagination" className="mt-6 flex flex-wrap items-center justify-center gap-1">
      <Link
        href={href(Math.max(1, page - 1))}
        prefetch={false}
        aria-disabled={page === 1}
        className={clsx(
          cell,
          page === 1
            ? 'pointer-events-none text-[hsl(var(--text-subtle))] opacity-50'
            : 'text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--surface-2))]',
        )}
      >
        Previous
      </Link>

      {pages.map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 text-sm text-[hsl(var(--text-subtle))]">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            prefetch={false}
            aria-current={p === page ? 'page' : undefined}
            className={clsx(
              cell,
              'tabular',
              p === page
                ? 'bg-brand-600 font-medium text-white dark:bg-brand-500 dark:text-brand-950'
                : 'text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--surface-2))]',
            )}
          >
            {p}
          </Link>
        ),
      )}

      <Link
        href={href(Math.min(totalPages, page + 1))}
        prefetch={false}
        aria-disabled={page === totalPages}
        className={clsx(
          cell,
          page === totalPages
            ? 'pointer-events-none text-[hsl(var(--text-subtle))] opacity-50'
            : 'text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--surface-2))]',
        )}
      >
        Next
      </Link>
    </nav>
  );
}
