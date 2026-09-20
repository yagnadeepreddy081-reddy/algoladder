'use client';

import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';

import { buttonClass, inputClass } from '@/components/ui/primitives';
import { DIFFICULTIES, PROGRESS_STATUSES, SORT_OPTIONS, STATUS_LABEL } from '@/lib/types';
import type { FilterFacets } from '@/lib/data/problems';

/**
 * Search and filters, all driven through the URL.
 *
 * Keeping state in the query string is what makes filters composable: they
 * combine with each other and with sorting for free, the result is shareable
 * and bookmarkable, and the back button behaves.
 *
 * Two implementation notes worth keeping:
 *
 * 1. `useSearchParams()` returns a fresh object on every render, so anything
 *    reacting to "the URL changed" keys off the serialised string instead.
 *    Keying off the object re-runs the sync effect on every render, which wipes
 *    whatever the user is part-way through typing.
 *
 * 2. The search box is a real GET <form>. The debounce submits it rather than
 *    calling router.push(): a push issued outside a user event fires the RSC
 *    request but does not reliably commit the navigation, so the URL silently
 *    stays put. Submitting the form is a plain browser navigation, which always
 *    lands — and it means search still works with JavaScript switched off.
 *    The filter chips and selects do use router.push(), because those run
 *    inside a real click or change event where it behaves.
 */
