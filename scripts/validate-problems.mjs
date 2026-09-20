#!/usr/bin/env node
/**
 * validate-problems
 * =================
 * The gate the build runs through. Exits non-zero — failing `npm run build` —
 * unless the dataset contains exactly 474 valid, unique, fully populated,
 * correctly numbered problems.
 *
 *   npm run validate-problems
 *   npm run validate-problems -- --json    machine-readable report
 *   npm run validate-problems -- --quiet   only print failures
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'data');

export const EXPECTED_TOTAL = 474;
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const ALLOWED_PLATFORMS = [
  'LeetCode',
  'GeeksforGeeks',
  'CodeStudio',
  'HackerRank',
  'InterviewBit',
  'Codeforces',
  'Other',
];

const REQUIRED_STRING_FIELDS = [
  'id',
  'slug',
  'title',
  'topicId',
  'topicSlug',
  'topicName',
  'subtopicId',
  'subtopicSlug',
  'subtopicName',
  'difficulty',
  'description',
  'platform',
  'externalUrl',
  'pattern',
  'patternName',
  'approach',
  'timeComplexity',
  'spaceComplexity',
];

function readJson(name) {
  const p = resolve(DATA_DIR, name);
  if (!existsSync(p)) {
    throw new Error(`Missing ${name}. Run "npm run dataset:build" first.`);
  }
  return JSON.parse(readFileSync(p, 'utf8'));
}

function isValidUrl(value) {
  if (typeof value !== 'string' || value.length === 0) return false;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && u.hostname.includes('.');
  } catch {
    return false;
  }
}

/**
 * Runs every check and returns a structured report. Pure — no I/O, no exits —
 * so the test suite can call it directly.
 */
