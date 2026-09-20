import Link from 'next/link';

import {
  Badge,
  Card,
  DifficultyBadge,
  EmptyState,
  PageHeader,
  buttonClass,
  inputClass,
} from '@/components/ui/primitives';
import { ProblemRowActions } from '@/components/admin/controls';
import { Pagination } from '@/components/pagination';
import { requireAdmin } from '@/lib/auth/session';
import { listProblems, getFilterFacets } from '@/lib/data/problems';
import { parseFilters } from '@/lib/filters';

export const metadata = { title: 'Admin · Problems' };
export const dynamic = 'force-dynamic';

export default async function AdminProblemsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const filters = { ...parseFilters(params), perPage: 50 };
  const [page, facets] = await Promise.all([listProblems(filters, null), getFilterFacets()]);

  return (
    <>
      <PageHeader
        title="Problems"
        description={`${page.total} matching. Editing here changes what every user sees, immediately.`}
        action={
          <Link href="/admin/problems/new" className={buttonClass('primary', 'md')}>
            + Add problem
          </Link>
        }
      />

      <form className="mb-5 flex flex-wrap gap-2" role="search">
        <input
          type="search"
          name="q"
          defaultValue={typeof params.q === 'string' ? params.q : ''}
          placeholder="Search by title, description or tag…"
          aria-label="Search problems"
          className={`${inputClass} min-w-48 flex-1`}
        />
        <select
          name="topic"
          defaultValue={typeof params.topic === 'string' ? params.topic : ''}
          className={`${inputClass} w-auto cursor-pointer`}
          aria-label="Filter by topic"
        >
          <option value="">All topics</option>
          {facets.topics.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          name="difficulty"
          defaultValue={typeof params.difficulty === 'string' ? params.difficulty : ''}
          className={`${inputClass} w-auto cursor-pointer`}
          aria-label="Filter by difficulty"
        >
          <option value="">All levels</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <button type="submit" className={buttonClass('outline', 'md')}>
          Filter
        </button>
        <Link href="/admin/problems" className={buttonClass('ghost', 'md')}>
          Reset
        </Link>
      </form>

      {page.problems.length === 0 ? (
        <EmptyState title="No problems match" description="Loosen the filters and try again." />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-[hsl(var(--border))]">
            {page.problems.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                <span className="tabular w-12 shrink-0 text-xs text-[hsl(var(--text-subtle))]">
                  {p.overallNo}
                </span>
                <Link
                  href={`/admin/problems/${p.id}`}
                  className="min-w-0 flex-1 truncate text-sm font-medium text-[hsl(var(--text))] hover:text-brand-600 hover:underline dark:hover:text-brand-400"
                >
                  {p.title}
                </Link>
                <span className="hidden w-40 shrink-0 truncate text-xs text-[hsl(var(--text-muted))] lg:block">
                  {p.topicName}
                </span>
                <DifficultyBadge difficulty={p.difficulty} />
                {p.isPremium ? <Badge tone="violet">Pro</Badge> : null}
                <ProblemRowActions problemId={p.id} title={p.title} isPremium={p.isPremium} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Pagination
        page={page.page}
        totalPages={page.totalPages}
        basePath="/admin/problems"
        searchParams={params}
      />
    </>
  );
}
