import Link from 'next/link';

import { PageHeader, StatTile, buttonClass } from '@/components/ui/primitives';
import { ProblemList } from '@/components/problems/problem-list';
import { requireUser } from '@/lib/auth/session';
import { getBookmarkedProblems } from '@/lib/data/dashboard';
import { summarise } from '@/lib/progress';

export const metadata = { title: 'Bookmarks' };
export const dynamic = 'force-dynamic';

export default async function BookmarksPage() {
  const user = await requireUser('/bookmarks');
  const problems = await getBookmarkedProblems(user.id);
  const summary = summarise(problems);

  return (
    <>
      <PageHeader
        title="Bookmarks"
        description="Problems you flagged to come back to. Bookmarking is for 'I want this later'; the revision list is for 'make me do this again'."
      />

      {problems.length ? (
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <StatTile label="Bookmarked" value={summary.total} />
          <StatTile label="Solved" value={summary.solved} tone="brand" />
          <StatTile label="Still unsolved" value={summary.notStarted + summary.inProgress} tone="amber" />
        </div>
      ) : null}

      <ProblemList
        problems={problems}
        emptyTitle="Nothing bookmarked yet"
        emptyDescription="Hit the bookmark icon on any problem and it lands here."
        emptyAction={
          <Link href="/problems" className={buttonClass('primary', 'md')}>
            Browse all problems
          </Link>
        }
      />
    </>
  );
}
