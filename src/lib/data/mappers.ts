import type {
  Difficulty,
  Note,
  Problem,
  ProgressStatus,
  Subtopic,
  Topic,
  UserProgress,
} from '@/lib/types';

/* eslint-disable @typescript-eslint/no-explicit-any */

const iso = (v: unknown): string | null =>
  v == null ? null : v instanceof Date ? v.toISOString() : String(v);

const dateOnly = (v: unknown): string | null => {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
};

export function mapTopic(row: any): Topic {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? '',
    icon: row.icon ?? 'circle',
    position: Number(row.position),
    isPremium: Boolean(row.is_premium),
    problemCount: Number(row.problem_count ?? 0),
  };
}

export function mapSubtopic(row: any): Subtopic {
  return {
    id: row.id,
    topicId: row.topic_id,
    topicSlug: row.topic_slug ?? '',
    slug: row.slug,
    name: row.name,
    description: row.description ?? '',
    position: Number(row.position),
    isPremium: Boolean(row.is_premium),
    problemCount: Number(row.problem_count ?? 0),
  };
}

export function mapProblem(row: any): Problem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,

    topicId: row.topic_id,
    topicSlug: row.topic_slug ?? '',
    topicName: row.topic_name ?? '',
    subtopicId: row.subtopic_id,
    subtopicSlug: row.subtopic_slug ?? '',
    subtopicName: row.subtopic_name ?? '',

    difficulty: row.difficulty as Difficulty,
    problemNoInTopic: Number(row.problem_no_in_topic),
    overallNo: Number(row.overall_no),
    recommendedOrder: Number(row.recommended_order),

    description: row.description ?? '',
    platform: row.platform ?? 'LeetCode',
    externalUrl: row.external_url,
    videoUrl: row.video_url ?? null,

    tags: row.tags ?? [],
    companies: row.companies ?? [],

    isPremium: Boolean(row.is_premium),
    isRevision: Boolean(row.is_revision),

    pattern: row.pattern ?? '',
    patternName: row.pattern_name ?? '',
    patternFamily: row.pattern_family ?? '',
    hints: row.hints ?? [],
    approach: row.approach ?? '',
    timeComplexity: row.time_complexity ?? '',
    spaceComplexity: row.space_complexity ?? '',

    ioFormat: row.io_format ?? null,
    examples: row.examples ?? [],
    constraints: row.constraints ?? [],
  };
}

export function mapProgress(row: any): UserProgress | null {
  if (!row || !row.progress_status) return null;
  return {
    problemId: row.id,
    status: row.progress_status as ProgressStatus,
    isBookmarked: Boolean(row.is_bookmarked),
    isStarred: Boolean(row.is_starred),
    inRevision: Boolean(row.in_revision),
    attempts: Number(row.attempts ?? 0),
    timeSpentSeconds: Number(row.time_spent_seconds ?? 0),
    confidence: row.confidence == null ? null : Number(row.confidence),
    solutionUrl: row.solution_url ?? null,
    customTags: row.custom_tags ?? [],
    nextReviewDate: dateOnly(row.next_review_date),
    lastAttemptedAt: iso(row.last_attempted_at),
    solvedAt: iso(row.solved_at),
  };
}

export function mapNote(row: any): Note {
  return {
    id: row.id,
    problemId: row.problem_id,
    problemTitle: row.problem_title ?? undefined,
    problemSlug: row.problem_slug ?? undefined,
    title: row.title ?? '',
    content: row.content ?? '',
    code: row.code ?? '',
    language: row.language ?? 'java',
    isPrivate: Boolean(row.is_private),
    createdAt: iso(row.created_at) ?? '',
    updatedAt: iso(row.updated_at) ?? '',
  };
}
