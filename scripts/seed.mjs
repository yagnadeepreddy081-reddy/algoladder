#!/usr/bin/env node
/**
 * db:seed — loads data/topics.json, data/subtopics.json and data/problems.json
 * into Postgres. Idempotent: re-running updates existing rows rather than
 * duplicating them, and never touches user progress.
 *
 *   npm run db:seed
 *   npm run db:seed -- --prune    also delete problems no longer in the JSON
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createPool, loadEnv, ROOT } from './_env.mjs';
import { validateDataset } from './validate-problems.mjs';

// Must run before anything below reads process.env (PREMIUM_TOPIC_SLUGS).
loadEnv();

const prune = process.argv.includes('--prune');
const DATA_DIR = resolve(ROOT, 'data');
const read = (f) => JSON.parse(readFileSync(resolve(DATA_DIR, f), 'utf8'));

const topics = read('topics.json');
const subtopics = read('subtopics.json');
const problems = read('problems.json');

// Refuse to seed a dataset that would not pass validation.
const report = validateDataset({ problems, topics, subtopics });
if (!report.passed) {
  console.error('\n  Refusing to seed: the dataset does not validate.\n');
  for (const e of report.errors) console.error(`  x ${e}`);
  console.error('');
  process.exit(1);
}

const premiumTopicSlugs = new Set(
  (process.env.PREMIUM_TOPIC_SLUGS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

const pool = createPool();

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ---- topics ---------------------------------------------------------
    for (const t of topics) {
      await client.query(
        `INSERT INTO topics (id, slug, name, description, icon, position, is_premium)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO UPDATE SET
           slug = EXCLUDED.slug,
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           icon = EXCLUDED.icon,
           position = EXCLUDED.position,
           is_premium = EXCLUDED.is_premium`,
        [t.id, t.slug, t.name, t.description, t.icon, t.position, premiumTopicSlugs.has(t.slug)],
      );
    }
    console.log(`  topics      ${topics.length}`);

    // ---- subtopics ------------------------------------------------------
    for (const s of subtopics) {
      await client.query(
        `INSERT INTO subtopics (id, topic_id, slug, name, description, position, is_premium)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO UPDATE SET
           topic_id = EXCLUDED.topic_id,
           slug = EXCLUDED.slug,
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           position = EXCLUDED.position,
           is_premium = EXCLUDED.is_premium`,
        [
          s.id,
          s.topicId,
          s.slug,
          s.name,
          s.description,
          s.position,
          premiumTopicSlugs.has(s.topicSlug),
        ],
      );
    }
    console.log(`  subtopics   ${subtopics.length}`);

    // ---- problems -------------------------------------------------------
    for (const p of problems) {
      const isPremium = p.isPremium || premiumTopicSlugs.has(p.topicSlug);
      await client.query(
        `INSERT INTO problems (
           id, slug, title, topic_id, subtopic_id, difficulty,
           problem_no_in_topic, overall_no, recommended_order,
           description, platform, external_url, video_url,
           tags, companies, is_premium, is_revision, is_active,
           pattern, pattern_name, pattern_family, hints, approach,
           time_complexity, space_complexity, io_format, examples, constraints
         ) VALUES (
           $1,$2,$3,$4,$5,$6::difficulty_level,
           $7,$8,$9,
           $10,$11,$12,$13,
           $14,$15,$16,$17,true,
           $18,$19,$20,$21,$22,
           $23,$24,$25::jsonb,$26::jsonb,$27
         )
         ON CONFLICT (id) DO UPDATE SET
           slug = EXCLUDED.slug,
           title = EXCLUDED.title,
           topic_id = EXCLUDED.topic_id,
           subtopic_id = EXCLUDED.subtopic_id,
           difficulty = EXCLUDED.difficulty,
           problem_no_in_topic = EXCLUDED.problem_no_in_topic,
           overall_no = EXCLUDED.overall_no,
           recommended_order = EXCLUDED.recommended_order,
           description = EXCLUDED.description,
           platform = EXCLUDED.platform,
           external_url = EXCLUDED.external_url,
           video_url = EXCLUDED.video_url,
           tags = EXCLUDED.tags,
           companies = EXCLUDED.companies,
           is_premium = EXCLUDED.is_premium,
           is_revision = EXCLUDED.is_revision,
           is_active = true,
           pattern = EXCLUDED.pattern,
           pattern_name = EXCLUDED.pattern_name,
           pattern_family = EXCLUDED.pattern_family,
           hints = EXCLUDED.hints,
           approach = EXCLUDED.approach,
           time_complexity = EXCLUDED.time_complexity,
           space_complexity = EXCLUDED.space_complexity,
           io_format = EXCLUDED.io_format,
           examples = EXCLUDED.examples,
           constraints = EXCLUDED.constraints`,
        [
          p.id, p.slug, p.title, p.topicId, p.subtopicId, p.difficulty,
          p.problemNoInTopic, p.overallNo, p.recommendedOrder,
          p.description, p.platform, p.externalUrl, p.videoUrl,
          p.tags, p.companies, isPremium, p.isRevision,
          p.pattern, p.patternName, p.patternFamily, p.hints, p.approach,
          p.timeComplexity, p.spaceComplexity,
          p.ioFormat ? JSON.stringify(p.ioFormat) : null,
          JSON.stringify(p.examples ?? []),
          p.constraints ?? [],
        ],
      );
    }
    console.log(`  problems    ${problems.length}`);

    if (prune) {
      const ids = problems.map((p) => p.id);
      const { rowCount } = await client.query(
        'DELETE FROM problems WHERE NOT (id = ANY($1::text[]))',
        [ids],
      );
      console.log(`  pruned      ${rowCount} problems no longer in the dataset`);
    }

    await client.query('COMMIT');

    const { rows } = await client.query('SELECT count(*)::int AS n FROM problems WHERE is_active');
    console.log(`\n  Seed complete. ${rows[0].n} active problems in the database.\n`);

    if (rows[0].n !== 474) {
      console.error(`  WARNING: database holds ${rows[0].n} active problems, expected 474.`);
      console.error('  Run `npm run db:seed -- --prune` to remove rows from an older dataset.\n');
      process.exit(1);
    }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(`\n  seed failed: ${err.message}\n`);
  process.exit(1);
});
