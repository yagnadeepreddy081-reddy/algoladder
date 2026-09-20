'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import clsx from 'clsx';

import { buttonClass, Card, CardHeader, ErrorState, inputClass } from '@/components/ui/primitives';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import {
  createNoteAction,
  deleteNoteAction,
  updateNoteAction,
  type NoteResult,
} from '@/lib/actions/notes';
import { CODE_LANGUAGES } from '@/lib/constants';
import type { Note } from '@/lib/types';

const EMPTY: NoteResult = { ok: false };

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass('primary', 'md')}>
      {pending ? 'Saving…' : label}
    </button>
  );
}

function NoteForm({
  problemId,
  slug,
  note,
  onDone,
}: {
  problemId: string;
  slug: string;
  note?: Note;
  onDone?: () => void;
}) {
  const router = useRouter();
  const action = note ? updateNoteAction : createNoteAction;
  const [state, formAction] = useActionState(async (prev: NoteResult, data: FormData) => {
    const res = await action(prev, data);
    if (res.ok) {
      router.refresh();
      onDone?.();
    }
    return res;
  }, EMPTY);

  return (
    <form action={formAction} className="space-y-3">
      {state.error ? <ErrorState title={state.error} /> : null}
      <input type="hidden" name="problemId" value={problemId} />
      <input type="hidden" name="slug" value={slug} />
      {note ? <input type="hidden" name="id" value={note.id} /> : null}

      <input
        name="title"
        defaultValue={note?.title ?? ''}
        placeholder="Note title (optional)"
        className={inputClass}
        aria-label="Note title"
      />

      <textarea
        name="content"
        defaultValue={note?.content ?? ''}
        rows={4}
        placeholder="What tripped you up? What would you do differently next time?"
        className={clsx(inputClass, 'resize-y')}
        aria-label="Note"
      />

      <div className="flex items-center gap-2">
        <label htmlFor={`lang-${note?.id ?? 'new'}`} className="sr-only">
          Language
        </label>
        <select
          id={`lang-${note?.id ?? 'new'}`}
          name="language"
          defaultValue={note?.language ?? 'java'}
          className={clsx(inputClass, 'h-9 w-auto cursor-pointer py-0 text-xs')}
        >
          {CODE_LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <span className="text-xs text-[hsl(var(--text-subtle))]">for the snippet below</span>
      </div>

      <textarea
        name="code"
        defaultValue={note?.code ?? ''}
        rows={6}
        spellCheck={false}
        placeholder={'// your working solution, so future-you does not start from scratch'}
        className={clsx(inputClass, 'resize-y font-mono text-xs')}
        aria-label="Code snippet"
      />

      <div className="flex items-center justify-end gap-2">
        {onDone ? (
          <button type="button" onClick={onDone} className={buttonClass('ghost', 'md')}>
            Cancel
          </button>
        ) : null}
        <SaveButton label={note ? 'Update note' : 'Save note'} />
      </div>
    </form>
  );
}

function NoteCard({ note, slug }: { note: Note; slug: string }) {
  const [editing, setEditing] = useState(false);
  const [, start] = useTransition();
  const router = useRouter();
  const { success, error } = useToast();

  if (editing) {
    return (
      <div className="rounded-lg border border-[hsl(var(--border))] p-4">
        <NoteForm problemId={note.problemId} slug={slug} note={note} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <article className="rounded-lg border border-[hsl(var(--border))] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {note.title ? (
            <h3 className="text-sm font-semibold text-[hsl(var(--text))]">{note.title}</h3>
          ) : null}
          <p className="text-xs text-[hsl(var(--text-subtle))]">
            Updated {new Date(note.updatedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button type="button" onClick={() => setEditing(true)} className={buttonClass('ghost', 'sm')}>
            Edit
          </button>
          <ConfirmDialog
            title="Delete this note?"
            description="This cannot be undone. The code snippet goes with it."
            confirmLabel="Delete note"
            onConfirm={() =>
              start(async () => {
                const res = await deleteNoteAction(note.id, slug);
                if (res.ok) {
                  success('Note deleted');
                  router.refresh();
                } else {
                  error(res.error ?? 'Could not delete that');
                }
              })
            }
            trigger={(open) => (
              <button type="button" onClick={open} className={buttonClass('ghost', 'sm')}>
                Delete
              </button>
            )}
          />
        </div>
      </div>

      {note.content ? (
        <p className="mt-2 text-sm whitespace-pre-wrap text-[hsl(var(--text))]">{note.content}</p>
      ) : null}

      {note.code ? (
        <pre className="mt-3 overflow-x-auto rounded-lg bg-[hsl(var(--surface-3))] p-3">
          <code className="font-mono text-xs text-[hsl(var(--text))]">{note.code}</code>
        </pre>
      ) : null}
    </article>
  );
}

export function NotesPanel({
  problemId,
  slug,
  notes,
  locked,
  lockReason,
}: {
  problemId: string;
  slug: string;
  notes: Note[];
  locked?: boolean;
  lockReason?: string;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <Card>
      <CardHeader
        title={`Notes${notes.length ? ` (${notes.length})` : ''}`}
        description="Your own working notes and code, kept against this problem."
        action={
          locked ? null : (
            <button
              type="button"
              onClick={() => setAdding((v) => !v)}
              className={buttonClass('outline', 'sm')}
            >
              {adding ? 'Close' : '+ Add note'}
            </button>
          )
        }
      />

      <div className="space-y-3 px-5 pb-5">
        {locked ? (
          <div className="rounded-lg border border-dashed border-[hsl(var(--border-strong))] px-4 py-5 text-center">
            <p className="text-sm text-[hsl(var(--text-muted))]">{lockReason}</p>
          </div>
        ) : null}

        {adding && !locked ? (
          <div className="rounded-lg border border-[hsl(var(--border))] p-4">
            <NoteForm problemId={problemId} slug={slug} onDone={() => setAdding(false)} />
          </div>
        ) : null}

        {notes.length === 0 && !adding && !locked ? (
          <p className="py-4 text-center text-sm text-[hsl(var(--text-muted))]">
            No notes yet. The ones you write after getting stuck are the ones worth having.
          </p>
        ) : null}

        {notes.map((n) => (
          <NoteCard key={n.id} note={n} slug={slug} />
        ))}
      </div>
    </Card>
  );
}