export function validateDataset({ problems, topics, subtopics }) {
  const errors = [];
  const warnings = [];

  // 1 ---- total count ----------------------------------------------------
  if (problems.length !== EXPECTED_TOTAL) {
    errors.push(
      `Total problem count is ${problems.length}, expected exactly ${EXPECTED_TOTAL}.`,
    );
  }

  // 2 ---- duplicate IDs --------------------------------------------------
  const duplicateIds = [];
  const idSeen = new Map();
  for (const p of problems) {
    if (idSeen.has(p.id)) duplicateIds.push(p.id);
    else idSeen.set(p.id, p.title);
  }
  if (duplicateIds.length) errors.push(`Duplicate problem IDs: ${duplicateIds.join(', ')}`);

  // 3 ---- duplicate titles (case/space insensitive) ----------------------
  const duplicateTitles = [];
  const titleSeen = new Map();
  for (const p of problems) {
    const key = String(p.title).trim().toLowerCase().replace(/\s+/g, ' ');
    if (titleSeen.has(key)) duplicateTitles.push(p.title);
    else titleSeen.set(key, p.id);
  }
  if (duplicateTitles.length) {
    errors.push(`Duplicate problem titles: ${duplicateTitles.join(' | ')}`);
  }

  // 3b --- duplicate slugs -------------------------------------------------
  const duplicateSlugs = [];
  const slugSeen = new Set();
  for (const p of problems) {
    if (slugSeen.has(p.slug)) duplicateSlugs.push(p.slug);
    else slugSeen.add(p.slug);
  }
  if (duplicateSlugs.length) errors.push(`Duplicate problem slugs: ${duplicateSlugs.join(', ')}`);

  // 3c --- duplicate external URLs ----------------------------------------
  const urlSeen = new Map();
  const duplicateUrls = [];
  for (const p of problems) {
    if (urlSeen.has(p.externalUrl)) duplicateUrls.push(`${p.title} <-> ${urlSeen.get(p.externalUrl)}`);
    else urlSeen.set(p.externalUrl, p.title);
  }
  if (duplicateUrls.length) errors.push(`Duplicate external URLs: ${duplicateUrls.join(' | ')}`);

  // 4/5/6 -- missing fields, difficulty, URLs -----------------------------
  const missingFields = [];
  const invalidUrls = [];
  const badDifficulty = [];
  const placeholderTitles = [];
  const PLACEHOLDER = /^(problem\s*\d+|coming soon|tbd|todo|untitled|test|lorem)/i;

  for (const p of problems) {
    for (const f of REQUIRED_STRING_FIELDS) {
      if (typeof p[f] !== 'string' || p[f].trim() === '') {
        missingFields.push(`${p.id ?? '<no id>'}: ${f}`);
      }
    }
    if (!Array.isArray(p.tags)) missingFields.push(`${p.id}: tags`);
    if (!Array.isArray(p.companies)) missingFields.push(`${p.id}: companies`);
    if (!Array.isArray(p.hints) || p.hints.length === 0) missingFields.push(`${p.id}: hints`);
    if (typeof p.isPremium !== 'boolean') missingFields.push(`${p.id}: isPremium`);
    if (typeof p.isRevision !== 'boolean') missingFields.push(`${p.id}: isRevision`);
    if (!Number.isInteger(p.recommendedOrder)) missingFields.push(`${p.id}: recommendedOrder`);
    if (!Number.isInteger(p.problemNoInTopic)) missingFields.push(`${p.id}: problemNoInTopic`);

    if (!DIFFICULTIES.includes(p.difficulty)) {
      badDifficulty.push(`${p.id} (${p.title}): "${p.difficulty}"`);
    }
    if (!isValidUrl(p.externalUrl)) {
      invalidUrls.push(`${p.id} (${p.title}): ${p.externalUrl}`);
    }
    if (p.videoUrl != null && !isValidUrl(p.videoUrl)) {
      invalidUrls.push(`${p.id} (${p.title}) video: ${p.videoUrl}`);
    }
    if (!ALLOWED_PLATFORMS.includes(p.platform)) {
      warnings.push(`${p.id}: unrecognised platform "${p.platform}"`);
    }
    if (PLACEHOLDER.test(String(p.title))) {
      placeholderTitles.push(`${p.id}: ${p.title}`);
    }
  }

  if (missingFields.length) {
    errors.push(`Missing or empty required fields (${missingFields.length}):\n    - ${missingFields.slice(0, 25).join('\n    - ')}`);
  }
  if (badDifficulty.length) {
    errors.push(`Invalid difficulty values:\n    - ${badDifficulty.join('\n    - ')}`);
  }
  if (invalidUrls.length) {
    errors.push(`Invalid external URLs:\n    - ${invalidUrls.join('\n    - ')}`);
  }
  if (placeholderTitles.length) {
    errors.push(`Placeholder-looking titles are not allowed:\n    - ${placeholderTitles.join('\n    - ')}`);
  }

  // 7 ---- topic / subtopic mapping ---------------------------------------
  const topicById = new Map(topics.map((t) => [t.id, t]));
  const subtopicById = new Map(subtopics.map((s) => [s.id, s]));
  const missingMappings = [];

  for (const p of problems) {
    const t = topicById.get(p.topicId);
    const s = subtopicById.get(p.subtopicId);
    if (!t) missingMappings.push(`${p.id}: unknown topicId "${p.topicId}"`);
    else if (t.slug !== p.topicSlug) {
      missingMappings.push(`${p.id}: topicSlug "${p.topicSlug}" does not match topic "${t.slug}"`);
    }
    if (!s) missingMappings.push(`${p.id}: unknown subtopicId "${p.subtopicId}"`);
    else if (s.topicId !== p.topicId) {
      missingMappings.push(`${p.id}: subtopic "${s.id}" does not belong to topic "${p.topicId}"`);
    }
  }
  if (missingMappings.length) {
    errors.push(`Broken topic/subtopic mappings:\n    - ${missingMappings.slice(0, 25).join('\n    - ')}`);
  }

  // 8 ---- topic totals add up --------------------------------------------
  const byTopic = new Map();
  for (const p of problems) byTopic.set(p.topicSlug, (byTopic.get(p.topicSlug) ?? 0) + 1);

  let topicSum = 0;
  for (const t of topics) {
    const actual = byTopic.get(t.slug) ?? 0;
    topicSum += actual;
    if (actual !== t.problemCount) {
      errors.push(
        `Topic "${t.name}" declares problemCount ${t.problemCount} but holds ${actual} problems.`,
      );
    }
    if (actual === 0) errors.push(`Topic "${t.name}" has no problems.`);
  }
  if (topicSum !== EXPECTED_TOTAL) {
    errors.push(`Topic totals add up to ${topicSum}, expected ${EXPECTED_TOTAL}.`);
  }

  // 8b --- subtopic totals add up -----------------------------------------
  const bySubtopic = new Map();
  for (const p of problems) bySubtopic.set(p.subtopicId, (bySubtopic.get(p.subtopicId) ?? 0) + 1);
  for (const s of subtopics) {
    const actual = bySubtopic.get(s.id) ?? 0;
    if (actual !== s.problemCount) {
      errors.push(
        `Subtopic "${s.name}" declares problemCount ${s.problemCount} but holds ${actual}.`,
      );
    }
  }

  // 9 ---- continuous overall numbering 1..474 ----------------------------
  const sorted = [...problems].map((p) => p.overallNo).sort((a, b) => a - b);
  const numberingGaps = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (sorted[i] !== i + 1) {
      numberingGaps.push(`position ${i + 1} holds overallNo ${sorted[i]}`);
      if (numberingGaps.length > 10) break;
    }
  }
  if (numberingGaps.length) {
    errors.push(
      `Overall numbering is not continuous from 1 to ${EXPECTED_TOTAL}:\n    - ${numberingGaps.join('\n    - ')}`,
    );
  }

  // 9b --- per-topic numbering is 1..n ------------------------------------
  const perTopicNumbers = new Map();
  for (const p of problems) {
    if (!perTopicNumbers.has(p.topicSlug)) perTopicNumbers.set(p.topicSlug, []);
    perTopicNumbers.get(p.topicSlug).push(p.problemNoInTopic);
  }
  for (const [slug, nums] of perTopicNumbers) {
    const s = [...nums].sort((a, b) => a - b);
    const ok = s.every((n, i) => n === i + 1);
    if (!ok) errors.push(`Topic "${slug}" numbering is not continuous from 1 to ${s.length}.`);
  }

  // ---- stats -------------------------------------------------------------
  const byDifficulty = { Easy: 0, Medium: 0, Hard: 0 };
  const byPlatform = {};
  let derivedUrlCount = 0;
  let premiumCount = 0;
  let revisionCount = 0;

  for (const p of problems) {
    if (byDifficulty[p.difficulty] !== undefined) byDifficulty[p.difficulty] += 1;
    byPlatform[p.platform] = (byPlatform[p.platform] ?? 0) + 1;
    if (p.urlDerivedFromTitle) derivedUrlCount += 1;
    if (p.isPremium) premiumCount += 1;
    if (p.isRevision) revisionCount += 1;
  }

  return {
    passed: errors.length === 0,
    expectedTotal: EXPECTED_TOTAL,
    total: problems.length,
    topics: topics.length,
    subtopics: subtopics.length,
    byTopic: Object.fromEntries([...byTopic.entries()]),
    byDifficulty,
    byPlatform,
    duplicateIds,
    duplicateTitles,
    duplicateSlugs,
    missingFields,
    invalidUrls,
    missingMappings,
    derivedUrlCount,
    premiumCount,
    revisionCount,
    errors,
    warnings,
  };
}

