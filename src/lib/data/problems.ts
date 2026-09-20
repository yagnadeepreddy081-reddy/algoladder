import 'server-only';

import { query, queryOne } from '@/lib/db';
import { buildProblemQuery } from '@/lib/filters';
import { mapProblem, mapProgress, mapSubtopic, mapTopic } from '@/lib/data/mappers';
import type {
  Problem,
  ProblemFilters,
  ProblemWithProgress,
  Subtopic,
  Topic,
} from '@/lib/types';

/**
 * The single projection every problem listing uses. `$1` is always the current
 * user id (or null), which is what the LEFT JOIN onto progress keys off.
 */
const PROBLEM_SELECT = `
  SELECT
    p.*,
    t.slug AS topic_slug, t.name AS topic_name,
    s.slug AS subtopic_slug, s.name AS subtopic_name,
    pr.status AS progress_status,
    pr.is_bookmarked, pr.is_starred, pr.in_revision,
    pr.attempts, pr.time_spent_seconds, pr.confidence,
    pr.solution_url, pr.custom_tags,
    pr.next_review_date, pr.last_attempted_at, pr.solved_at
  FROM problems p
  JOIN topics t    ON t.id = p.topic_id
  JOIN subtopics s ON s.id = p.subtopic_id
  LEFT JOIN user_problem_progress pr ON pr.problem_id = p.id AND pr.user_id = $1
`;

function attach(row: Record<string, unknown>): ProblemWithProgress {
  return { ...mapProblem(row), progress: mapProgress(row) };
}

