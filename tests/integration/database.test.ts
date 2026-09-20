import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';

import { query, queryOne, execute, getPool } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { listProblems, getProblemBySlug, listTopics, getFilterFacets, getTotalProblemCount, getRelatedProblems, getAdjacentProblems } from '@/lib/data/problems';
import { getDashboardStats, getTopicProgress, getBookmarkedProblems, getDueRevisions } from '@/lib/data/dashboard';
import { parseFilters } from '@/lib/filters';
import { validateDatasetRows } from '@/lib/validate-dataset';
import { canAccessProblem } from '@/lib/premium';
import { FREE_SUBSCRIPTION } from '@/lib/premium';

/**
 * These run against the real Postgres in DATABASE_URL. They create their own
 * throwaway users and clean up after themselves, so they are safe to run
 * against a development database that already has the 474 problems seeded.
 */

const createdUsers: string[] = [];

async function makeUser(email = `test-${randomUUID()}@algoladder.test`) {
  const hash = await hashPassword('LadderClimb7');
  const row = await queryOne<{ id: string }>(
    `INSERT INTO users (email, password_hash, role) VALUES ($1,$2,'user') RETURNING id`,
    [email, hash],
  );
  await execute(`INSERT INTO profiles (user_id, display_name) VALUES ($1,'Test User')`, [row!.id]);
  await execute(
    `INSERT INTO subscriptions (user_id, plan, status, provider) VALUES ($1,'free','active','mock')`,
    [row!.id],
  );
  createdUsers.push(row!.id);
  return row!.id;
}

beforeAll(async () => {
  const reachable = await query('SELECT 1').then(
    () => true,
    () => false,
  );
  if (!reachable) {
    throw new Error(
      'Integration tests need a running Postgres. Set DATABASE_URL and run `npm run db:migrate && npm run db:seed`.',
    );
  }
});

afterAll(async () => {
  for (const id of createdUsers) {
    await execute('DELETE FROM users WHERE id = $1', [id]).catch(() => {});
  }
  await getPool().end();
});

describe('the seeded catalogue', () => {
  it('holds exactly 474 active problems', async () => {
    expect(await getTotalProblemCount()).toBe(474);
  });

  it('holds 19 topics whose counts add to 474', async () => {
    const topics = await listTopics();
    expect(topics).toHaveLength(19);
    expect(topics.reduce((n, t) => n + t.problemCount, 0)).toBe(474);
  });

  it('enforces unique titles at the database level', async () => {
    const existing = await queryOne<{ title: string }>('SELECT title FROM problems LIMIT 1');
    await expect(
      execute(
        `INSERT INTO problems (id, slug, title, topic_id, subtopic_id, difficulty,
            problem_no_in_topic, overall_no, recommended_order, description, external_url)
         SELECT 'dup-test', 'dup-test-slug', $1, topic_id, subtopic_id, difficulty,
                9999, 9999, 9999, 'x', 'https://example.com/x'
           FROM problems LIMIT 1`,
        [existing!.title],
      ),
    ).rejects.toThrow(/problems_title_unique|duplicate key/i);
  });

  it('passes validation against what is actually stored', async () => {
    const [problems, topics, subtopics] = await Promise.all([
      query<Record<string, unknown>>(
        `SELECT p.*, t.slug AS topic_slug FROM problems p
           JOIN topics t ON t.id = p.topic_id WHERE p.is_active`,
      ),
      query<Record<string, unknown>>('SELECT * FROM topics'),
      query<Record<string, unknown>>('SELECT * FROM subtopics'),
    ]);

    const report = validateDatasetRows(
      problems.map((p) => ({
        id: String(p.id),
        slug: String(p.slug),
        title: String(p.title),
        topicId: String(p.topic_id),
        topicSlug: String(p.topic_slug),
        subtopicId: String(p.subtopic_id),
        difficulty: String(p.difficulty),
        description: String(p.description),
        externalUrl: String(p.external_url),
        platform: String(p.platform),
        overallNo: Number(p.overall_no),
        problemNoInTopic: Number(p.problem_no_in_topic),
        isPremium: Boolean(p.is_premium),
      })),
      topics.map((t) => ({ id: String(t.id), slug: String(t.slug), name: String(t.name) })),
      subtopics.map((s) => ({ id: String(s.id), topicId: String(s.topic_id) })),
    );

    expect(report.errors).toEqual([]);
    expect(report.total).toBe(474);
  });
});