function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const quiet = args.includes('--quiet');

  let report;
  try {
    report = validateDataset({
      problems: readJson('problems.json'),
      topics: readJson('topics.json'),
      subtopics: readJson('subtopics.json'),
    });
  } catch (err) {
    console.error(`validate-problems: ${err.message}`);
    process.exit(1);
  }

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.passed ? 0 : 1);
  }

  if (!quiet) {
    const line = (label, value) => console.log(`  ${label.padEnd(28)} ${value}`);

    console.log('');
    console.log('  AlgoLadder dataset validation');
    console.log('  ' + '-'.repeat(54));
    line('Total problems', `${report.total} / ${report.expectedTotal}`);
    line('Topics', report.topics);
    line('Subtopics', report.subtopics);
    console.log('');

    console.log('  Problems by topic');
    for (const [slug, count] of Object.entries(report.byTopic)) {
      line(`  ${slug}`, count);
    }
    console.log('');

    console.log('  Problems by difficulty');
    for (const [d, count] of Object.entries(report.byDifficulty)) {
      const pct = ((count / report.total) * 100).toFixed(1);
      line(`  ${d}`, `${count}  (${pct}%)`);
    }
    console.log('');

    console.log('  Problems by platform');
    for (const [p, count] of Object.entries(report.byPlatform)) {
      line(`  ${p}`, count);
    }
    console.log('');

    line('Duplicate IDs', report.duplicateIds.length);
    line('Duplicate titles', report.duplicateTitles.length);
    line('Duplicate slugs', report.duplicateSlugs.length);
    line('Missing fields', report.missingFields.length);
    line('Invalid URLs', report.invalidUrls.length);
    line('Missing topic mappings', report.missingMappings.length);
    line('Marked premium', report.premiumCount);
    line('On default revision list', report.revisionCount);
    line('URLs derived from title', `${report.derivedUrlCount}  (verify with dataset:check-urls)`);
    console.log('');
  }

  for (const w of report.warnings) console.warn(`  warning: ${w}`);

  if (!report.passed) {
    console.error('  DATASET VALIDATION FAILED\n');
    for (const e of report.errors) console.error(`  x ${e}`);
    console.error('');
    process.exit(1);
  }

  console.log(`  DATASET VALIDATION PASSED — exactly ${report.total} problems.\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
