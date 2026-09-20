'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { execute, query, queryOne, transaction } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/session';
import { validateDatasetRows, type ValidationReport } from '@/lib/validate-dataset';
import type { PlanTier } from '@/lib/types';

export interface AdminResult {
  ok: boolean;
  message?: string;
  error?: string;
  problemId?: string;
}

/* =========================================================================
   Problem CRUD
   ========================================================================= */

const problemSchema = z.object({
  id: z.string().trim().min(1).max(60),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, digits and hyphens'),
  title: z.string().trim().min(1, 'Title is required').max(200),
  topicId: z.string().trim().min(1, 'Pick a topic'),
  subtopicId: z.string().trim().min(1, 'Pick a subtopic'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  description: z.string().trim().min(1, 'Write a short description').max(2000),
  platform: z.string().trim().min(1).max(40),
  externalUrl: z.string().trim().url('Enter a valid https URL'),
  videoUrl: z.union([z.literal(''), z.string().trim().url('Enter a valid video URL')]),
  tags: z.string().default(''),
  companies: z.string().default(''),
  isPremium: z.boolean().default(false),
  isRevision: z.boolean().default(false),
  recommendedOrder: z.coerce.number().int().min(1),
  problemNoInTopic: z.coerce.number().int().min(1),
  overallNo: z.coerce.number().int().min(1),
  pattern: z.string().trim().max(60).default(''),
  patternName: z.string().trim().max(120).default(''),
  approach: z.string().trim().max(5000).default(''),
  hints: z.string().default(''),
  timeComplexity: z.string().trim().max(60).default(''),
  spaceComplexity: z.string().trim().max(60).default(''),
});

function splitList(value: string, separator = ','): string[] {
  return [...new Set(value.split(separator).map((v) => v.trim()).filter(Boolean))];
}

function readProblemForm(formData: FormData) {
  return {
    id: String(formData.get('id') ?? ''),
    slug: String(formData.get('slug') ?? ''),
    title: String(formData.get('title') ?? ''),
    topicId: String(formData.get('topicId') ?? ''),
    subtopicId: String(formData.get('subtopicId') ?? ''),
    difficulty: String(formData.get('difficulty') ?? 'Medium'),
    description: String(formData.get('description') ?? ''),
    platform: String(formData.get('platform') ?? 'LeetCode'),
    externalUrl: String(formData.get('externalUrl') ?? ''),
    videoUrl: String(formData.get('videoUrl') ?? ''),
    tags: String(formData.get('tags') ?? ''),
    companies: String(formData.get('companies') ?? ''),
    isPremium: formData.get('isPremium') === 'on',
    isRevision: formData.get('isRevision') === 'on',
    recommendedOrder: formData.get('recommendedOrder') ?? 1,
    problemNoInTopic: formData.get('problemNoInTopic') ?? 1,
    overallNo: formData.get('overallNo') ?? 1,
    pattern: String(formData.get('pattern') ?? ''),
    patternName: String(formData.get('patternName') ?? ''),
    approach: String(formData.get('approach') ?? ''),
    hints: String(formData.get('hints') ?? ''),
    timeComplexity: String(formData.get('timeComplexity') ?? ''),
    spaceComplexity: String(formData.get('spaceComplexity') ?? ''),
  };
}

export async function saveProblemAction(
  _prev: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  await requireAdmin();

  const parsed = problemSchema.safeParse(readProblemForm(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;

  // Subtopic must actually belong to the chosen topic.
  const sub = await queryOne<{ topic_id: string }>('SELECT topic_id FROM subtopics WHERE id = $1', [
    d.subtopicId,
  ]);
  if (!sub) return { ok: false, error: 'That subtopic does not exist' };
  if (sub.topic_id !== d.topicId) {
    return { ok: false, error: 'That subtopic belongs to a different topic' };
  }

  try {
    await execute(
      `INSERT INTO problems (
         id, slug, title, topic_id, subtopic_id, difficulty,
         problem_no_in_topic, overall_no, recommended_order,
         description, platform, external_url, video_url,
         tags, companies, is_premium, is_revision,
         pattern, pattern_name, hints, approach, time_complexity, space_complexity
       ) VALUES (
         $1,$2,$3,$4,$5,$6::difficulty_level,$7,$8,$9,$10,$11,$12,$13,
         $14::text[],$15::text[],$16,$17,$18,$19,$20::text[],$21,$22,$23
       )
       ON CONFLICT (id) DO UPDATE SET
         slug = EXCLUDED.slug, title = EXCLUDED.title,
         topic_id = EXCLUDED.topic_id, subtopic_id = EXCLUDED.subtopic_id,
         difficulty = EXCLUDED.difficulty,
         problem_no_in_topic = EXCLUDED.problem_no_in_topic,
         overall_no = EXCLUDED.overall_no,
         recommended_order = EXCLUDED.recommended_order,
         description = EXCLUDED.description, platform = EXCLUDED.platform,
         external_url = EXCLUDED.external_url, video_url = EXCLUDED.video_url,
         tags = EXCLUDED.tags, companies = EXCLUDED.companies,
         is_premium = EXCLUDED.is_premium, is_revision = EXCLUDED.is_revision,
         pattern = EXCLUDED.pattern, pattern_name = EXCLUDED.pattern_name,
         hints = EXCLUDED.hints, approach = EXCLUDED.approach,
         time_complexity = EXCLUDED.time_complexity,
         space_complexity = EXCLUDED.space_complexity`,
      [
        d.id, d.slug, d.title, d.topicId, d.subtopicId, d.difficulty,
        d.problemNoInTopic, d.overallNo, d.recommendedOrder,
        d.description, d.platform, d.externalUrl, d.videoUrl || null,
        splitList(d.tags), splitList(d.companies), d.isPremium, d.isRevision,
        d.pattern, d.patternName, splitList(d.hints, '\n'), d.approach,
        d.timeComplexity, d.spaceComplexity,
      ],
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('problems_title_unique')) {
      return { ok: false, error: 'Another problem already has that exact title' };
    }
    if (message.includes('problems_slug_unique')) {
      return { ok: false, error: 'Another problem already uses that slug' };
    }
    if (message.includes('problems_overall_no_unique')) {
      return { ok: false, error: `Overall number ${d.overallNo} is already taken` };
    }
    if (message.includes('problems_topic_no_unique')) {
      return { ok: false, error: `Number ${d.problemNoInTopic} is already used in that topic` };
    }
    return { ok: false, error: message };
  }

  revalidatePath('/admin/problems');
  revalidatePath(`/problems/${d.slug}`);
  revalidatePath('/problems');
  return { ok: true, message: `Saved "${d.title}"`, problemId: d.id };
}

export async function deleteProblemAction(id: string): Promise<AdminResult> {
  await requireAdmin();

  const problem = await queryOne<{ title: string }>('SELECT title FROM problems WHERE id = $1', [id]);
  if (!problem) return { ok: false, error: 'Problem not found' };

  await execute('DELETE FROM problems WHERE id = $1', [id]);

  revalidatePath('/admin/problems');
  revalidatePath('/problems');
  return {
    ok: true,
    message: `Deleted "${problem.title}". The dataset is now below 474 — re-seed or add a replacement before building.`,
  };
}

/** Move a problem up or down in the recommended order, swapping with its neighbour. */
export async function reorderProblemAction(
  id: string,
  direction: 'up' | 'down',
): Promise<AdminResult> {
  await requireAdmin();

  const current = await queryOne<{ recommended_order: number }>(
    'SELECT recommended_order FROM problems WHERE id = $1',
    [id],
  );
  if (!current) return { ok: false, error: 'Problem not found' };

  const neighbour = await queryOne<{ id: string; recommended_order: number }>(
    direction === 'up'
      ? `SELECT id, recommended_order FROM problems
          WHERE recommended_order < $1 ORDER BY recommended_order DESC LIMIT 1`
      : `SELECT id, recommended_order FROM problems
          WHERE recommended_order > $1 ORDER BY recommended_order ASC LIMIT 1`,
    [current.recommended_order],
  );
  if (!neighbour) return { ok: false, error: `Already at the ${direction === 'up' ? 'top' : 'bottom'}` };

  await transaction(async (client) => {
    // Park one row out of the way so the unique constraint is never violated
    // mid-swap. It has to stay positive, because recommended_order carries a
    // CHECK (> 0) — so use one past the current maximum rather than a sentinel
    // like -1.
    const { rows: parkRows } = await client.query<{ park: number }>(
      'SELECT COALESCE(max(recommended_order), 0) + 1 AS park FROM problems',
    );
    await client.query('UPDATE problems SET recommended_order = $2 WHERE id = $1', [
      id,
      parkRows[0].park,
    ]);
    await client.query('UPDATE problems SET recommended_order = $2 WHERE id = $1', [
      neighbour.id,
      current.recommended_order,
    ]);
    await client.query('UPDATE problems SET recommended_order = $2 WHERE id = $1', [
      id,
      neighbour.recommended_order,
    ]);
  });

  revalidatePath('/admin/problems');
  revalidatePath('/problems');
  return { ok: true, message: 'Order updated' };
}

export async function setProblemPremiumAction(id: string, isPremium: boolean): Promise<AdminResult> {
  await requireAdmin();
  await execute('UPDATE problems SET is_premium = $2 WHERE id = $1', [id, isPremium]);
  revalidatePath('/admin/problems');
  revalidatePath('/problems');
  return { ok: true, message: isPremium ? 'Marked premium' : 'Marked free' };
}

export async function setTopicPremiumAction(topicId: string, isPremium: boolean): Promise<AdminResult> {
  await requireAdmin();
  await transaction(async (client) => {
    await client.query('UPDATE topics SET is_premium = $2 WHERE id = $1', [topicId, isPremium]);
    await client.query('UPDATE subtopics SET is_premium = $2 WHERE topic_id = $1', [topicId, isPremium]);
    await client.query('UPDATE problems SET is_premium = $2 WHERE topic_id = $1', [topicId, isPremium]);
  });
  revalidatePath('/admin');
  revalidatePath('/problems');
  return { ok: true, message: `Topic marked ${isPremium ? 'premium' : 'free'}` };
}

/* =========================================================================
   Dataset validation + import/export
   ========================================================================= */

export async function runDatasetValidation(): Promise<ValidationReport> {
  await requireAdmin();

  const [problems, topics, subtopics] = await Promise.all([
    query<Record<string, unknown>>(
      `SELECT p.*, t.slug AS topic_slug, s.slug AS subtopic_slug
         FROM problems p
         JOIN topics t    ON t.id = p.topic_id
         JOIN subtopics s ON s.id = p.subtopic_id
        WHERE p.is_active`,
    ),
    query<Record<string, unknown>>('SELECT * FROM topics'),
    query<Record<string, unknown>>('SELECT * FROM subtopics'),
  ]);

  return validateDatasetRows(
    problems.map((p) => ({
      id: String(p.id),
      slug: String(p.slug),
      title: String(p.title),
      topicId: String(p.topic_id),
      topicSlug: String(p.topic_slug),
      subtopicId: String(p.subtopic_id),
      difficulty: String(p.difficulty),
      description: String(p.description ?? ''),
      externalUrl: String(p.external_url ?? ''),
      platform: String(p.platform ?? ''),
      overallNo: Number(p.overall_no),
      problemNoInTopic: Number(p.problem_no_in_topic),
      isPremium: Boolean(p.is_premium),
    })),
    topics.map((t) => ({ id: String(t.id), slug: String(t.slug), name: String(t.name) })),
    subtopics.map((s) => ({ id: String(s.id), topicId: String(s.topic_id) })),
  );
}

const importRow = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  topicId: z.string().min(1),
  subtopicId: z.string().min(1),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  description: z.string().default(''),
  platform: z.string().default('LeetCode'),
  externalUrl: z.string().url(),
  videoUrl: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  companies: z.array(z.string()).default([]),
  isPremium: z.boolean().default(false),
  isRevision: z.boolean().default(false),
  overallNo: z.number().int().min(1),
  problemNoInTopic: z.number().int().min(1),
  recommendedOrder: z.number().int().min(1),
  pattern: z.string().default(''),
  patternName: z.string().default(''),
  patternFamily: z.string().default(''),
  hints: z.array(z.string()).default([]),
  approach: z.string().default(''),
  timeComplexity: z.string().default(''),
  spaceComplexity: z.string().default(''),
});

export interface ImportResult extends AdminResult {
  imported?: number;
  skipped?: number;
  issues?: string[];
}

/** Import problems from a JSON array (the shape data/problems.json uses). */
export async function importProblemsAction(
  _prev: ImportResult,
  formData: FormData,
): Promise<ImportResult> {
  await requireAdmin();

  const raw = String(formData.get('payload') ?? '').trim();
  const replace = formData.get('replace') === 'on';
  if (!raw) return { ok: false, error: 'Paste some JSON, or upload a file.' };

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch (err) {
    return { ok: false, error: `That is not valid JSON: ${(err as Error).message}` };
  }
  if (!Array.isArray(parsedJson)) {
    return { ok: false, error: 'The JSON must be an array of problem objects.' };
  }

  const issues: string[] = [];
  const rows: z.infer<typeof importRow>[] = [];

  parsedJson.forEach((item, i) => {
    const res = importRow.safeParse(item);
    if (res.success) rows.push(res.data);
    else issues.push(`Row ${i + 1}: ${res.error.issues[0].path.join('.')} — ${res.error.issues[0].message}`);
  });

  if (rows.length === 0) {
    return { ok: false, error: 'No valid rows in that payload.', issues: issues.slice(0, 20) };
  }

  let imported = 0;
  try {
    await transaction(async (client) => {
      if (replace) {
        await client.query('DELETE FROM problems');
      }
      for (const r of rows) {
        await client.query(
          `INSERT INTO problems (
             id, slug, title, topic_id, subtopic_id, difficulty,
             problem_no_in_topic, overall_no, recommended_order,
             description, platform, external_url, video_url,
             tags, companies, is_premium, is_revision,
             pattern, pattern_name, pattern_family, hints, approach,
             time_complexity, space_complexity
           ) VALUES (
             $1,$2,$3,$4,$5,$6::difficulty_level,$7,$8,$9,$10,$11,$12,$13,
             $14::text[],$15::text[],$16,$17,$18,$19,$20,$21::text[],$22,$23,$24
           )
           ON CONFLICT (id) DO UPDATE SET
             slug = EXCLUDED.slug, title = EXCLUDED.title,
             topic_id = EXCLUDED.topic_id, subtopic_id = EXCLUDED.subtopic_id,
             difficulty = EXCLUDED.difficulty,
             problem_no_in_topic = EXCLUDED.problem_no_in_topic,
             overall_no = EXCLUDED.overall_no,
             recommended_order = EXCLUDED.recommended_order,
             description = EXCLUDED.description, platform = EXCLUDED.platform,
             external_url = EXCLUDED.external_url, video_url = EXCLUDED.video_url,
             tags = EXCLUDED.tags, companies = EXCLUDED.companies,
             is_premium = EXCLUDED.is_premium, is_revision = EXCLUDED.is_revision,
             pattern = EXCLUDED.pattern, pattern_name = EXCLUDED.pattern_name,
             pattern_family = EXCLUDED.pattern_family,
             hints = EXCLUDED.hints, approach = EXCLUDED.approach,
             time_complexity = EXCLUDED.time_complexity,
             space_complexity = EXCLUDED.space_complexity`,
          [
            r.id, r.slug, r.title, r.topicId, r.subtopicId, r.difficulty,
            r.problemNoInTopic, r.overallNo, r.recommendedOrder,
            r.description, r.platform, r.externalUrl, r.videoUrl ?? null,
            r.tags, r.companies, r.isPremium, r.isRevision,
            r.pattern, r.patternName, r.patternFamily, r.hints, r.approach,
            r.timeComplexity, r.spaceComplexity,
          ],
        );
        imported += 1;
      }
    });
  } catch (err) {
    return {
      ok: false,
      error: `Import rolled back: ${err instanceof Error ? err.message : String(err)}`,
      issues: issues.slice(0, 20),
    };
  }

  revalidatePath('/admin');
  revalidatePath('/problems');

  return {
    ok: true,
    imported,
    skipped: issues.length,
    issues: issues.slice(0, 20),
    message: `Imported ${imported} problems${issues.length ? `, skipped ${issues.length} invalid rows` : ''}.`,
  };
}

/* =========================================================================
   Users & subscriptions
   ========================================================================= */

export interface AdminUserRow {
  id: string;
  email: string;
  role: string;
  displayName: string;
  createdAt: string;
  lastLoginAt: string | null;
  plan: string;
  status: string;
  solved: number;
  notes: number;
}

export async function listUsers(search = ''): Promise<AdminUserRow[]> {
  await requireAdmin();
  const rows = await query<Record<string, unknown>>(
    `SELECT u.id, u.email, u.role, u.created_at, u.last_login_at,
            COALESCE(pf.display_name, '') AS display_name,
            COALESCE(s.plan::text, 'free')   AS plan,
            COALESCE(s.status::text, 'active') AS status,
            (SELECT count(*) FROM user_problem_progress pr
              WHERE pr.user_id = u.id AND pr.status = 'solved')::int AS solved,
            (SELECT count(*) FROM notes n WHERE n.user_id = u.id)::int AS notes
       FROM users u
       LEFT JOIN profiles pf     ON pf.user_id = u.id
       LEFT JOIN subscriptions s ON s.user_id = u.id
      WHERE ($1 = '' OR u.email ILIKE '%' || $1 || '%' OR COALESCE(pf.display_name,'') ILIKE '%' || $1 || '%')
      ORDER BY u.created_at DESC
      LIMIT 200`,
    [search],
  );

  const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v == null ? null : String(v));

  return rows.map((r) => ({
    id: String(r.id),
    email: String(r.email),
    role: String(r.role),
    displayName: String(r.display_name),
    createdAt: iso(r.created_at) ?? '',
    lastLoginAt: iso(r.last_login_at),
    plan: String(r.plan),
    status: String(r.status),
    solved: Number(r.solved),
    notes: Number(r.notes),
  }));
}

