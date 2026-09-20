import Link from 'next/link';

import { Badge, Card, EmptyState, PageHeader, buttonClass } from '@/components/ui/primitives';
import { ReportStatusSelect } from '@/components/admin/controls';
import { requireAdmin } from '@/lib/auth/session';
import { listReports } from '@/lib/actions/reports';
import type { ReportStatus } from '@/lib/types';

export const metadata = { title: 'Admin · Reports' };
export const dynamic = 'force-dynamic';

const FILTERS: { value: ReportStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_review', label: 'In review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const status = typeof params.status === 'string' ? (params.status as ReportStatus) : undefined;

  const reports = await listReports(status);

  return (
    <>
      <PageHeader
        title="Reported problems"
        description="Issues users have flagged — broken links, wrong difficulty, bad classification."
      />

      <nav className="mb-5 flex flex-wrap gap-1.5" aria-label="Filter reports">
        {FILTERS.map((f) => (
          <Link
            key={f.value || 'all'}
            href={f.value ? `/admin/reports?status=${f.value}` : '/admin/reports'}
            className={buttonClass((status ?? '') === f.value ? 'secondary' : 'ghost', 'sm')}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {reports.length === 0 ? (
        <EmptyState
          title="Nothing reported"
          description="When someone flags a problem from its detail page, it lands here."
        />
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => {
            const row = r as Record<string, unknown>;
            return (
              <li key={String(row.id)}>
                <Card className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[hsl(var(--text))]">
                        {String(row.reason)}
                      </p>
                      <p className="mt-0.5 text-xs text-[hsl(var(--text-muted))]">
                        on{' '}
                        {row.problem_slug ? (
                          <Link
                            href={`/problems/${String(row.problem_slug)}`}
                            className="text-brand-600 hover:underline dark:text-brand-400"
                          >
                            {String(row.problem_title)}
                          </Link>
                        ) : (
                          <span className="italic">a deleted problem</span>
                        )}{' '}
                        · reported by {String(row.reporter_email ?? 'a deleted account')} ·{' '}
                        {new Date(String(row.created_at)).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {String(row.status) === 'open' ? <Badge tone="amber">Open</Badge> : null}
                      <ReportStatusSelect id={String(row.id)} status={String(row.status)} />
                    </div>
                  </div>

                  {row.details ? (
                    <p className="mt-3 rounded-lg bg-[hsl(var(--surface-2))] px-3 py-2 text-sm whitespace-pre-wrap text-[hsl(var(--text-muted))]">
                      {String(row.details)}
                    </p>
                  ) : null}

                  {row.problem_id ? (
                    <div className="mt-3">
                      <Link
                        href={`/admin/problems/${String(row.problem_id)}`}
                        className={buttonClass('outline', 'sm')}
                      >
                        Edit this problem
                      </Link>
                    </div>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
