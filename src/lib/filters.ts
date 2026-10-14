import type { Difficulty, ProblemFilters, ProgressStatus, SortKey } from '@/lib/types';
import { DIFFICULTIES, PROGRESS_STATUSES } from '@/lib/types';

/**
 * Pure filter logic, deliberately kept free of database imports so the test
 * suite can exercise it directly. `parseFilters` turns a URL query string into
 * a validated filter object; `buildProblemQuery` turns that object into SQL.
 */

const SORT_KEYS: SortKey[] = [
  'recommended',
  'difficulty',
  'title',
  'recently-completed',
  'status',
];

export const DEFAULT_PER_PAGE = 25;
const MAX_PER_PAGE = 100;

function list(params: URLSearchParams, key: string): string[] {
  // Accept both ?difficulty=Easy&difficulty=Hard and ?difficulty=Easy,Hard
  const out: string[] = [];
  for (const raw of params.getAll(key)) {
    for (const part of raw.split(',')) {
      const v = part.trim();
      if (v) out.push(v);
    }
  }
  return [...new Set(out)];
}

/** Turn a query string (or a Next.js searchParams object) into filters. */
export function parseFilters(
  input: URLSearchParams | Record<string, string | string[] | undefined> | string,
): ProblemFilters {
  let params: URLSearchParams;
  if (typeof input === 'string') {
    params = new URLSearchParams(input);
  } else if (input instanceof URLSearchParams) {
    params = input;
  } else {
    params = new URLSearchParams();
    for (const [k, v] of Object.entries(input)) {
      if (v == null) continue;
      if (Array.isArray(v)) v.forEach((item) => params.append(k, item));
      else params.append(k, v);
    }
  }

  const q = (params.get('q') ?? '').trim();
  const difficulty = list(params, 'difficulty').filter((d): d is Difficulty =>
    (DIFFICULTIES as string[]).includes(d),
  );
  const status = list(params, 'status').filter((s): s is ProgressStatus =>
    (PROGRESS_STATUSES as string[]).includes(s),
  );

  const sortRaw = params.get('sort') as SortKey | null;
  const sort: SortKey = sortRaw && SORT_KEYS.includes(sortRaw) ? sortRaw : 'recommended';

  const page = Math.max(1, Number(params.get('page') ?? 1) || 1);
  const perPageRaw = Number(params.get('perPage') ?? DEFAULT_PER_PAGE) || DEFAULT_PER_PAGE;
  const perPage = Math.min(MAX_PER_PAGE, Math.max(5, perPageRaw));

  const premiumRaw = params.get('premium');
  const premium =
    premiumRaw === 'free' || premiumRaw === 'premium' ? (premiumRaw as 'free' | 'premium') : undefined;

  const filters: ProblemFilters = { sort, page, perPage };

  if (q) filters.q = q;
  if (params.get('topic')) filters.topic = params.get('topic')!;
  if (params.get('subtopic')) filters.subtopic = params.get('subtopic')!;
  if (difficulty.length) filters.difficulty = difficulty;
  if (status.length) filters.status = status;
  if (params.get('bookmarked') === '1' || params.get('bookmarked') === 'true') {
    filters.bookmarked = true;
  }
  if (params.get('revision') === '1' || params.get('revision') === 'true') {
    filters.revision = true;
  }
  const platform = list(params, 'platform');
  if (platform.length) filters.platform = platform;
  const tags = list(params, 'tags');
  if (tags.length) filters.tags = tags;
  const companies = list(params, 'companies');
  if (companies.length) filters.companies = companies;
  if (premium) filters.premium = premium;

  return filters;
}

/** Serialise filters back into a query string, dropping defaults. */
export function serialiseFilters(f: ProblemFilters): string {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.topic) p.set('topic', f.topic);
  if (f.subtopic) p.set('subtopic', f.subtopic);
  if (f.difficulty?.length) p.set('difficulty', f.difficulty.join(','));
  if (f.status?.length) p.set('status', f.status.join(','));
  if (f.bookmarked) p.set('bookmarked', '1');
  if (f.revision) p.set('revision', '1');
  if (f.platform?.length) p.set('platform', f.platform.join(','));
  if (f.tags?.length) p.set('tags', f.tags.join(','));
  if (f.companies?.length) p.set('companies', f.companies.join(','));
  if (f.premium) p.set('premium', f.premium);
  if (f.sort && f.sort !== 'recommended') p.set('sort', f.sort);
  if (f.page && f.page > 1) p.set('page', String(f.page));
  if (f.perPage && f.perPage !== DEFAULT_PER_PAGE) p.set('perPage', String(f.perPage));
  return p.toString();
}

