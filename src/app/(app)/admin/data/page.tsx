import { Card, CardHeader, PageHeader, buttonClass } from '@/components/ui/primitives';
import { ImportPanel, ValidationRunner } from '@/components/admin/data-tools';
import { requireAdmin } from '@/lib/auth/session';
import { runDatasetValidation } from '@/lib/actions/admin';

export const metadata = { title: 'Admin · Import & export' };
export const dynamic = 'force-dynamic';

export default async function AdminDataPage() {
  await requireAdmin();
  const report = await runDatasetValidation();

  return (
    <>
      <PageHeader
        title="Import, export and validate"
        description="Move the dataset in and out, and check it against the same rules the build gate uses."
      />

      <div className="space-y-6">
        <ValidationRunner initial={report} />

        <Card>
          <CardHeader
            title="Export"
            description="A JSON export round-trips exactly through the importer below, so it doubles as a backup."
          />
          <div className="flex flex-wrap gap-2 px-5 pb-5">
            <a href="/api/admin/export?what=problems&format=json" download className={buttonClass('outline', 'md')}>
              Problems (JSON)
            </a>
            <a href="/api/admin/export?what=problems&format=csv" download className={buttonClass('outline', 'md')}>
              Problems (CSV)
            </a>
            <a href="/api/admin/export?what=topics" download className={buttonClass('ghost', 'md')}>
              Topics (JSON)
            </a>
            <a href="/api/admin/export?what=subtopics" download className={buttonClass('ghost', 'md')}>
              Subtopics (JSON)
            </a>
          </div>
        </Card>

        <ImportPanel />

        <Card>
          <CardHeader
            title="Re-seeding from the source files"
            description="The canonical dataset lives in the repository, not in the database."
          />
          <div className="space-y-3 px-5 pb-5 text-sm text-[hsl(var(--text-muted))]">
            <p>
              Curation lives in <code className="font-mono text-xs">data/source/roadmap.mjs</code>.
              Edit it, then rebuild and re-seed:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-[hsl(var(--surface-3))] p-3">
              <code className="font-mono text-xs text-[hsl(var(--text))]">
                {'npm run dataset:build      # roadmap.mjs -> data/*.json\n'}
                {'npm run validate-problems  # the build gate\n'}
                {'npm run db:seed -- --prune # push into Postgres, drop stale rows'}
              </code>
            </pre>
            <p>
              Seeding never touches user progress, notes or bookmarks — it only upserts the problem
              catalogue.
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}