export async function setUserPlanAction(
  userId: string,
  plan: PlanTier,
  days = 30,
): Promise<AdminResult> {
  const admin = await requireAdmin();
  if (!['free', 'pro', 'lifetime'].includes(plan)) return { ok: false, error: 'Unknown plan' };

  if (plan === 'free') {
    await execute(
      `INSERT INTO subscriptions (user_id, plan, status, provider, granted_by)
       VALUES ($1,'free','active','admin',$2)
       ON CONFLICT (user_id) DO UPDATE SET plan='free', status='active',
         current_period_end = NULL, granted_by = $2`,
      [userId, admin.id],
    );
  } else {
    await execute(
      `INSERT INTO subscriptions (user_id, plan, status, current_period_end, provider, granted_by)
       VALUES ($1,$2::plan_tier,'active',
               CASE WHEN $2 = 'lifetime' THEN NULL ELSE now() + ($3 || ' days')::interval END,
               'admin', $4)
       ON CONFLICT (user_id) DO UPDATE SET
         plan = EXCLUDED.plan, status = 'active',
         current_period_end = EXCLUDED.current_period_end,
         provider = 'admin', granted_by = $4`,
      [userId, plan, String(days), admin.id],
    );
  }

  revalidatePath('/admin/users');
  return { ok: true, message: `Plan set to ${plan}` };
}

