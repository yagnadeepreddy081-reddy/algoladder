'use server';

import { z } from 'zod';

import { execute } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { LANGUAGE_IDS } from '@/lib/runner/languages';

const draftSchema = z.object({
  problemId: z.string().min(1).max(120),
  language: z.enum(LANGUAGE_IDS),
  source: z.string().max(60_000),
  stdin: z.string().max(20_000),
});

export interface SaveDraftResult {
  ok: boolean;
  error?: string;
}

/**
 * Autosave for the playground. Called on a debounce while typing, so it stays
 * deliberately cheap: one upsert, no cache revalidation, no redirect. The page
 * does not re-render on save — the editor already holds the truth.
 */
export async function saveCodeDraftAction(input: {
  problemId: string;
  language: string;
  source: string;
  stdin: string;
}): Promise<SaveDraftResult> {
  const user = await requireUser();

  const parsed = draftSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const d = parsed.data;

  try {
    await execute(
      `INSERT INTO user_problem_code (user_id, problem_id, language, source, stdin)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, problem_id, language)
       DO UPDATE SET source = EXCLUDED.source,
                     stdin  = EXCLUDED.stdin,
                     updated_at = now()`,
      [user.id, d.problemId, d.language, d.source, d.stdin],
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not save your draft.',
    };
  }
}
