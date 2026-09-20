import Link from 'next/link';

import {
  Card,
  EmptyState,
  PageHeader,
  StatTile,
  buttonClass,
  inputClass,
} from '@/components/ui/primitives';
import { requireUser } from '@/lib/auth/session';
import { listAllNotes } from '@/lib/actions/notes';
import { getSubscription } from '@/lib/actions/subscription';
import { canAccessFeature, FREE_NOTE_PROBLEM_LIMIT } from '@/lib/premium';

export const metadata = { title: 'Notes' };
export const dynamic = 'force-dynamic';

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser('/notes');
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';

  const [notes, subscription] = await Promise.all([
    listAllNotes(user.id, q),
    getSubscription(user.id),
  ]);

  const premium = canAccessFeature(subscription, user.role);
  const distinctProblems = new Set(notes.map((n) => n.problemId)).size;

  return (
    <>
      <PageHeader
        title="Notes"
        description="Everything you have written across the ladder, newest first. Notes are private to your account."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatTile label="Notes" value={notes.length} />
        <StatTile label="Problems covered" value={distinctProblems} />
        <StatTile
          label="Plan limit"
          value={premium ? 'Unlimited' : `${distinctProblems}/${FREE_NOTE_PROBLEM_LIMIT}`}
          sub={premium ? 'Pro plan' : 'Free plan'}
          tone={premium ? 'brand' : 'default'}
        />
      </div>

      {/* Server-rendered search — works without JavaScript. */}
      <form className="mb-6 flex gap-2" role="search">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search your notes and the problems they are on…"
          aria-label="Search notes"
          className={inputClass}
        />
        <button type="submit" className={buttonClass('outline', 'md')}>
          Search
        </button>
        {q ? (
          <Link href="/notes" className={buttonClass('ghost', 'md')}>
            Clear
          </Link>
        ) : null}
      </form>

      {notes.length === 0 ? (
        <EmptyState
          title={q ? 'No notes match that search' : 'No notes yet'}
          description={
            q
              ? 'Try a different word, or clear the search.'
              : 'Open any problem and write down what tripped you up. Those are the notes worth having a week later.'
          }
          action={
            <Link href="/problems" className={buttonClass('primary', 'md')}>
              Go to the problems
            </Link>
          }
        />
      ) : (
        <ul className="space-y-4">
          {notes.map((n) => (
            <li key={n.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link
                    href={`/problems/${n.problemSlug}`}
                    className="text-sm font-semibold text-[hsl(var(--text))] hover:underline"
                  >
                    {n.problemTitle}
                  </Link>
                  <span className="text-xs text-[hsl(var(--text-subtle))]">
                    {new Date(n.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                {n.title ? (
                  <p className="mt-2 text-sm font-medium text-[hsl(var(--text))]">{n.title}</p>
                ) : null}
                {n.content ? (
                  <p className="mt-2 text-sm whitespace-pre-wrap text-[hsl(var(--text-muted))]">
                    {n.content}
                  </p>
                ) : null}
                {n.code ? (
                  <pre className="mt-3 overflow-x-auto rounded-lg bg-[hsl(var(--surface-3))] p-3">
                    <code className="font-mono text-xs text-[hsl(var(--text))]">{n.code}</code>
                  </pre>
                ) : null}

                <div className="mt-3">
                  <Link
                    href={`/problems/${n.problemSlug}`}
                    className="text-xs text-brand-600 hover:underline dark:text-brand-400"
                  >
                    Open the problem to edit this note →
                  </Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