/** How many filters (other than sorting/paging) are active. */
export function countActiveFilters(f: ProblemFilters): number {
  let n = 0;
  if (f.q) n += 1;
  if (f.topic) n += 1;
  if (f.subtopic) n += 1;
  if (f.difficulty?.length) n += 1;
  if (f.status?.length) n += 1;
  if (f.bookmarked) n += 1;
  if (f.revision) n += 1;
  if (f.platform?.length) n += 1;
  if (f.tags?.length) n += 1;
  if (f.companies?.length) n += 1;
  if (f.premium) n += 1;
  return n;
}

export interface BuiltQuery {
  where: string;
  orderBy: string;
  params: unknown[];
  /** Index (1-based) of the userId parameter inside `params`. */
  userParamIndex: number;
}

/**
 * Build the WHERE and ORDER BY fragments for the problem listing.
 *
 * The caller supplies `$1` = userId (possibly null) so that the LEFT JOIN onto
 * user_problem_progress can be written once. Every value is parameterised —
 * nothing from the user is ever interpolated into SQL text.
 */
export function buildProblemQuery(filters: ProblemFilters, userId: string | null): BuiltQuery {
  const params: unknown[] = [userId];
  const clauses: string[] = ['p.is_active'];

  const add = (value: unknown) => {
    params.push(value);
    return `$${params.length}`;
  };

  if (filters.q) {
    // Match the title, the description or any tag.
    const like = add(`%${filters.q.toLowerCase()}%`);
    const exact = add(filters.q.toLowerCase());
    clauses.push(
      `(lower(p.title) LIKE ${like} OR lower(p.description) LIKE ${like} ` +
        `OR EXISTS (SELECT 1 FROM unnest(p.tags) t WHERE lower(t) LIKE ${like}) ` +
        `OR lower(p.slug) = ${exact})`,
    );
  }

  if (filters.topic) clauses.push(`t.slug = ${add(filters.topic)}`);
  if (filters.subtopic) clauses.push(`s.slug = ${add(filters.subtopic)}`);

  if (filters.difficulty?.length) {
    clauses.push(`p.difficulty = ANY(${add(filters.difficulty)}::difficulty_level[])`);
  }

  if (filters.status?.length) {
    const wantsNotStarted = filters.status.includes('not_started');
    const others = filters.status.filter((s) => s !== 'not_started');
    const parts: string[] = [];
    if (others.length) parts.push(`pr.status = ANY(${add(others)}::progress_status[])`);
    if (wantsNotStarted) parts.push(`(pr.status IS NULL OR pr.status = 'not_started')`);
    clauses.push(`(${parts.join(' OR ')})`);
  }

  if (filters.bookmarked) clauses.push('COALESCE(pr.is_bookmarked, false)');
  if (filters.revision) clauses.push('COALESCE(pr.in_revision, false)');

  if (filters.platform?.length) clauses.push(`p.platform = ANY(${add(filters.platform)}::text[])`);
  if (filters.tags?.length) clauses.push(`p.tags && ${add(filters.tags)}::text[]`);
  if (filters.companies?.length) clauses.push(`p.companies && ${add(filters.companies)}::text[]`);

  if (filters.premium === 'premium') clauses.push('p.is_premium');
  if (filters.premium === 'free') clauses.push('NOT p.is_premium');

  const orderBy = buildOrderBy(filters.sort ?? 'recommended');

  return { where: clauses.join(' AND '), orderBy, params, userParamIndex: 1 };
}

export function buildOrderBy(sort: SortKey): string {
  switch (sort) {
    case 'difficulty':
      // Easy, Medium, Hard — then recommended order inside each band.
      return `CASE p.difficulty WHEN 'Easy' THEN 0 WHEN 'Medium' THEN 1 ELSE 2 END ASC, p.recommended_order ASC`;
    case 'title':
      // Keep pagination and title order consistent across PostgreSQL locales.
      return 'lower(p.title) COLLATE "C" ASC, p.overall_no ASC';
    case 'recently-completed':
      return 'pr.solved_at DESC NULLS LAST, p.recommended_order ASC';
    case 'status':
      // Unstarted first — that is what you want when you are picking what to do next.
      return `CASE COALESCE(pr.status::text, 'not_started')
                WHEN 'not_started'    THEN 0
                WHEN 'in_progress'    THEN 1
                WHEN 'needs_revision' THEN 2
                ELSE 3 END ASC, p.recommended_order ASC`;
    case 'recommended':
    default:
      return 'p.recommended_order ASC';
  }
}

