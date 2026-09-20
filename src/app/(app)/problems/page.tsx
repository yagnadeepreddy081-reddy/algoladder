import Link from 'next/link';

import { PageHeader, buttonClass } from '@/components/ui/primitives';
import { FilterBar } from '@/components/problems/filter-bar';
import { ProblemList } from '@/components/problems/problem-list';
import { Pagination } from '@/components/pagination';
import { requireUser } from '@/lib/auth/session';
import { getSubscription } from '@/lib/actions/subscription';
import { canAccessFeature } from '@/lib/premium';
import { getFilterFacets, listProblems, getTotalProblemCount } from '@/lib/data/problems';
import { parseFilters } from '@/lib/filters';

export const metadata = { title: 'All problems' };
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser('/problems');
  const params = await searchParams;
  const filters = parseFilters(params);

  const [facets, subscription, grandTotal, page] = await Promise.all([
    getFilterFacets(),
    getSubscription(user.id),
    getTotalProblemCount(),
    listProblems(filters, user.id),
  ]);

  return (
    <>
      <PageHeader
        title="All problems"
        description={`Every one of the ${grandTotal} problems on the ladder. Search and filters combine, and everything you set lands in the URL so you can bookmark a view.`}
      />

      <FilterBar
        facets={facets}
        total={page.total}
        showing={page.problems.length}
        canUseCompanyFilter={canAccessFeature(subscription, user.role)}
      />

      <ProblemList
        problems={page.problems}
        emptyTitle="Nothing matches those filters"
        emptyDescription="Loosen a filter, or clear them all and start again."
        emptyAction={
          <Link href="/problems" className={buttonClass('outline', 'md')}>
            Clear all filters
          </Link>
        }
      />

      <Pagination
        page={page.page}
        totalPages={page.totalPages}
        basePath="/problems"
        searchParams={params}
      />
    </>
  );
}
