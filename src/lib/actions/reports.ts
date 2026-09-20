'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { execute, query } from '@/lib/db';
import { requireAdmin, requireUser } from '@/lib/auth/session';
import type { ReportStatus } from '@/lib/types';

const schema = z.object({
  problemId: z.string().min(1),
  reason: z.string().min(1).max(120),
  details: z.string().max(2000).default(''),
});

export interface ReportResult {
  ok: boolean;
  message?: string;
  error?: string;
}

export async function reportProblemAction(
  _prev: ReportResult,
  formData: FormData,
): Promise<ReportResult> {
  const user = await requireUser();
  const parsed = schema.safeParse({
    problemId: formData.get('problemId'),
    reason: formData.get('reason'),
    details: formData.get('details') ?? '',
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  await execute(
    'INSERT INTO reports (user_id, problem_id, reason, details) VALUES ($1,$2,$3,$4)',
    [user.id, parsed.data.problemId, parsed.data.reason, parsed.data.details],
  );

  revalidatePath('/admin/reports');
  return { ok: true, message: 'Thanks — that has been sent to the admin queue.' };
}

export async function listReports(status?: ReportStatus) {
  await requireAdmin();
  return query(
    `SELECT r.id, r.reason, r.details, r.status, r.created_at,
            p.title AS problem_title, p.slug AS problem_slug, p.id AS problem_id,
            u.email AS reporter_email
       FROM reports r
       LEFT JOIN problems p ON p.id = r.problem_id
       LEFT JOIN users u    ON u.id = r.user_id
      WHERE ($1::text IS NULL OR r.status::text = $1)
      ORDER BY r.created_at DESC
      LIMIT 200`,
    [status ?? null],
  );
}

export async function setReportStatusAction(
  id: string,
  status: ReportStatus,
): Promise<ReportResult> {
  const admin = await requireAdmin();
  await execute(
    `UPDATE reports
        SET status = $2::report_status,
            resolved_by = CASE WHEN $2 IN ('resolved','dismissed') THEN $3::uuid ELSE NULL END,
            resolved_at = CASE WHEN $2 IN ('resolved','dismissed') THEN now() ELSE NULL END
      WHERE id = $1`,
    [id, status, admin.id],
  );
  revalidatePath('/admin/reports');
  return { ok: true, message: `Report marked ${status.replace('_', ' ')}` };
}
