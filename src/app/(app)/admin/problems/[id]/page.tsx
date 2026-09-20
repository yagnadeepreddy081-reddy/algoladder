import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/ui/primitives';
import { ProblemEditor } from '@/components/admin/problem-editor';
import { requireAdmin } from '@/lib/auth/session';
import { listSubtopicsForAdmin, listTopicsForAdmin } from '@/lib/actions/admin';
import { getProblemById } from '@/lib/data/problems';

export const metadata = { title: 'Admin · Edit problem' };
export const dynamic = 'force-dynamic';

export default async function EditProblemPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const problem = await getProblemById(id, null);
  if (!problem) notFound();

  const [topics, subtopics] = await Promise.all([listTopicsForAdmin(), listSubtopicsForAdmin()]);

  return (
    <>
      <PageHeader
        title={`Edit: ${problem.title}`}
        description={`Problem ${problem.overallNo} of the ladder. Changes go live for every user as soon as you save.`}
      />
      <ProblemEditor
        problem={problem}
        topics={topics.map((t) => ({ id: String(t.id), name: String(t.name) }))}
        subtopics={subtopics}
        nextOverallNo={problem.overallNo}
      />
    </>
  );
}