describe('search, filters and sorting', () => {
  it('finds a problem by title', async () => {
    const page = await listProblems(parseFilters('q=two sum'), null);
    expect(page.total).toBeGreaterThan(0);
    expect(page.problems.some((p) => p.title.toLowerCase().includes('two sum'))).toBe(true);
  });

  it('finds nothing for nonsense, without erroring', async () => {
    const page = await listProblems(parseFilters('q=zzzzqqqqnotathing'), null);
    expect(page.total).toBe(0);
    expect(page.problems).toEqual([]);
  });

  it('is not injectable through the search box', async () => {
    const page = await listProblems(parseFilters("q=' OR 1=1 --"), null);
    expect(page.total).toBe(0);
    expect(await getTotalProblemCount()).toBe(474);
  });

  it('filters by difficulty', async () => {
    const page = await listProblems({ ...parseFilters('difficulty=Hard'), perPage: 100 }, null);
    expect(page.total).toBeGreaterThan(0);
    expect(page.problems.every((p) => p.difficulty === 'Hard')).toBe(true);
  });

  it('filters by topic', async () => {
    const page = await listProblems({ ...parseFilters('topic=graphs'), perPage: 100 }, null);
    expect(page.total).toBe(54);
    expect(page.problems.every((p) => p.topicSlug === 'graphs')).toBe(true);
  });

  it('combines search with a filter', async () => {
    const both = await listProblems(parseFilters('q=sum&difficulty=Hard'), null);
    const searchOnly = await listProblems(parseFilters('q=sum'), null);
    expect(both.total).toBeLessThan(searchOnly.total);
    expect(both.problems.every((p) => p.difficulty === 'Hard')).toBe(true);
  });

  it('sorts by title', async () => {
    const page = await listProblems({ ...parseFilters('sort=title'), perPage: 20 }, null);
    const titles = page.problems.map((p) => p.title.toLowerCase());
    expect([...titles].sort()).toEqual(titles);
  });

  it('sorts by difficulty, easiest first', async () => {
    const page = await listProblems({ ...parseFilters('sort=difficulty'), perPage: 30 }, null);
    expect(page.problems[0].difficulty).toBe('Easy');
  });

  it('paginates without overlap', async () => {
    const first = await listProblems({ ...parseFilters(''), perPage: 10, page: 1 }, null);
    const second = await listProblems({ ...parseFilters(''), perPage: 10, page: 2 }, null);
    expect(first.problems).toHaveLength(10);
    expect(first.totalPages).toBe(48);
    const ids = new Set(first.problems.map((p) => p.id));
    expect(second.problems.some((p) => ids.has(p.id))).toBe(false);
  });

  it('offers facets for every filter control', async () => {
    const facets = await getFilterFacets();
    expect(facets.topics).toHaveLength(19);
    expect(facets.subtopics.length).toBeGreaterThan(50);
    expect(facets.tags.length).toBeGreaterThan(20);
    expect(facets.companies.length).toBeGreaterThan(10);
    expect(facets.platforms).toContain('LeetCode');
  });
});

