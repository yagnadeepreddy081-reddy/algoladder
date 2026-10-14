import { describe, it, expect } from 'vitest';

import {
  buildOrderBy,
  buildProblemQuery,
  countActiveFilters,
  parseFilters,
  serialiseFilters,
} from '@/lib/filters';

describe('parseFilters', () => {
  it('applies sensible defaults', () => {
    const f = parseFilters('');
    expect(f.sort).toBe('recommended');
    expect(f.page).toBe(1);
    expect(f.perPage).toBe(25);
    expect(f.q).toBeUndefined();
  });

  it('reads the search term', () => {
    expect(parseFilters('q=two+sum').q).toBe('two sum');
  });

  it('accepts a list as repeated keys or as one comma-separated value', () => {
    expect(parseFilters('difficulty=Easy&difficulty=Hard').difficulty).toEqual(['Easy', 'Hard']);
    expect(parseFilters('difficulty=Easy,Hard').difficulty).toEqual(['Easy', 'Hard']);
  });

  it('drops values that are not real difficulties or statuses', () => {
    expect(parseFilters('difficulty=Easy,Impossible').difficulty).toEqual(['Easy']);
    expect(parseFilters('status=solved,teleported').status).toEqual(['solved']);
  });

  it('reads the boolean flags', () => {
    expect(parseFilters('bookmarked=1').bookmarked).toBe(true);
    expect(parseFilters('revision=true').revision).toBe(true);
    expect(parseFilters('bookmarked=0').bookmarked).toBeUndefined();
  });

  it('falls back to the default sort for an unknown one', () => {
    expect(parseFilters('sort=chaos').sort).toBe('recommended');
    expect(parseFilters('sort=difficulty').sort).toBe('difficulty');
  });

  it('clamps paging', () => {
    expect(parseFilters('page=-4').page).toBe(1);
    expect(parseFilters('perPage=99999').perPage).toBe(100);
    expect(parseFilters('perPage=1').perPage).toBe(5);
  });

  it('accepts a Next.js searchParams object', () => {
    const f = parseFilters({ q: 'graph', difficulty: ['Easy', 'Medium'], topic: 'graphs' });
    expect(f.q).toBe('graph');
    expect(f.difficulty).toEqual(['Easy', 'Medium']);
    expect(f.topic).toBe('graphs');
  });

  it('only accepts free or premium for the access filter', () => {
    expect(parseFilters('premium=free').premium).toBe('free');
    expect(parseFilters('premium=maybe').premium).toBeUndefined();
  });
});

describe('serialiseFilters', () => {
  it('round-trips a full filter set', () => {
    const original = parseFilters(
      'q=tree&topic=binary-trees&difficulty=Easy,Hard&status=solved&bookmarked=1&sort=title&page=3',
    );
    const round = parseFilters(serialiseFilters(original));
    expect(round).toEqual(original);
  });

  it('omits defaults from the query string', () => {
    expect(serialiseFilters({ sort: 'recommended', page: 1, perPage: 25 })).toBe('');
  });
});

describe('countActiveFilters', () => {
  it('ignores sorting and paging', () => {
    expect(countActiveFilters(parseFilters('sort=title&page=4'))).toBe(0);
  });

  it('counts each active filter once', () => {
    expect(countActiveFilters(parseFilters('q=a&topic=arrays&difficulty=Easy,Hard&bookmarked=1'))).toBe(4);
  });
});

describe('buildProblemQuery', () => {
  it('always scopes to active problems and puts the user id first', () => {
    const q = buildProblemQuery(parseFilters(''), 'user-1');
    expect(q.where).toBe('p.is_active');
    expect(q.params[0]).toBe('user-1');
  });

  it('parameterises the search term instead of interpolating it', () => {
    const q = buildProblemQuery(parseFilters('q=%27+OR+1%3D1+--'), null);
    expect(q.where).not.toContain('OR 1=1');
    expect(q.params).toContain("%' or 1=1 --%");
  });

  it('combines several filters with AND', () => {
    const q = buildProblemQuery(
      parseFilters('q=sum&topic=arrays&difficulty=Easy&bookmarked=1&revision=1'),
      'u1',
    );
    const clauses = q.where.split(' AND ');
    expect(clauses.length).toBeGreaterThanOrEqual(5);
    expect(q.where).toContain('t.slug =');
    expect(q.where).toContain('p.difficulty = ANY');
    expect(q.where).toContain('COALESCE(pr.is_bookmarked, false)');
    expect(q.where).toContain('COALESCE(pr.in_revision, false)');
  });

  it('treats a missing progress row as not started', () => {
    const q = buildProblemQuery(parseFilters('status=not_started'), 'u1');
    expect(q.where).toContain('pr.status IS NULL');
  });

  it('ORs several statuses together', () => {
    const q = buildProblemQuery(parseFilters('status=solved,in_progress'), 'u1');
    expect(q.where).toContain('pr.status = ANY');
    expect(q.where).not.toContain('pr.status IS NULL');
  });

  it('handles not_started alongside another status', () => {
    const q = buildProblemQuery(parseFilters('status=not_started,solved'), 'u1');
    expect(q.where).toContain(' OR ');
    expect(q.where).toContain('pr.status IS NULL');
  });

  it('filters premium either way', () => {
    expect(buildProblemQuery(parseFilters('premium=premium'), null).where).toContain('p.is_premium');
    expect(buildProblemQuery(parseFilters('premium=free'), null).where).toContain('NOT p.is_premium');
  });

  it('uses array overlap for tags and companies', () => {
    const q = buildProblemQuery(parseFilters('tags=Hashing&companies=Google'), null);
    expect(q.where).toContain('p.tags &&');
    expect(q.where).toContain('p.companies &&');
    expect(q.params).toContainEqual(['Hashing']);
    expect(q.params).toContainEqual(['Google']);
  });

  it('numbers its placeholders consecutively with no gaps', () => {
    const q = buildProblemQuery(parseFilters('q=a&topic=b&difficulty=Easy&platform=LeetCode'), 'u');
    const used = [...q.where.matchAll(/\$(\d+)/g)].map((m) => Number(m[1]));
    for (const n of used) expect(n).toBeLessThanOrEqual(q.params.length);
    expect(Math.max(...used)).toBe(q.params.length);
  });
});

describe('buildOrderBy', () => {
  it('orders by recommended order by default', () => {
    expect(buildOrderBy('recommended')).toContain('p.recommended_order ASC');
  });

  it('orders difficulty Easy → Medium → Hard', () => {
    const sql = buildOrderBy('difficulty');
    expect(sql.indexOf("'Easy'")).toBeLessThan(sql.indexOf("'Medium'"));
    expect(sql).toContain('p.recommended_order ASC');
  });

  it('sorts titles case-insensitively', () => {
    expect(buildOrderBy('title')).toBe('lower(p.title) COLLATE "C" ASC, p.overall_no ASC');
  });

  it('puts never-solved problems last when sorting by recency', () => {
    expect(buildOrderBy('recently-completed')).toContain('NULLS LAST');
  });

  it('puts unstarted problems first when sorting by status', () => {
    const sql = buildOrderBy('status');
    expect(sql.indexOf("'not_started'")).toBeLessThan(sql.indexOf("'in_progress'"));
  });
});

