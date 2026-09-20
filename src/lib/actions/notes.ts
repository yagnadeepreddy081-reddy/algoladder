'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { execute, query, queryOne } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { mapNote } from '@/lib/data/mappers';
import type { Note } from '@/lib/types';

export interface NoteResult {
  ok: boolean;
  error?: string;
  message?: string;
  note?: Note;
}

const noteSchema = z
  .object({
    problemId: z.string().min(1),
    title: z.string().trim().max(120).default(''),
    content: z.string().max(20_000).default(''),
    code: z.string().max(50_000).default(''),
    language: z.string().max(20).default('java'),
    isPrivate: z.boolean().default(true),
  })
  .refine((v) => v.content.trim().length > 0 || v.code.trim().length > 0, {
    message: 'Write a note or paste some code before saving',
    path: ['content'],
  });

function fromForm(formData: FormData) {
  return {
    problemId: String(formData.get('problemId') ?? ''),
    title: String(formData.get('title') ?? ''),
    content: String(formData.get('content') ?? ''),
    code: String(formData.get('code') ?? ''),
    language: String(formData.get('language') ?? 'java'),
    isPrivate: formData.get('isPrivate') !== 'false',
  };
}

export async function createNoteAction(
  _prev: NoteResult,
  formData: FormData,
): Promise<NoteResult> {
  const user = await requireUser();
  const parsed = noteSchema.safeParse(fromForm(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const d = parsed.data;

  const row = await queryOne(
    `INSERT INTO notes (user_id, problem_id, title, content, code, language, is_private)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [user.id, d.problemId, d.title, d.content, d.code, d.language, d.isPrivate],
  );

  await execute(
    `INSERT INTO activity_logs (user_id, problem_id, action, metadata)
     VALUES ($1,$2,'note_added','{}'::jsonb)`,
    [user.id, d.problemId],
  );

  const slug = String(formData.get('slug') ?? '');
  if (slug) revalidatePath(`/problems/${slug}`);
  revalidatePath('/notes');

  return { ok: true, message: 'Note saved', note: row ? mapNote(row) : undefined };
}

export async function updateNoteAction(
  _prev: NoteResult,
  formData: FormData,
): Promise<NoteResult> {
  const user = await requireUser();
  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'Missing note id' };

  const parsed = noteSchema.safeParse(fromForm(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;

  // The user_id predicate is the authorisation check — you cannot edit
  // somebody else's note even if you guess its id.
  const row = await queryOne(
    `UPDATE notes SET title = $3, content = $4, code = $5, language = $6, is_private = $7
      WHERE id = $1 AND user_id = $2
      RETURNING *`,
    [id, user.id, d.title, d.content, d.code, d.language, d.isPrivate],
  );
  if (!row) return { ok: false, error: 'Note not found' };

  const slug = String(formData.get('slug') ?? '');
  if (slug) revalidatePath(`/problems/${slug}`);
  revalidatePath('/notes');

  return { ok: true, message: 'Note updated', note: mapNote(row) };
}

export async function deleteNoteAction(id: string, slug?: string): Promise<NoteResult> {
  const user = await requireUser();
  const deleted = await execute('DELETE FROM notes WHERE id = $1 AND user_id = $2', [id, user.id]);
  if (!deleted) return { ok: false, error: 'Note not found' };

  if (slug) revalidatePath(`/problems/${slug}`);
  revalidatePath('/notes');
  return { ok: true, message: 'Note deleted' };
}

// ------------------------------------------------------------- readers ---

export async function listNotesForProblem(userId: string, problemId: string): Promise<Note[]> {
  const rows = await query(
    'SELECT * FROM notes WHERE user_id = $1 AND problem_id = $2 ORDER BY updated_at DESC',
    [userId, problemId],
  );
  return rows.map(mapNote);
}

export async function listAllNotes(userId: string, search = ''): Promise<Note[]> {
  const like = `%${search.toLowerCase()}%`;
  const rows = await query(
    `SELECT n.*, p.title AS problem_title, p.slug AS problem_slug
       FROM notes n JOIN problems p ON p.id = n.problem_id
      WHERE n.user_id = $1
        AND ($2 = '' OR lower(n.content) LIKE $3 OR lower(n.title) LIKE $3 OR lower(p.title) LIKE $3)
      ORDER BY n.updated_at DESC`,
    [userId, search, like],
  );
  return rows.map(mapNote);
}
