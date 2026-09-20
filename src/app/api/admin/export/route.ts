import { NextResponse } from 'next/server';

import { query } from '@/lib/db';
import { getApiUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

function csvEscape(v: unknown): string {
  if (v == null) return '';
  const s = Array.isArray(v) ? v.join('; ') : v instanceof Date ? v.toISOString() : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * GET /api/admin/export?format=json|csv&what=problems|topics|subtopics
 *
 * Admin-only. The JSON shape round-trips exactly through the import panel and
 * through `npm run db:seed`, so an export is a valid backup.
 */
export async function GET(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Admins only' }, { status: 403 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get('format') === 'csv' ? 'csv' : 'json';
  const what = url.searchParams.get('what') ?? 'problems';
  const stamp = new Date().toISOString().slice(0, 10);

  if (what === 'topics' || what === 'subtopics') {
    const rows =
      what === 'topics'
        ? await query('SELECT * FROM topics ORDER BY position')
        : await query(
            `SELECT s.* FROM subtopics s JOIN topics t ON t.id = s.topic_id
              ORDER BY t.position, s.position`,
          );
    return new NextResponse(JSON.stringify(rows, null, 2), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'content-disposition': `attachment; filename="algoladder-${what}-${stamp}.json"`,
      },
    });
  }

  const rows = await query<Record<string, unknown>>(
    `SELECT p.id, p.slug, p.title,
            p.topic_id, t.slug AS topic_slug, t.name AS topic_name,
            p.subtopic_id, s.slug AS subtopic_slug, s.name AS subtopic_name,
            p.difficulty, p.problem_no_in_topic, p.overall_no, p.recommended_order,
            p.description, p.platform, p.external_url, p.video_url,
            p.tags, p.companies, p.is_premium, p.is_revision,
            p.pattern, p.pattern_name, p.pattern_family, p.hints, p.approach,
            p.time_complexity, p.space_complexity
       FROM problems p
       JOIN topics t    ON t.id = p.topic_id
       JOIN subtopics s ON s.id = p.subtopic_id
      ORDER BY p.overall_no`,
  );

  if (format === 'csv') {
    const headers = Object.keys(rows[0] ?? {});
    const csv = [
      headers.join(','),
      ...rows.map((r) => headers.map((h) => csvEscape(r[h])).join(',')),
    ].join('\n');
    return new NextResponse(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="algoladder-problems-${stamp}.csv"`,
      },
    });
  }

  // camelCase, so the payload can be pasted straight back into the importer.
  const json = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    topicId: r.topic_id,
    topicSlug: r.topic_slug,
    topicName: r.topic_name,
    subtopicId: r.subtopic_id,
    subtopicSlug: r.subtopic_slug,
    subtopicName: r.subtopic_name,
    difficulty: r.difficulty,
    problemNoInTopic: Number(r.problem_no_in_topic),
    overallNo: Number(r.overall_no),
    recommendedOrder: Number(r.recommended_order),
    description: r.description,
    platform: r.platform,
    externalUrl: r.external_url,
    videoUrl: r.video_url,
    tags: r.tags,
    companies: r.companies,
    isPremium: r.is_premium,
    isRevision: r.is_revision,
    pattern: r.pattern,
    patternName: r.pattern_name,
    patternFamily: r.pattern_family,
    hints: r.hints,
    approach: r.approach,
    timeComplexity: r.time_complexity,
    spaceComplexity: r.space_complexity,
  }));

  return new NextResponse(JSON.stringify(json, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="algoladder-problems-${stamp}.json"`,
    },
  });
}
