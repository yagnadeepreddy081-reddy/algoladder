'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import clsx from 'clsx';

import {
  Card,
  CardHeader,
  ErrorState,
  Field,
  buttonClass,
  inputClass,
} from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { saveProblemAction, type AdminResult } from '@/lib/actions/admin';
import { DIFFICULTIES, PLATFORMS, type Problem } from '@/lib/types';

const EMPTY: AdminResult = { ok: false };

function Save() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass('primary', 'md')}>
      {pending ? 'Saving…' : 'Save problem'}
    </button>
  );
}

export function ProblemEditor({
  problem,
  topics,
  subtopics,
  nextOverallNo,
}: {
  problem?: Problem;
  topics: { id: string; name: string }[];
  subtopics: { id: string; topic_id: string; name: string }[];
  nextOverallNo: number;
}) {
  const router = useRouter();
  const { success } = useToast();
  const isNew = !problem;

  const [topicId, setTopicId] = useState(problem?.topicId ?? topics[0]?.id ?? '');
  const [title, setTitle] = useState(problem?.title ?? '');
  const [slug, setSlug] = useState(problem?.slug ?? '');

  const [state, action] = useActionState(async (prev: AdminResult, data: FormData) => {
    const res = await saveProblemAction(prev, data);
    if (res.ok) {
      success(res.message ?? 'Saved');
      router.push('/admin/problems');
      router.refresh();
    }
    return res;
  }, EMPTY);

  const subtopicOptions = useMemo(
    () => subtopics.filter((s) => s.topic_id === topicId),
    [subtopics, topicId],
  );

  const autoSlug = title
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return (
    <form action={action} className="space-y-6">
      {state.error ? <ErrorState title="Could not save" detail={state.error} /> : null}

      <Card>
        <CardHeader title="The basics" description="What the problem is and where it lives." />
        <div className="space-y-4 px-5 pb-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="ID"
              htmlFor="id"
              hint={isNew ? 'A stable unique key, e.g. al-0475' : 'Cannot be changed here'}
            >
              <input
                id="id"
                name="id"
                required
                readOnly={!isNew}
                defaultValue={problem?.id ?? ''}
                placeholder={`al-${String(nextOverallNo).padStart(4, '0')}`}
                className={clsx(inputClass, !isNew && 'opacity-70')}
              />
            </Field>

            <Field label="URL slug" htmlFor="slug" hint="Lowercase letters, digits and hyphens.">
              <div className="flex gap-2">
                <input
                  id="slug"
                  name="slug"
                  required
                  pattern="[a-z0-9\-]+"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setSlug(autoSlug)}
                  className={buttonClass('outline', 'md')}
                >
                  From title
                </button>
              </div>
            </Field>
          </div>

          <Field label="Title" htmlFor="title" hint="Must be unique across all 474 problems.">
            <input
              id="title"
              name="title"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field
            label="Short description"
            htmlFor="description"
            hint="One original sentence describing the task. Do not paste the host site's statement."
          >
            <textarea
              id="description"
              name="description"
              required
              rows={3}
              maxLength={2000}
              defaultValue={problem?.description ?? ''}
              className={clsx(inputClass, 'resize-y')}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Topic" htmlFor="topicId">
              <select
                id="topicId"
                name="topicId"
                required
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className={clsx(inputClass, 'cursor-pointer')}
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Subtopic" htmlFor="subtopicId">
              <select
                id="subtopicId"
                name="subtopicId"
                required
                defaultValue={problem?.subtopicId ?? ''}
                key={topicId}
                className={clsx(inputClass, 'cursor-pointer')}
              >
                {subtopicOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Difficulty" htmlFor="difficulty">
              <select
                id="difficulty"
                name="difficulty"
                required
                defaultValue={problem?.difficulty ?? 'Medium'}
                className={clsx(inputClass, 'cursor-pointer')}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Where to solve it" description="The external link users follow." />
        <div className="space-y-4 px-5 pb-5">
          <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
            <Field label="Platform" htmlFor="platform">
              <select
                id="platform"
                name="platform"
                defaultValue={problem?.platform ?? 'LeetCode'}
                className={clsx(inputClass, 'cursor-pointer')}
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Problem URL" htmlFor="externalUrl">
              <input
                id="externalUrl"
                name="externalUrl"
                type="url"
                required
                defaultValue={problem?.externalUrl ?? ''}
                placeholder="https://leetcode.com/problems/two-sum/"
                className={inputClass}
              />
            </Field>
          </div>

          <Field
            label="Video URL"
            htmlFor="videoUrl"
            hint="Optional, and only if you have the right to link it. Leave blank otherwise."
          >
            <input
              id="videoUrl"
              name="videoUrl"
              type="url"
              defaultValue={problem?.videoUrl ?? ''}
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Ordering and access" description="Where it sits on the ladder, and who can see the teaching material." />
        <div className="space-y-4 px-5 pb-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Overall number" htmlFor="overallNo" hint="Unique, 1 to 474.">
              <input
                id="overallNo"
                name="overallNo"
                type="number"
                min={1}
                required
                defaultValue={problem?.overallNo ?? nextOverallNo}
                className={inputClass}
              />
            </Field>
            <Field label="Number within topic" htmlFor="problemNoInTopic">
              <input
                id="problemNoInTopic"
                name="problemNoInTopic"
                type="number"
                min={1}
                required
                defaultValue={problem?.problemNoInTopic ?? 1}
                className={inputClass}
              />
            </Field>
            <Field label="Recommended order" htmlFor="recommendedOrder">
              <input
                id="recommendedOrder"
                name="recommendedOrder"
                type="number"
                min={1}
                required
                defaultValue={problem?.recommendedOrder ?? nextOverallNo}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isPremium"
                defaultChecked={problem?.isPremium}
                className="accent-brand-600"
              />
              <span className="text-[hsl(var(--text-muted))]">
                Premium — hints and approach need a paid plan
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isRevision"
                defaultChecked={problem?.isRevision}
                className="accent-brand-600"
              />
              <span className="text-[hsl(var(--text-muted))]">On the default revision list</span>
            </label>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Classification and teaching material"
          description="All original writing. Never paste an editorial from another site."
        />
        <div className="space-y-4 px-5 pb-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Pattern key" htmlFor="pattern">
              <input
                id="pattern"
                name="pattern"
                defaultValue={problem?.pattern ?? ''}
                placeholder="sliding-window"
                className={inputClass}
              />
            </Field>
            <Field label="Pattern name" htmlFor="patternName">
              <input
                id="patternName"
                name="patternName"
                defaultValue={problem?.patternName ?? ''}
                placeholder="Sliding window"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tags" htmlFor="tags" hint="Comma separated.">
              <input
                id="tags"
                name="tags"
                defaultValue={problem?.tags.join(', ') ?? ''}
                className={inputClass}
              />
            </Field>
            <Field label="Companies" htmlFor="companies" hint="Comma separated.">
              <input
                id="companies"
                name="companies"
                defaultValue={problem?.companies.join(', ') ?? ''}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Hints" htmlFor="hints" hint="One per line. Revealed to users one at a time.">
            <textarea
              id="hints"
              name="hints"
              rows={4}
              defaultValue={problem?.hints.join('\n') ?? ''}
              className={clsx(inputClass, 'resize-y')}
            />
          </Field>

          <Field label="Approach" htmlFor="approach">
            <textarea
              id="approach"
              name="approach"
              rows={6}
              maxLength={5000}
              defaultValue={problem?.approach ?? ''}
              className={clsx(inputClass, 'resize-y')}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Time complexity" htmlFor="timeComplexity">
              <input
                id="timeComplexity"
                name="timeComplexity"
                defaultValue={problem?.timeComplexity ?? ''}
                placeholder="O(n)"
                className={clsx(inputClass, 'font-mono')}
              />
            </Field>
            <Field label="Space complexity" htmlFor="spaceComplexity">
              <input
                id="spaceComplexity"
                name="spaceComplexity"
                defaultValue={problem?.spaceComplexity ?? ''}
                placeholder="O(1)"
                className={clsx(inputClass, 'font-mono')}
              />
            </Field>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Save />
        <Link href="/admin/problems" className={buttonClass('outline', 'md')}>
          Cancel
        </Link>
        {problem ? (
          <Link href={`/problems/${problem.slug}`} className={buttonClass('ghost', 'md')}>
            View as a user →
          </Link>
        ) : null}
      </div>
    </form>
  );
}
