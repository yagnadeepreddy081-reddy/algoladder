'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { execute, query, queryOne, transaction } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { getSubscription } from '@/lib/actions/subscription';
import { canAccessFeature } from '@/lib/premium';
import { addDaysISO } from '@/lib/spaced-repetition';
import { mapProblem } from '@/lib/data/mappers';
import type { Problem } from '@/lib/types';

export interface PlanResult {
  ok: boolean;
  message?: string;
  error?: string;
  planId?: string;
}

export interface StudyPlan {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string | null;
  problemsPerDay: number;
  topicIds: string[];
  difficulties: string[];
  isActive: boolean;
  totalItems: number;
  completedItems: number;
}

const createSchema = z.object({
  name: z.string().trim().min(1, 'Give the plan a name').max(80),
  description: z.string().trim().max(400).default(''),
  problemsPerDay: z.coerce.number().int().min(1).max(20),
  days: z.coerce.number().int().min(1).max(365),
  topicIds: z.array(z.string()).default([]),
  difficulties: z.array(z.string()).default([]),
  includeSolved: z.boolean().default(false),
});

export async function createStudyPlanAction(
  _prev: PlanResult,
  formData: FormData,
): Promise<PlanResult> {
  const user = await requireUser();
  const subscription = await getSubscription(user.id);
  if (!canAccessFeature(subscription, user.role)) {
    return { ok: false, error: 'Custom study plans are a Pro feature.' };
  }

  const parsed = createSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') ?? '',
    problemsPerDay: formData.get('problemsPerDay'),
    days: formData.get('days'),
    topicIds: formData.getAll('topicIds').map(String).filter(Boolean),
    difficulties: formData.getAll('difficulties').map(String).filter(Boolean),
    includeSolved: formData.get('includeSolved') === 'on',
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const d = parsed.data;
  const capacity = d.problemsPerDay * d.days;

  // Pick the pool: the user's unsolved problems, in recommended order, inside
  // whatever topic and difficulty filters they chose.
  const pool = await query<Record<string, unknown>>(
    `SELECT p.id
       FROM problems p
       LEFT JOIN user_problem_progress pr ON pr.problem_id = p.id AND pr.user_id = $1
      WHERE p.is_active
        AND (cardinality($2::text[]) = 0 OR p.topic_id = ANY($2::text[]))
        AND (cardinality($3::text[]) = 0 OR p.difficulty::text = ANY($3::text[]))
        AND ($4::boolean OR pr.status IS DISTINCT FROM 'solved')
      ORDER BY p.recommended_order ASC
      LIMIT $5`,
    [user.id, d.topicIds, d.difficulties, d.includeSolved, capacity],
  );

  if (pool.length === 0) {
    return {
      ok: false,
      error: 'Nothing matches those filters — you may have solved everything in that selection.',
    };
  }

  const planId = await transaction(async (client) => {
    // Only one active plan at a time keeps the dashboard honest.
    await client.query('UPDATE study_plans SET is_active = false WHERE user_id = $1', [user.id]);

    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO study_plans
         (user_id, name, description, start_date, end_date, problems_per_day, topic_ids, difficulties)
       VALUES ($1,$2,$3,CURRENT_DATE,$4::date,$5,$6::text[],$7::text[])
       RETURNING id`,
      [
        user.id,
        d.name,
        d.description,
        addDaysISO(d.days - 1),
        d.problemsPerDay,
        d.topicIds,
        d.difficulties,
      ],
    );
    const id = rows[0].id;

    for (let i = 0; i < pool.length; i += 1) {
      const dayOffset = Math.floor(i / d.problemsPerDay);
      await client.query(
        `INSERT INTO study_plan_items (plan_id, problem_id, scheduled_date, position)
         VALUES ($1,$2,$3::date,$4)
         ON CONFLICT (plan_id, problem_id) DO NOTHING`,
        [id, pool[i].id, addDaysISO(dayOffset), i % d.problemsPerDay],
      );
    }

    await client.query(
      `INSERT INTO activity_logs (user_id, action, metadata) VALUES ($1,'plan_created',$2::jsonb)`,
      [user.id, JSON.stringify({ name: d.name, problems: pool.length, days: d.days })],
    );

    return id;
  });

  revalidatePath('/study-plan');
  return {
    ok: true,
    planId,
    message: `Plan created with ${pool.length} problems across ${d.days} days.`,
  };
}

export async function deleteStudyPlanAction(planId: string): Promise<PlanResult> {
  const user = await requireUser();
  const deleted = await execute('DELETE FROM study_plans WHERE id = $1 AND user_id = $2', [
    planId,
    user.id,
  ]);
  revalidatePath('/study-plan');
  return deleted ? { ok: true, message: 'Plan deleted' } : { ok: false, error: 'Plan not found' };
}

export async function getActivePlan(userId: string): Promise<StudyPlan | null> {
  const row = await queryOne<Record<string, unknown>>(
    `SELECT sp.*,
            (SELECT count(*) FROM study_plan_items WHERE plan_id = sp.id)::int AS total_items,
            (SELECT count(*) FROM study_plan_items spi
               JOIN user_problem_progress pr
                 ON pr.problem_id = spi.problem_id AND pr.user_id = sp.user_id
              WHERE spi.plan_id = sp.id AND pr.status = 'solved')::int AS completed_items
       FROM study_plans sp
      WHERE sp.user_id = $1 AND sp.is_active
      ORDER BY sp.created_at DESC LIMIT 1`,
    [userId],
  );
  if (!row) return null;

  const iso = (v: unknown) =>
    v == null ? null : v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10);

  return {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description ?? ''),
    startDate: iso(row.start_date) ?? '',
    endDate: iso(row.end_date),
    problemsPerDay: Number(row.problems_per_day),
    topicIds: (row.topic_ids as string[]) ?? [],
    difficulties: (row.difficulties as string[]) ?? [],
    isActive: Boolean(row.is_active),
    totalItems: Number(row.total_items ?? 0),
    completedItems: Number(row.completed_items ?? 0),
  };
}

export interface PlanDay {
  date: string;
  problems: Array<Problem & { solved: boolean }>;
}

export async function getPlanSchedule(planId: string, userId: string): Promise<PlanDay[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT p.*, t.slug AS topic_slug, t.name AS topic_name,
            s.slug AS subtopic_slug, s.name AS subtopic_name,
            spi.scheduled_date::text AS scheduled_date,
            (pr.status = 'solved') AS solved
       FROM study_plan_items spi
       JOIN study_plans sp ON sp.id = spi.plan_id AND sp.user_id = $2
       JOIN problems p     ON p.id = spi.problem_id
       JOIN topics t       ON t.id = p.topic_id
       JOIN subtopics s    ON s.id = p.subtopic_id
       LEFT JOIN user_problem_progress pr ON pr.problem_id = p.id AND pr.user_id = $2
      WHERE spi.plan_id = $1
      ORDER BY spi.scheduled_date ASC, spi.position ASC`,
    [planId, userId],
  );

  const byDate = new Map<string, PlanDay>();
  for (const r of rows) {
    const date = String(r.scheduled_date);
    if (!byDate.has(date)) byDate.set(date, { date, problems: [] });
    byDate.get(date)!.problems.push({ ...mapProblem(r), solved: Boolean(r.solved) });
  }
  return [...byDate.values()];
}