export interface ProblemPage {
  problems: ProblemWithProgress[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

/** The main listing query: search + every filter + sorting + pagination. */
export async function listProblems(
  filters: ProblemFilters,
  userId: string | null,
): Promise<ProblemPage> {
  const { where, orderBy, params } = buildProblemQuery(filters, userId);

  const page = filters.page ?? 1;
  const perPage = filters.perPage ?? 25;
  const offset = (page - 1) * perPage;

  const countRows = await query<{ n: string }>(
    `SELECT count(*)::text AS n
       FROM problems p
       JOIN topics t    ON t.id = p.topic_id
       JOIN subtopics s ON s.id = p.subtopic_id
       LEFT JOIN user_problem_progress pr ON pr.problem_id = p.id AND pr.user_id = $1
      WHERE ${where}`,
    params,
  );
  const total = Number(countRows[0]?.n ?? 0);

  const rows = await query(
    `${PROBLEM_SELECT} WHERE ${where} ORDER BY ${orderBy} LIMIT ${perPage} OFFSET ${offset}`,
    params,
  );

  return {
    problems: rows.map(attach),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getProblemBySlug(
  slug: string,
  userId: string | null,
): Promise<ProblemWithProgress | null> {
  const row = await queryOne(`${PROBLEM_SELECT} WHERE p.slug = $2 AND p.is_active`, [userId, slug]);
  return row ? attach(row) : null;
}

export async function getProblemById(
  id: string,
  userId: string | null,
): Promise<ProblemWithProgress | null> {
  const row = await queryOne(`${PROBLEM_SELECT} WHERE p.id = $2`, [userId, id]);
  return row ? attach(row) : null;
}

/** Previous and next problem in the recommended order. */
export async function getAdjacentProblems(
  recommendedOrder: number,
): Promise<{ prev: Pick<Problem, 'slug' | 'title'> | null; next: Pick<Problem, 'slug' | 'title'> | null }> {
  const [prev, next] = await Promise.all([
    queryOne<{ slug: string; title: string }>(
      `SELECT slug, title FROM problems
        WHERE is_active AND recommended_order < $1
        ORDER BY recommended_order DESC LIMIT 1`,
      [recommendedOrder],
    ),
    queryOne<{ slug: string; title: string }>(
      `SELECT slug, title FROM problems
        WHERE is_active AND recommended_order > $1
        ORDER BY recommended_order ASC LIMIT 1`,
      [recommendedOrder],
    ),
  ]);
  return { prev, next };
}

/**
 * Related problems: same pattern first, then same subtopic, then shared tags.
 * Scored in SQL so one round trip does the whole thing.
 */
export async function getRelatedProblems(
  problem: Problem,
  userId: string | null,
  limit = 6,
): Promise<ProblemWithProgress[]> {
  const rows = await query(
    `${PROBLEM_SELECT}
      WHERE p.is_active AND p.id <> $2
      ORDER BY (
          (CASE WHEN p.pattern     = $3 THEN 3 ELSE 0 END) +
          (CASE WHEN p.subtopic_id = $4 THEN 2 ELSE 0 END) +
          (CASE WHEN p.tags && $5::text[] THEN 1 ELSE 0 END)
        ) DESC,
        abs(p.recommended_order - $6) ASC
      LIMIT ${Math.max(1, Math.min(20, limit))}`,
    [userId, problem.id, problem.pattern, problem.subtopicId, problem.tags, problem.recommendedOrder],
  );
  // Drop anything that matched on nothing at all.
  return rows
    .map(attach)
    .filter(
      (p) =>
        p.pattern === problem.pattern ||
        p.subtopicId === problem.subtopicId ||
        p.tags.some((t) => problem.tags.includes(t)),
    );
}

/** Every problem in a topic, in order, with the user's progress. */
export async function listProblemsForTopic(
  topicSlug: string,
  userId: string | null,
): Promise<ProblemWithProgress[]> {
  const rows = await query(
    `${PROBLEM_SELECT} WHERE t.slug = $2 AND p.is_active ORDER BY p.problem_no_in_topic ASC`,
    [userId, topicSlug],
  );
  return rows.map(attach);
}

export async function listProblemsForSubtopic(
  topicSlug: string,
  subtopicSlug: string,
  userId: string | null,
): Promise<ProblemWithProgress[]> {
  const rows = await query(
    `${PROBLEM_SELECT}
      WHERE t.slug = $2 AND s.slug = $3 AND p.is_active
      ORDER BY p.problem_no_in_topic ASC`,
    [userId, topicSlug, subtopicSlug],
  );
  return rows.map(attach);
}

// ---------------------------------------------------------------- topics ---

export async function listTopics(): Promise<Topic[]> {
  const rows = await query(
    `SELECT t.*, count(p.id)::int AS problem_count
       FROM topics t
       LEFT JOIN problems p ON p.topic_id = t.id AND p.is_active
      GROUP BY t.id
      ORDER BY t.position ASC`,
  );
  return rows.map(mapTopic);
}

export async function getTopicBySlug(slug: string): Promise<Topic | null> {
  const row = await queryOne(
    `SELECT t.*, count(p.id)::int AS problem_count
       FROM topics t
       LEFT JOIN problems p ON p.topic_id = t.id AND p.is_active
      WHERE t.slug = $1
      GROUP BY t.id`,
    [slug],
  );
  return row ? mapTopic(row) : null;
}

export async function listSubtopics(topicSlug: string): Promise<Subtopic[]> {
  const rows = await query(
    `SELECT s.*, t.slug AS topic_slug, count(p.id)::int AS problem_count
       FROM subtopics s
       JOIN topics t ON t.id = s.topic_id
       LEFT JOIN problems p ON p.subtopic_id = s.id AND p.is_active
      WHERE t.slug = $1
      GROUP BY s.id, t.slug
      ORDER BY s.position ASC`,
    [topicSlug],
  );
  return rows.map(mapSubtopic);
}

export async function getSubtopic(
  topicSlug: string,
  subtopicSlug: string,
): Promise<Subtopic | null> {
  const row = await queryOne(
    `SELECT s.*, t.slug AS topic_slug, count(p.id)::int AS problem_count
       FROM subtopics s
       JOIN topics t ON t.id = s.topic_id
       LEFT JOIN problems p ON p.subtopic_id = s.id AND p.is_active
      WHERE t.slug = $1 AND s.slug = $2
      GROUP BY s.id, t.slug`,
    [topicSlug, subtopicSlug],
  );
  return row ? mapSubtopic(row) : null;
}

// ------------------------------------------------------- facets for the UI ---

export interface FilterFacets {
  topics: { slug: string; name: string }[];
  subtopics: { slug: string; name: string; topicSlug: string }[];
  tags: string[];
  companies: string[];
  platforms: string[];
}

export async function getFilterFacets(): Promise<FilterFacets> {
  const [topics, subtopics, tags, companies, platforms] = await Promise.all([
    query<{ slug: string; name: string }>(
      'SELECT slug, name FROM topics ORDER BY position ASC',
    ),
    query<{ slug: string; name: string; topic_slug: string }>(
      `SELECT s.slug, s.name, t.slug AS topic_slug
         FROM subtopics s JOIN topics t ON t.id = s.topic_id
        ORDER BY t.position, s.position`,
    ),
    query<{ tag: string }>(
      `SELECT DISTINCT unnest(tags) AS tag FROM problems WHERE is_active ORDER BY tag`,
    ),
    query<{ company: string }>(
      `SELECT DISTINCT unnest(companies) AS company FROM problems WHERE is_active ORDER BY company`,
    ),
    query<{ platform: string }>(
      'SELECT DISTINCT platform FROM problems WHERE is_active ORDER BY platform',
    ),
  ]);

  return {
    topics,
    subtopics: subtopics.map((s) => ({ slug: s.slug, name: s.name, topicSlug: s.topic_slug })),
    tags: tags.map((t) => t.tag),
    companies: companies.map((c) => c.company),
    platforms: platforms.map((p) => p.platform),
  };
}

/** The number the landing page and dashboard display. Read from the database. */
export async function getTotalProblemCount(): Promise<number> {
  const row = await queryOne<{ n: number }>(
    'SELECT count(*)::int AS n FROM problems WHERE is_active',
  );
  return row?.n ?? 0;
}
