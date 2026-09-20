import 'server-only';

import { queryOne } from '@/lib/db';
import type { ProblemTestCase } from '@/lib/types';

/**
 * Test cases are read from the database rather than taken from the request,
 * so a submission cannot be graded against cases the caller made up.
 */
export async function getTestCases(problemId: string): Promise<ProblemTestCase[]> {
  const row = await queryOne<{ test_cases: ProblemTestCase[] | null }>(
    'SELECT test_cases FROM problems WHERE id = $1 AND is_active = true',
    [problemId],
  );
  return row?.test_cases ?? [];
}
