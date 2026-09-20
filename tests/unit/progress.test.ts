import { describe, it, expect } from 'vitest';

import {
  computeStreaks,
  formatDuration,
  nextProblem,
  percentOf,
  precisePercentOf,
  summarise,
  weeklyActivity,
} from '@/lib/progress';
import type { ProblemWithProgress, ProgressStatus, Difficulty } from '@/lib/types';

function problem(
  n: number,
  difficulty: Difficulty,
  status: ProgressStatus | null,
  extra: Partial<ProblemWithProgress['progress']> = {},
): ProblemWithProgress {
  return {
    id: `al-${n}`,
    slug: `p-${n}`,
    title: `Problem ${n}`,
    topicId: 't1',
    topicSlug: 'arrays',
    topicName: 'Arrays',
    subtopicId: 's1',
    subtopicSlug: 'easy',
    subtopicName: 'Easy',
    difficulty,
    problemNoInTopic: n,
    overallNo: n,
    recommendedOrder: n,
    description: 'x',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/x/',
    videoUrl: null,
    tags: [],
    companies: [],
    isPremium: false,
    isRevision: false,
    pattern: 'hashing',
    patternName: 'Hashing',
    patternFamily: 'Foundations',
    hints: [],
    approach: '',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    ioFormat: null,
    examples: [],
    constraints: [],
    progress: status
      ? {
          problemId: `al-${n}`,
          status,
          isBookmarked: false,
          isStarred: false,
          inRevision: false,
          attempts: 0,
          timeSpentSeconds: 0,
          confidence: null,
          solutionUrl: null,
          customTags: [],
          nextReviewDate: null,
          lastAttemptedAt: null,
          solvedAt: null,
          ...extra,
        }
      : null,
  };
}

describe('percentOf', () => {
  it('rounds to the nearest whole percent', () => {
    expect(percentOf(1, 3)).toBe(33);
    expect(percentOf(2, 3)).toBe(67);
    expect(percentOf(474, 474)).toBe(100);
  });

  it('returns 0 rather than NaN for an empty set', () => {
    expect(percentOf(0, 0)).toBe(0);
    expect(percentOf(5, 0)).toBe(0);
    expect(percentOf(0, -1)).toBe(0);
  });

  it('keeps one decimal in the precise variant', () => {
    expect(precisePercentOf(1, 3)).toBe(33.3);
    expect(precisePercentOf(37, 474)).toBe(7.8);
  });
});

describe('summarise', () => {
  const problems = [
    problem(1, 'Easy', 'solved'),
    problem(2, 'Easy', 'solved'),
    problem(3, 'Medium', 'in_progress'),
    problem(4, 'Medium', 'needs_revision'),
    problem(5, 'Hard', null),
    problem(6, 'Hard', 'not_started', { isBookmarked: true }),
  ];

  it('counts each status exactly once', () => {
    const s = summarise(problems);
    expect(s.total).toBe(6);
    expect(s.solved).toBe(2);
    expect(s.inProgress).toBe(1);
    expect(s.needsRevision).toBe(1);
    expect(s.notStarted).toBe(2);
    expect(s.solved + s.inProgress + s.needsRevision + s.notStarted).toBe(s.total);
  });

  it('computes the completion percentage from solved only', () => {
    expect(summarise(problems).percent).toBe(33);
  });

  it('breaks the counts down by difficulty', () => {
    const s = summarise(problems);
    expect(s.byDifficulty.Easy).toMatchObject({ total: 2, solved: 2 });
    expect(s.byDifficulty.Medium).toMatchObject({ total: 2, solved: 0, inProgress: 1, needsRevision: 1 });
    expect(s.byDifficulty.Hard).toMatchObject({ total: 2, solved: 0, notStarted: 2 });
  });

  it('counts bookmarks', () => {
    expect(summarise(problems).bookmarked).toBe(1);
  });

  it('handles an empty list', () => {
    const s = summarise([]);
    expect(s.total).toBe(0);
    expect(s.percent).toBe(0);
  });
});

describe('nextProblem', () => {
  it('prefers something already in progress', () => {
    const list = [problem(1, 'Easy', null), problem(2, 'Easy', 'in_progress')];
    expect(nextProblem(list)?.id).toBe('al-2');
  });

  it('otherwise takes the first unstarted in recommended order', () => {
    const list = [problem(3, 'Easy', null), problem(1, 'Easy', 'solved'), problem(2, 'Easy', null)];
    expect(nextProblem(list)?.id).toBe('al-2');
  });

  it('falls back to a revision problem when nothing is unstarted', () => {
    const list = [problem(1, 'Easy', 'solved'), problem(2, 'Easy', 'needs_revision')];
    expect(nextProblem(list)?.id).toBe('al-2');
  });

  it('returns null when everything is solved', () => {
    expect(nextProblem([problem(1, 'Easy', 'solved')])).toBeNull();
  });
});

describe('computeStreaks', () => {
  const today = '2026-09-20';

  it('returns zero for no activity', () => {
    expect(computeStreaks([], today)).toEqual({ current: 0, longest: 0 });
  });

  it('counts a run ending today', () => {
    const days = ['2026-09-18', '2026-09-19', '2026-09-20'];
    expect(computeStreaks(days, today)).toEqual({ current: 3, longest: 3 });
  });

  it('keeps the streak alive when today has not happened yet', () => {
    const days = ['2026-09-18', '2026-09-19'];
    expect(computeStreaks(days, today).current).toBe(2);
  });

  it('breaks the streak after a missed day', () => {
    const days = ['2026-09-16', '2026-09-17'];
    expect(computeStreaks(days, today).current).toBe(0);
    expect(computeStreaks(days, today).longest).toBe(2);
  });

  it('remembers the longest run even when the current one is shorter', () => {
    const days = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-20'];
    expect(computeStreaks(days, today)).toEqual({ current: 1, longest: 4 });
  });

  it('is not fooled by duplicate days', () => {
    const days = ['2026-09-20', '2026-09-20', '2026-09-19'];
    expect(computeStreaks(days, today).current).toBe(2);
  });

  it('accepts Date objects and ISO timestamps alike', () => {
    const days = [new Date('2026-09-20T10:00:00Z'), '2026-09-19T23:00:00.000Z'];
    expect(computeStreaks(days, today).current).toBe(2);
  });
});

describe('weeklyActivity', () => {
  it('returns seven days, oldest first, zero-filling the gaps', () => {
    const out = weeklyActivity([{ date: '2026-09-20', solved: 3, events: 5 }], 7, '2026-09-20');
    expect(out).toHaveLength(7);
    expect(out[0].date).toBe('2026-09-14');
    expect(out[6].date).toBe('2026-09-20');
    expect(out[6].solved).toBe(3);
    expect(out[0].solved).toBe(0);
  });

  it('labels each day', () => {
    const out = weeklyActivity([], 7, '2026-09-20');
    expect(out.every((d) => d.label.length === 3)).toBe(true);
  });
});

describe('formatDuration', () => {
  it('formats sensibly', () => {
    expect(formatDuration(0)).toBe('0m');
    expect(formatDuration(90)).toBe('2m');
    expect(formatDuration(3600)).toBe('1h');
    expect(formatDuration(5400)).toBe('1h 30m');
  });
});
