import 'server-only';

import { query } from '@/lib/db';
import { isLanguageId, type LanguageId } from '@/lib/runner/languages';

export interface CodeDraft {
  language: LanguageId;
  source: string;
  stdin: string;
  runCount: number;
}

/**
 * Every draft this user has for one problem, keyed by language. The playground
 * hydrates from this so switching languages — or coming back a week later —
 * restores exactly what was last in the editor.
 */
export async function getCodeDrafts(
  userId: string,
  problemId: string,
): Promise<Partial<Record<LanguageId, CodeDraft>>> {
  const rows = await query<{
    language: string;
    source: string;
    stdin: string;
    run_count: number;
  }>(
    `SELECT language, source, stdin, run_count
       FROM user_problem_code
      WHERE user_id = $1 AND problem_id = $2`,
    [userId, problemId],
  );

  const drafts: Partial<Record<LanguageId, CodeDraft>> = {};
  for (const row of rows) {
    if (!isLanguageId(row.language)) continue;
    drafts[row.language] = {
      language: row.language,
      source: row.source,
      stdin: row.stdin,
      runCount: row.run_count,
    };
  }
  return drafts;
}