export function FilterBar({
  facets,
  total,
  showing,
  canUseCompanyFilter,
}: {
  facets: FilterFacets;
  total: number;
  showing: number;
  canUseCompanyFilter: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const queryString = params.toString();
  const urlQuery = params.get('q') ?? '';

  const [search, setSearch] = useState(urlQuery);
  const [open, setOpen] = useState(false);

  // Keep the box in step when the URL changes from elsewhere: Clear all, the
  // back button, or somebody opening a shared link.
  useEffect(() => {
    setSearch(urlQuery);
  }, [urlQuery]);

  /** Build a URL with one mutation applied to the current query. */
  const hrefWith = useCallback(
    (mutate: (p: URLSearchParams) => void): string => {
      const next = new URLSearchParams(queryString);
      mutate(next);
      next.delete('page'); // any filter change returns you to page one
      const qs = next.toString();
      return `${pathname}${qs ? `?${qs}` : ''}`;
    },
    [queryString, pathname],
  );

  const go = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      router.push(hrefWith(mutate), { scroll: false });
    },
    [hrefWith, router],
  );

  // ---- debounced search ---------------------------------------------------

  const [debounced, setDebounced] = useState(urlQuery);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Submitting the real form is what actually performs the search. It is a
  // plain GET navigation, so it works identically with and without JavaScript,
  // and it carries every other active filter along in the hidden inputs below.
  useEffect(() => {
    if (debounced === urlQuery) return;
    const id = setTimeout(() => formRef.current?.requestSubmit(), 0);
    return () => clearTimeout(id);
  }, [debounced, urlQuery]);

  // After a search navigation, put the caret back at the end of the box so the
  // user can carry on typing where they left off.
  useEffect(() => {
    if (!urlQuery) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    el.setSelectionRange(el.value.length, el.value.length);
  }, [urlQuery]);

  // ---- filter helpers -----------------------------------------------------

  const listValues = (key: string): string[] => {
    const raw = params.get(key);
    return raw ? raw.split(',').filter(Boolean) : [];
  };

  const toggleInList = (key: string, value: string) =>
    go((p) => {
      const current = new Set(listValues(key));
      if (current.has(value)) current.delete(value);
      else current.add(value);
      if (current.size) p.set(key, [...current].join(','));
      else p.delete(key);
    });

  const setSingle = (key: string, value: string) =>
    go((p) => {
      if (value) p.set(key, value);
      else p.delete(key);
    });

  const toggleFlag = (key: string) =>
    go((p) => {
      if (p.get(key)) p.delete(key);
      else p.set(key, '1');
    });

  const activeCount = useMemo(() => {
    const keys = [
      'q',
      'topic',
      'subtopic',
      'difficulty',
      'status',
      'bookmarked',
      'revision',
      'platform',
      'tags',
      'companies',
      'premium',
    ];
    const p = new URLSearchParams(queryString);
    return keys.reduce((n, key) => (p.get(key) ? n + 1 : n), 0);
  }, [queryString]);

  const topicFilter = params.get('topic') ?? '';
  const subtopicsForTopic = topicFilter
    ? facets.subtopics.filter((s) => s.topicSlug === topicFilter)
    : facets.subtopics;

  // Every non-search filter, as hidden inputs, so the no-JavaScript form submit
  // below preserves them instead of throwing them away.
  const hiddenFilters = useMemo(() => {
    const p = new URLSearchParams(queryString);
    p.delete('q');
    p.delete('page');
    return [...p.entries()];
  }, [queryString]);

  const chip = (active: boolean) =>
    clsx(
      'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
      active
        ? 'border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-300'
        : 'border-[hsl(var(--border-strong))] text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--surface-2))]',
    );

  return (
    <div className="mb-5 overflow-hidden rounded-[var(--radius-card)] border border-[hsl(var(--border))] bg-[hsl(var(--surface))]">
      {/* top row: search + sort + panel toggle */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[hsl(var(--border))] p-3">
        {/* A real GET form, so Enter works and search still works with no JS. */}
        <form
          ref={formRef}
          method="get"
          action={pathname}
          role="search"
          className="relative min-w-0 flex-1 sm:min-w-64"
        >
          {hiddenFilters.map(([key, value]) => (
            <input key={`${key}-${value}`} type="hidden" name={key} value={value} />
          ))}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[hsl(var(--text-subtle))]"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            name="q"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problems, descriptions and tags…"
            aria-label="Search problems"
            className={clsx(inputClass, 'pl-9')}
          />
          <button type="submit" className="sr-only">
            Search
          </button>
        </form>

        <label className="inline-flex items-center gap-2">
          <span className="sr-only">Sort by</span>
          <select
            value={params.get('sort') ?? 'recommended'}
            onChange={(e) => setSingle('sort', e.target.value === 'recommended' ? '' : e.target.value)}
            className={clsx(inputClass, 'h-10 w-auto cursor-pointer py-0')}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                Sort: {o.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={buttonClass('outline', 'md')}
        >
          Filters
          {activeCount ? (
            <span className="tabular ml-1 rounded-full bg-brand-600 px-1.5 text-[10px] font-semibold text-white">
              {activeCount}
            </span>
          ) : null}
        </button>

        {activeCount ? (
          <Link href={pathname} scroll={false} className={buttonClass('ghost', 'md')}>
            Clear all
          </Link>
        ) : null}
      </div>

      {/* quick chips, always visible */}
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2.5">
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => toggleInList('difficulty', d)}
            className={chip(listValues('difficulty').includes(d))}
          >
            {d}
          </button>
        ))}
        <span className="mx-1 w-px self-stretch bg-[hsl(var(--border))]" aria-hidden />
        <button
          type="button"
          onClick={() => toggleInList('status', 'not_started')}
          className={chip(listValues('status').includes('not_started'))}
        >
          Unsolved
        </button>
        <button
          type="button"
          onClick={() => toggleInList('status', 'solved')}
          className={chip(listValues('status').includes('solved'))}
        >
          Solved
        </button>
        <button
          type="button"
          onClick={() => toggleFlag('bookmarked')}
          className={chip(Boolean(params.get('bookmarked')))}
        >
          Bookmarked
        </button>
        <button
          type="button"
          onClick={() => toggleFlag('revision')}
          className={chip(Boolean(params.get('revision')))}
        >
          In revision
        </button>

        <span className="flex-1" />

        <p className="tabular text-xs whitespace-nowrap text-[hsl(var(--text-muted))]">
          <strong className="font-semibold text-[hsl(var(--text))]">{showing}</strong> of{' '}
          <strong className="font-semibold text-[hsl(var(--text))]">{total}</strong> problems
        </p>
      </div>

      {/* expanded panel */}
      {open ? (
        <div className="animate-in-up grid gap-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[hsl(var(--text))]">Topic</span>
            <select
              value={topicFilter}
              onChange={(e) =>
                go((p) => {
                  p.delete('subtopic');
                  if (e.target.value) p.set('topic', e.target.value);
                  else p.delete('topic');
                })
              }
              className={clsx(inputClass, 'cursor-pointer')}
            >
              <option value="">All topics</option>
              {facets.topics.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[hsl(var(--text))]">Subtopic</span>
            <select
              value={params.get('subtopic') ?? ''}
              onChange={(e) => setSingle('subtopic', e.target.value)}
              className={clsx(inputClass, 'cursor-pointer')}
            >
              <option value="">All subtopics</option>
              {subtopicsForTopic.map((s) => (
                <option key={`${s.topicSlug}-${s.slug}`} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[hsl(var(--text))]">Platform</span>
            <select
              value={params.get('platform') ?? ''}
              onChange={(e) => setSingle('platform', e.target.value)}
              className={clsx(inputClass, 'cursor-pointer')}
            >
              <option value="">All platforms</option>
              {facets.platforms.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[hsl(var(--text))]">Access</span>
            <select
              value={params.get('premium') ?? ''}
              onChange={(e) => setSingle('premium', e.target.value)}
              className={clsx(inputClass, 'cursor-pointer')}
            >
              <option value="">Free and premium</option>
              <option value="free">Free only</option>
              <option value="premium">Premium only</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[hsl(var(--text))]">
              Company{' '}
              {canUseCompanyFilter ? null : (
                <span className="font-normal text-[hsl(var(--text-subtle))]">(Pro)</span>
              )}
            </span>
            <select
              value={params.get('companies') ?? ''}
              disabled={!canUseCompanyFilter}
              onChange={(e) => setSingle('companies', e.target.value)}
              className={clsx(inputClass, 'cursor-pointer')}
            >
              <option value="">All companies</option>
              {facets.companies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[hsl(var(--text))]">Tag</span>
            <select
              value={params.get('tags') ?? ''}
              onChange={(e) => setSingle('tags', e.target.value)}
              className={clsx(inputClass, 'cursor-pointer')}
            >
              <option value="">All tags</option>
              {facets.tags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="sm:col-span-2 lg:col-span-3">
            <legend className="mb-1.5 text-xs font-medium text-[hsl(var(--text))]">Status</legend>
            <div className="flex flex-wrap gap-1.5">
              {PROGRESS_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleInList('status', s)}
                  className={chip(listValues('status').includes(s))}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      ) : null}
    </div>
  );
}
