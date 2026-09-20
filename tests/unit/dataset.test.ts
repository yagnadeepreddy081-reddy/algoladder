import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { validateDatasetRows, EXPECTED_TOTAL } from '@/lib/validate-dataset';

const DATA = resolve(process.cwd(), 'data');
const read = (f: string) => JSON.parse(readFileSync(resolve(DATA, f), 'utf8'));

const problems = read('problems.json') as Array<Record<string, never>>;
const topics = read('topics.json') as Array<Record<string, never>>;
const subtopics = read('subtopics.json') as Array<Record<string, never>>;

type P = {
  id: string;
  slug: string;
  title: string;
  topicId: string;
  topicSlug: string;
  subtopicId: string;
  difficulty: string;
  description: string;
  externalUrl: string;
  platform: string;
  overallNo: number;
  problemNoInTopic: number;
  recommendedOrder: number;
  isPremium: boolean;
  isRevision: boolean;
  tags: string[];
  companies: string[];
  hints: string[];
  approach: string;
  timeComplexity: string;
  spaceComplexity: string;
  videoUrl: string | null;
};

const rows = problems as unknown as P[];

describe('the 474-problem dataset', () => {
  it('contains exactly 474 problems', () => {
    expect(rows).toHaveLength(EXPECTED_TOTAL);
    expect(rows).toHaveLength(474);
  });

  it('has no duplicate IDs', () => {
    const ids = rows.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has no duplicate titles, ignoring case and spacing', () => {
    const keys = rows.map((p) => p.title.trim().toLowerCase().replace(/\s+/g, ' '));
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    rows.forEach((p, i) => {
      if (seen.has(keys[i])) dupes.push(`${p.title} <-> ${seen.get(keys[i])}`);
      else seen.set(keys[i], p.title);
    });
    expect(dupes).toEqual([]);
  });

  it('has no duplicate slugs or external URLs', () => {
    expect(new Set(rows.map((p) => p.slug)).size).toBe(rows.length);
    expect(new Set(rows.map((p) => p.externalUrl)).size).toBe(rows.length);
  });

  it('gives every problem a non-empty title and description', () => {
    for (const p of rows) {
      expect(p.title.trim().length, `${p.id} title`).toBeGreaterThan(0);
      expect(p.description.trim().length, `${p.id} description`).toBeGreaterThan(10);
    }
  });

  it('uses no placeholder titles', () => {
    const placeholder = /^(problem\s*\d+|coming soon|tbd|todo|untitled|lorem|test)\b/i;
    const offenders = rows.filter((p) => placeholder.test(p.title));
    expect(offenders.map((p) => p.title)).toEqual([]);
  });

  it('gives every problem a topic and a subtopic that exist and agree', () => {
    const topicIds = new Set((topics as unknown as { id: string }[]).map((t) => t.id));
    const subById = new Map(
      (subtopics as unknown as { id: string; topicId: string }[]).map((s) => [s.id, s]),
    );
    for (const p of rows) {
      expect(topicIds.has(p.topicId), `${p.id} topic`).toBe(true);
      const sub = subById.get(p.subtopicId);
      expect(sub, `${p.id} subtopic`).toBeDefined();
      expect(sub!.topicId, `${p.id} subtopic belongs to its topic`).toBe(p.topicId);
    }
  });

  it('gives every problem a valid difficulty', () => {
    for (const p of rows) {
      expect(['Easy', 'Medium', 'Hard']).toContain(p.difficulty);
    }
  });

  it('gives every problem a valid https external URL', () => {
    for (const p of rows) {
      const url = new URL(p.externalUrl);
      expect(url.protocol, `${p.id}`).toBe('https:');
      expect(url.hostname).toMatch(/\./);
    }
  });

  it('numbers problems continuously from 1 to 474 overall', () => {
    const sorted = rows.map((p) => p.overallNo).sort((a, b) => a - b);
    expect(sorted[0]).toBe(1);
    expect(sorted[sorted.length - 1]).toBe(474);
    sorted.forEach((n, i) => expect(n).toBe(i + 1));
  });

  it('numbers problems continuously from 1 to n within each topic', () => {
    const byTopic = new Map<string, number[]>();
    for (const p of rows) {
      if (!byTopic.has(p.topicSlug)) byTopic.set(p.topicSlug, []);
      byTopic.get(p.topicSlug)!.push(p.problemNoInTopic);
    }
    for (const [slug, nums] of byTopic) {
      const sorted = [...nums].sort((a, b) => a - b);
      sorted.forEach((n, i) => expect(n, `${slug} position ${i}`).toBe(i + 1));
    }
  });

  it('adds the topic totals up to exactly 474', () => {
    const declared = (topics as unknown as { slug: string; problemCount: number }[]).reduce(
      (sum, t) => sum + t.problemCount,
      0,
    );
    expect(declared).toBe(474);

    const actual = new Map<string, number>();
    for (const p of rows) actual.set(p.topicSlug, (actual.get(p.topicSlug) ?? 0) + 1);
    for (const t of topics as unknown as { slug: string; problemCount: number }[]) {
      expect(actual.get(t.slug), t.slug).toBe(t.problemCount);
    }
    expect([...actual.values()].reduce((a, b) => a + b, 0)).toBe(474);
  });

  it('has exactly 19 topics, each with at least one subtopic', () => {
    expect(topics).toHaveLength(19);
    for (const t of topics as unknown as { id: string; name: string }[]) {
      const subs = (subtopics as unknown as { topicId: string }[]).filter(
        (s) => s.topicId === t.id,
      );
      expect(subs.length, t.name).toBeGreaterThan(0);
    }
  });

  it('gives every problem hints, an approach and complexity notes', () => {
    for (const p of rows) {
      expect(p.hints.length, `${p.id} hints`).toBeGreaterThanOrEqual(3);
      expect(p.approach.length, `${p.id} approach`).toBeGreaterThan(50);
      expect(p.timeComplexity, `${p.id} time`).toMatch(/O\(/);
      expect(p.spaceComplexity, `${p.id} space`).toMatch(/O\(/);
    }
  });

  it('gives every problem at least one tag', () => {
    for (const p of rows) expect(p.tags.length, p.id).toBeGreaterThan(0);
  });

  it('only links to platforms we recognise', () => {
    const allowed = ['LeetCode', 'GeeksforGeeks', 'CodeStudio', 'HackerRank', 'InterviewBit', 'Codeforces'];
    for (const p of rows) expect(allowed, p.id).toContain(p.platform);
  });

  it('passes the shared validator with no errors', () => {
    const report = validateDatasetRows(
      rows,
      topics as unknown as { id: string; slug: string; name: string }[],
      subtopics as unknown as { id: string; topicId: string }[],
    );
    expect(report.errors).toEqual([]);
    expect(report.passed).toBe(true);
    expect(report.total).toBe(474);
  });

  it('covers a sensible spread of difficulties', () => {
    const counts = { Easy: 0, Medium: 0, Hard: 0 } as Record<string, number>;
    for (const p of rows) counts[p.difficulty] += 1;
    expect(counts.Easy).toBeGreaterThan(50);
    expect(counts.Medium).toBeGreaterThan(150);
    expect(counts.Hard).toBeGreaterThan(40);
    expect(counts.Easy + counts.Medium + counts.Hard).toBe(474);
  });
});

describe('the validator itself', () => {
  const topicList = [{ id: 't1', slug: 'a', name: 'A' }];
  const subList = [{ id: 's1', topicId: 't1' }];
  const base = {
    id: 'p1',
    slug: 'p1',
    title: 'P1',
    topicId: 't1',
    topicSlug: 'a',
    subtopicId: 's1',
    difficulty: 'Easy',
    description: 'Something original.',
    externalUrl: 'https://example.com/p1',
    platform: 'LeetCode',
    overallNo: 1,
    problemNoInTopic: 1,
    isPremium: false,
  };

  it('fails when the count is not 474', () => {
    const report = validateDatasetRows([base], topicList, subList);
    expect(report.passed).toBe(false);
    expect(report.errors.join(' ')).toMatch(/expected exactly 474/);
  });

  it('detects duplicate titles', () => {
    const report = validateDatasetRows(
      [base, { ...base, id: 'p2', slug: 'p2', overallNo: 2 }],
      topicList,
      subList,
    );
    expect(report.duplicateTitles).toContain('P1');
  });

  it('detects an invalid URL', () => {
    const report = validateDatasetRows([{ ...base, externalUrl: 'not a url' }], topicList, subList);
    expect(report.invalidUrls.length).toBe(1);
  });

  it('detects a subtopic that belongs to another topic', () => {
    const report = validateDatasetRows(
      [base],
      [...topicList, { id: 't2', slug: 'b', name: 'B' }],
      [{ id: 's1', topicId: 't2' }],
    );
    expect(report.missingMappings.length).toBe(1);
  });
});