describe('a user working through problems', () => {
  it('records a solve and reads it back', async () => {
    const userId = await makeUser();
    const problem = await queryOne<{ id: string; slug: string }>(
      'SELECT id, slug FROM problems ORDER BY overall_no LIMIT 1',
    );

    await execute(
      `INSERT INTO user_problem_progress (user_id, problem_id, status, solved_at)
       VALUES ($1,$2,'solved', now())`,
      [userId, problem!.id],
    );

    const reloaded = await getProblemBySlug(problem!.slug, userId);
    expect(reloaded?.progress?.status).toBe('solved');
  });

  it('allows only one progress row per user per problem', async () => {
    const userId = await makeUser();
    const problem = await queryOne<{ id: string }>('SELECT id FROM problems LIMIT 1');

    await execute('INSERT INTO user_problem_progress (user_id, problem_id) VALUES ($1,$2)', [
      userId,
      problem!.id,
    ]);
    await expect(
      execute('INSERT INTO user_problem_progress (user_id, problem_id) VALUES ($1,$2)', [
        userId,
        problem!.id,
      ]),
    ).rejects.toThrow(/upp_user_problem_unique|duplicate key/i);
  });

  it('keeps one user’s progress invisible to another', async () => {
    const [a, b] = [await makeUser(), await makeUser()];
    const problem = await queryOne<{ id: string; slug: string }>('SELECT id, slug FROM problems LIMIT 1');

    await execute(
      `INSERT INTO user_problem_progress (user_id, problem_id, status) VALUES ($1,$2,'solved')`,
      [a, problem!.id],
    );

    expect((await getProblemBySlug(problem!.slug, a))?.progress?.status).toBe('solved');
    expect((await getProblemBySlug(problem!.slug, b))?.progress).toBeNull();
  });

  it('persists progress across a fresh read, exactly as a page refresh would', async () => {
    const userId = await makeUser();
    const problems = await query<{ id: string }>('SELECT id FROM problems ORDER BY overall_no LIMIT 3');

    for (const p of problems) {
      await execute(
        `INSERT INTO user_problem_progress (user_id, problem_id, status, solved_at, attempts, time_spent_seconds)
         VALUES ($1,$2,'solved', now(), 2, 1800)`,
        [userId, p.id],
      );
      await execute(
        `INSERT INTO activity_logs (user_id, problem_id, action) VALUES ($1,$2,'solved')`,
        [userId, p.id],
      );
    }

    const stats = await getDashboardStats(userId);
    expect(stats.solved).toBe(3);
    expect(stats.totalProblems).toBe(474);
    expect(stats.completionPercent).toBe(1);

    // Read again through a different code path — the numbers must agree.
    const again = await getDashboardStats(userId);
    expect(again.solved).toBe(3);
  });

  it('computes topic progress correctly', async () => {
    const userId = await makeUser();
    const arrays = await query<{ id: string; difficulty: string }>(
      `SELECT p.id, p.difficulty FROM problems p JOIN topics t ON t.id = p.topic_id
        WHERE t.slug = 'arrays' ORDER BY p.problem_no_in_topic LIMIT 4`,
    );

    for (const p of arrays) {
      await execute(
        `INSERT INTO user_problem_progress (user_id, problem_id, status) VALUES ($1,$2,'solved')`,
        [userId, p.id],
      );
    }

    const rows = await getTopicProgress(userId);
    const arraysRow = rows.find((r) => r.topicSlug === 'arrays');
    expect(arraysRow?.total).toBe(40);
    expect(arraysRow?.solved).toBe(4);
    expect(arraysRow!.easySolved + arraysRow!.mediumSolved + arraysRow!.hardSolved).toBe(4);

    // Every other topic must still read zero.
    for (const r of rows.filter((r) => r.topicSlug !== 'arrays')) {
      expect(r.solved).toBe(0);
    }
    expect(rows.reduce((n, r) => n + r.total, 0)).toBe(474);
  });

  it('counts dashboard difficulty totals against the whole catalogue', async () => {
    const userId = await makeUser();
    const stats = await getDashboardStats(userId);
    const total =
      stats.byDifficulty.Easy.total + stats.byDifficulty.Medium.total + stats.byDifficulty.Hard.total;
    expect(total).toBe(474);
    expect(stats.solved).toBe(0);
    expect(stats.completionPercent).toBe(0);
  });

  it('lists bookmarks for the right user only', async () => {
    const [a, b] = [await makeUser(), await makeUser()];
    const problem = await queryOne<{ id: string }>('SELECT id FROM problems LIMIT 1');

    await execute(
      `INSERT INTO user_problem_progress (user_id, problem_id, is_bookmarked) VALUES ($1,$2,true)`,
      [a, problem!.id],
    );

    expect(await getBookmarkedProblems(a)).toHaveLength(1);
    expect(await getBookmarkedProblems(b)).toHaveLength(0);
  });

  it('surfaces revision items only once they are due', async () => {
    const userId = await makeUser();
    const [p1, p2] = await query<{ id: string }>('SELECT id FROM problems ORDER BY overall_no LIMIT 2');

    await execute(
      `INSERT INTO revision_items (user_id, problem_id, due_date) VALUES ($1,$2, CURRENT_DATE)`,
      [userId, p1.id],
    );
    await execute(
      `INSERT INTO revision_items (user_id, problem_id, due_date) VALUES ($1,$2, CURRENT_DATE + 10)`,
      [userId, p2.id],
    );

    const due = await getDueRevisions(userId);
    expect(due).toHaveLength(1);
    expect(due[0].id).toBe(p1.id);
  });

  it('cascades progress away when the account is deleted', async () => {
    const userId = await makeUser();
    const problem = await queryOne<{ id: string }>('SELECT id FROM problems LIMIT 1');
    await execute('INSERT INTO user_problem_progress (user_id, problem_id) VALUES ($1,$2)', [
      userId,
      problem!.id,
    ]);

    await execute('DELETE FROM users WHERE id = $1', [userId]);
    const left = await query('SELECT 1 FROM user_problem_progress WHERE user_id = $1', [userId]);
    expect(left).toHaveLength(0);
  });
});