export async function setUserRoleAction(userId: string, role: 'user' | 'admin'): Promise<AdminResult> {
  const admin = await requireAdmin();
  if (userId === admin.id && role === 'user') {
    return { ok: false, error: 'You cannot remove your own admin access — ask another admin.' };
  }

  await transaction(async (client) => {
    await client.query('UPDATE users SET role = $2 WHERE id = $1', [userId, role]);
    if (role === 'admin') {
      await client.query(
        `INSERT INTO admin_users (user_id, granted_by, note) VALUES ($1,$2,'Granted from the admin panel')
         ON CONFLICT (user_id) DO NOTHING`,
        [userId, admin.id],
      );
    } else {
      await client.query('DELETE FROM admin_users WHERE user_id = $1', [userId]);
    }
  });

  revalidatePath('/admin/users');
  return { ok: true, message: `Role set to ${role}` };
}

/* =========================================================================
   Overview stats
   ========================================================================= */

export interface AdminStats {
  problems: number;
  activeProblems: number;
  premiumProblems: number;
  topics: number;
  subtopics: number;
  users: number;
  admins: number;
  paidUsers: number;
  totalSolves: number;
  notes: number;
  openReports: number;
  newUsersThisWeek: number;
  activeUsersThisWeek: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  await requireAdmin();
  const row = await queryOne<Record<string, unknown>>(`
    SELECT
      (SELECT count(*) FROM problems)::int                                          AS problems,
      (SELECT count(*) FROM problems WHERE is_active)::int                          AS active_problems,
      (SELECT count(*) FROM problems WHERE is_premium)::int                         AS premium_problems,
      (SELECT count(*) FROM topics)::int                                            AS topics,
      (SELECT count(*) FROM subtopics)::int                                         AS subtopics,
      (SELECT count(*) FROM users)::int                                             AS users,
      (SELECT count(*) FROM users WHERE role = 'admin')::int                        AS admins,
      (SELECT count(*) FROM subscriptions
        WHERE plan <> 'free' AND status IN ('active','trialing'))::int              AS paid_users,
      (SELECT count(*) FROM user_problem_progress WHERE status = 'solved')::int     AS total_solves,
      (SELECT count(*) FROM notes)::int                                             AS notes,
      (SELECT count(*) FROM reports WHERE status = 'open')::int                     AS open_reports,
      (SELECT count(*) FROM users WHERE created_at > now() - interval '7 days')::int AS new_users_week,
      (SELECT count(DISTINCT user_id) FROM activity_logs
        WHERE created_at > now() - interval '7 days')::int                          AS active_users_week
  `);

