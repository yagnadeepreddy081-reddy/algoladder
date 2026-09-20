export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];

export type ProgressStatus = 'not_started' | 'in_progress' | 'solved' | 'needs_revision';
export const PROGRESS_STATUSES: ProgressStatus[] = [
  'not_started',
  'in_progress',
  'solved',
  'needs_revision',
];

export const STATUS_LABEL: Record<ProgressStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  solved: 'Solved',
  needs_revision: 'Needs revision',
};

export type PlanTier = 'free' | 'pro' | 'lifetime';
export type SubscriptionStatus = 'active' | 'trialing' | 'expired' | 'canceled';
export type UserRole = 'user' | 'admin';
export type ReportStatus = 'open' | 'in_review' | 'resolved' | 'dismissed';

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
}

export interface Topic {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  position: number;
  isPremium: boolean;
  problemCount: number;
}

export interface Subtopic {
  id: string;
  topicId: string;
  topicSlug: string;
  slug: string;
  name: string;
  description: string;
  position: number;
  isPremium: boolean;
  problemCount: number;
}

/** One test case a submission is checked against. */
export interface ProblemTestCase {
  input: string;
  expected: string;
  /** Hidden cases run, but the UI reveals only pass/fail. */
  hidden?: boolean;
}

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface Problem {
  id: string;
  slug: string;
  title: string;

  topicId: string;
  topicSlug: string;
  topicName: string;
  subtopicId: string;
  subtopicSlug: string;
  subtopicName: string;

  difficulty: Difficulty;
  problemNoInTopic: number;
  overallNo: number;
  recommendedOrder: number;

  description: string;
  platform: string;
  externalUrl: string;
  videoUrl: string | null;

  tags: string[];
  companies: string[];

  isPremium: boolean;
  isRevision: boolean;

  pattern: string;
  patternName: string;
  patternFamily: string;
  hints: string[];
  approach: string;
  timeComplexity: string;
  spaceComplexity: string;

  ioFormat: { input: string; output: string } | null;
  examples: ProblemExample[];
  constraints: string[];
  testCases: ProblemTestCase[];
}

export interface UserProgress {
  problemId: string;
  status: ProgressStatus;
  isBookmarked: boolean;
  isStarred: boolean;
  inRevision: boolean;
  attempts: number;
  timeSpentSeconds: number;
  confidence: number | null;
  solutionUrl: string | null;
  customTags: string[];
  nextReviewDate: string | null;
  lastAttemptedAt: string | null;
  solvedAt: string | null;
}

/** A problem joined with the signed-in user's progress on it. */
export type ProblemWithProgress = Problem & { progress: UserProgress | null };

export interface Note {
  id: string;
  problemId: string;
  problemTitle?: string;
  problemSlug?: string;
  title: string;
  content: string;
  code: string;
  language: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RevisionItem {
  id: string;
  problemId: string;
  dueDate: string;
  intervalDays: number;
  ease: number;
  reviewCount: number;
  lapses: number;
  lastReviewedAt: string | null;
}

export interface Subscription {
  plan: PlanTier;
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  provider: string;
}

export interface TopicProgressRow {
  topicId: string;
  topicSlug: string;
  topicName: string;
  topicPosition: number;
  total: number;
  solved: number;
  inProgress: number;
  needsRevision: number;
  easyTotal: number;
  easySolved: number;
  mediumTotal: number;
  mediumSolved: number;
  hardTotal: number;
  hardSolved: number;
}

export interface DashboardStats {
  totalProblems: number;
  solved: number;
  inProgress: number;
  needsRevision: number;
  notStarted: number;
  bookmarked: number;
  completionPercent: number;
  byDifficulty: Record<Difficulty, { total: number; solved: number }>;
  currentStreak: number;
  longestStreak: number;
  solvedThisWeek: number;
  weeklyActivity: { date: string; label: string; solved: number; events: number }[];
  dueForRevision: number;
}

export interface ActivityEntry {
  id: string;
  action: string;
  problemId: string | null;
  problemTitle: string | null;
  problemSlug: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ProblemFilters {
  q?: string;
  topic?: string;
  subtopic?: string;
  difficulty?: Difficulty[];
  status?: ProgressStatus[];
  bookmarked?: boolean;
  revision?: boolean;
  platform?: string[];
  tags?: string[];
  companies?: string[];
  premium?: 'free' | 'premium';
  sort?: SortKey;
  page?: number;
  perPage?: number;
}

export type SortKey =
  | 'recommended'
  | 'difficulty'
  | 'title'
  | 'recently-completed'
  | 'status';

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recommended', label: 'Recommended order' },
  { value: 'difficulty', label: 'Difficulty' },
  { value: 'title', label: 'Title (A–Z)' },
  { value: 'recently-completed', label: 'Recently completed' },
  { value: 'status', label: 'Completion status' },
];

export const PLATFORMS = [
  'LeetCode',
  'GeeksforGeeks',
  'CodeStudio',
  'HackerRank',
  'InterviewBit',
  'Codeforces',
] as const;

export const TOTAL_PROBLEMS = 474;