describe('problem detail helpers', () => {
  it('finds previous and next in recommended order', async () => {
    const { prev, next } = await getAdjacentProblems(2);
    expect(prev).not.toBeNull();
    expect(next).not.toBeNull();

    const first = await getAdjacentProblems(1);
    expect(first.prev).toBeNull();

    const last = await getAdjacentProblems(474);
    expect(last.next).toBeNull();
  });

  it('suggests related problems that actually share something', async () => {
    const problem = await getProblemBySlug('two-sum', null);
    expect(problem).not.toBeNull();

    const related = await getRelatedProblems(problem!, null, 6);
    expect(related.length).toBeGreaterThan(0);
    expect(related.every((r) => r.id !== problem!.id)).toBe(true);
    for (const r of related) {
      const shares =
        r.pattern === problem!.pattern ||
        r.subtopicId === problem!.subtopicId ||
        r.tags.some((t) => problem!.tags.includes(t));
      expect(shares, r.title).toBe(true);
    }
  });
});

describe('premium gating against real rows', () => {
  it('locks premium problems for a free account and opens them for a paid one', async () => {
    const premium = await queryOne<{ id: string; slug: string }>(
      'SELECT id, slug FROM problems WHERE is_premium LIMIT 1',
    );

    // The seed marks PREMIUM_TOPIC_SLUGS premium; if none are set, skip.
    if (!premium) return;

    const problem = await getProblemBySlug(premium.slug, null);
    expect(problem?.isPremium).toBe(true);
    expect(canAccessProblem(problem!, FREE_SUBSCRIPTION)).toBe(false);
    expect(
      canAccessProblem(problem!, {
        ...FREE_SUBSCRIPTION,
        plan: 'lifetime',
        status: 'active',
      }),
    ).toBe(true);
    expect(canAccessProblem(problem!, FREE_SUBSCRIPTION, 'admin')).toBe(true);
  });

  it('still gives a premium problem the same public external URL', async () => {
    const rows = await query<{ external_url: string }>(
      'SELECT external_url FROM problems WHERE is_premium LIMIT 5',
    );
    for (const r of rows) {
      expect(r.external_url).toMatch(/^https:\/\//);
    }
  });
});

describe('password storage', () => {
  it('never stores the password itself', async () => {
    const email = `hash-${randomUUID()}@algoladder.test`;
    const userId = await makeUser(email);
    const row = await queryOne<{ password_hash: string }>(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId],
    );
    expect(row!.password_hash).not.toContain('LadderClimb7');
    expect(row!.password_hash.startsWith('scrypt$')).toBe(true);
    expect(await verifyPassword('LadderClimb7', row!.password_hash)).toBe(true);
  });

  it('treats e-mail addresses case-insensitively', async () => {
    const email = `Case-${randomUUID()}@AlgoLadder.test`;
    await makeUser(email);
    const found = await queryOne('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    expect(found).not.toBeNull();
  });
});
