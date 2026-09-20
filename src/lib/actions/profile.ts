'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { execute, queryOne } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';

export interface ProfileResult {
  ok: boolean;
  message?: string;
  error?: string;
}

export interface Profile {
  displayName: string;
  bio: string;
  targetRole: string;
  targetDate: string | null;
  dailyGoal: number;
  preferredLanguage: string;
  timezone: string;
}

const schema = z.object({
  displayName: z.string().trim().min(1, 'Your name cannot be empty').max(60),
  bio: z.string().trim().max(400).default(''),
  targetRole: z.string().trim().max(80).default(''),
  targetDate: z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a YYYY-MM-DD date')]),
  dailyGoal: z.coerce.number().int().min(1).max(50),
  preferredLanguage: z.string().trim().max(20).default('java'),
  timezone: z.string().trim().max(60).default('Asia/Kolkata'),
});

export async function getProfile(userId: string): Promise<Profile> {
  const row = await queryOne<Record<string, unknown>>('SELECT * FROM profiles WHERE user_id = $1', [
    userId,
  ]);
  const date = row?.target_date;
  return {
    displayName: String(row?.display_name ?? ''),
    bio: String(row?.bio ?? ''),
    targetRole: String(row?.target_role ?? ''),
    targetDate:
      date == null
        ? null
        : date instanceof Date
          ? date.toISOString().slice(0, 10)
          : String(date).slice(0, 10),
    dailyGoal: Number(row?.daily_goal ?? 3),
    preferredLanguage: String(row?.preferred_language ?? 'java'),
    timezone: String(row?.timezone ?? 'Asia/Kolkata'),
  };
}

export async function updateProfileAction(
  _prev: ProfileResult,
  formData: FormData,
): Promise<ProfileResult> {
  const user = await requireUser();

  const parsed = schema.safeParse({
    displayName: formData.get('displayName'),
    bio: formData.get('bio') ?? '',
    targetRole: formData.get('targetRole') ?? '',
    targetDate: formData.get('targetDate') ?? '',
    dailyGoal: formData.get('dailyGoal'),
    preferredLanguage: formData.get('preferredLanguage') ?? 'java',
    timezone: formData.get('timezone') ?? 'Asia/Kolkata',
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;

  await execute(
    `INSERT INTO profiles
       (user_id, display_name, bio, target_role, target_date, daily_goal, preferred_language, timezone)
     VALUES ($1,$2,$3,$4,$5::date,$6,$7,$8)
     ON CONFLICT (user_id) DO UPDATE SET
       display_name = EXCLUDED.display_name,
       bio = EXCLUDED.bio,
       target_role = EXCLUDED.target_role,
       target_date = EXCLUDED.target_date,
       daily_goal = EXCLUDED.daily_goal,
       preferred_language = EXCLUDED.preferred_language,
       timezone = EXCLUDED.timezone`,
    [
      user.id,
      d.displayName,
      d.bio,
      d.targetRole,
      d.targetDate === '' ? null : d.targetDate,
      d.dailyGoal,
      d.preferredLanguage,
      d.timezone,
    ],
  );

  revalidatePath('/', 'layout');
  return { ok: true, message: 'Profile saved.' };
}