  return {
    problems: Number(row?.problems ?? 0),
    activeProblems: Number(row?.active_problems ?? 0),
    premiumProblems: Number(row?.premium_problems ?? 0),
    topics: Number(row?.topics ?? 0),
    subtopics: Number(row?.subtopics ?? 0),
    users: Number(row?.users ?? 0),
    admins: Number(row?.admins ?? 0),
    paidUsers: Number(row?.paid_users ?? 0),
    totalSolves: Number(row?.total_solves ?? 0),
    notes: Number(row?.notes ?? 0),
    openReports: Number(row?.open_reports ?? 0),
    newUsersThisWeek: Number(row?.new_users_week ?? 0),
    activeUsersThisWeek: Number(row?.active_users_week ?? 0),
  };
}

export async function listTopicsForAdmin() {
  await requireAdmin();
  return query<Record<string, unknown>>(
    `SELECT t.id, t.slug, t.name, t.position, t.is_premium,
            count(p.id)::int AS problem_count
       FROM topics t LEFT JOIN problems p ON p.topic_id = t.id
      GROUP BY t.id ORDER BY t.position`,
  );
}

export async function listSubtopicsForAdmin() {
  await requireAdmin();
  return query<{ id: string; topic_id: string; name: string }>(
    `SELECT s.id, s.topic_id, s.name FROM subtopics s
       JOIN topics t ON t.id = s.topic_id
      ORDER BY t.position, s.position`,
  );
}
