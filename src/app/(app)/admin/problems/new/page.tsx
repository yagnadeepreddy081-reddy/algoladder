import { PageHeader } from '@/components/ui/primitives';
import { ProblemEditor } from '@/components/admin/problem-editor';
import { requireAdmin } from '@/lib/auth/session';
import { listSubtopicsForAdmin, listTopicsForAdmin } from '@/lib/actions/admin';
import { queryOne } from '@/lib/db';

export const metadata = { title: 'Admin · New problem' };
export const dynamic = 'force-dynamic';

export default async function NewProblemPage() {
  await requireAdmin();

  const [topics, subtopics, max] = await Promise.all([
    listTopicsForAdmin(),
    listSubtopicsForAdmin(),
    queryOne<{ n: number }>('SELECT COALESCE(max(overall_no), 0)::int AS n FROM problems'),
  ]);

  return (
    <>
      <PageHeader
        title="Add a problem"
        description="Adding a 475th problem takes the dataset past the 474 the build gate expects. Either raise EXPECTED_TOTAL in both validators, or delete another problem to keep the count."
      />
      <ProblemEditor
        topics={topics.map((t) => ({ id: String(t.id), name: String(t.name) }))}
        subtopics={subtopics}
        nextOverallNo={(max?.n ?? 0) + 1}
      />
    </>
  );
}
