#!/usr/bin/env node
/**
 * Expands data/source/roadmap.mjs + data/source/patterns.mjs into the three
 * JSON files the application and the database seed actually read:
 *
 *   data/topics.json      19 topics
 *   data/subtopics.json   the subtopic tree
 *   data/problems.json    exactly 474 problems
 *
 * Run with: npm run dataset:build
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ROADMAP } from '../data/source/roadmap.mjs';
import { PATTERNS } from '../data/source/patterns.mjs';
import { STATEMENTS } from '../data/source/statements.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'data');

export const EXPECTED_TOTAL = 474;

const DIFFICULTY = { E: 'Easy', M: 'Medium', H: 'Hard' };

/** Kebab-case a problem title the way LeetCode slugs do. */
export function kebab(title) {
  return title
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Resolve the external URL + platform from the title's optional @override. */
function resolveLink(rawTitle) {
  const at = rawTitle.indexOf('@');
  if (at === -1) {
    return {
      title: rawTitle,
      platform: 'LeetCode',
      url: `https://leetcode.com/problems/${kebab(rawTitle)}/`,
      derived: true,
    };
  }
  const title = rawTitle.slice(0, at);
  const override = rawTitle.slice(at + 1);

  if (override.startsWith('lc:')) {
    return {
      title,
      platform: 'LeetCode',
      url: `https://leetcode.com/problems/${override.slice(3)}/`,
      derived: false,
    };
  }
  if (override.startsWith('gfg:')) {
    return {
      title,
      platform: 'GeeksforGeeks',
      url: `https://www.geeksforgeeks.org/problems/${override.slice(4)}`,
      derived: false,
    };
  }
  if (override.startsWith('url:')) {
    const url = override.slice(4);
    let platform = 'Other';
    if (url.includes('leetcode.com')) platform = 'LeetCode';
    else if (url.includes('geeksforgeeks.org')) platform = 'GeeksforGeeks';
    else if (url.includes('hackerrank.com')) platform = 'HackerRank';
    else if (url.includes('codingninjas.com') || url.includes('naukri.com')) platform = 'CodeStudio';
    else if (url.includes('interviewbit.com')) platform = 'InterviewBit';
    else if (url.includes('codeforces.com')) platform = 'Codeforces';
    return { title, platform, url, derived: false };
  }
  throw new Error(`Unrecognised link override in title: "${rawTitle}"`);
}

function parseRow(row, ctx) {
  const parts = row.split('|');
  if (parts.length !== 6) {
    throw new Error(
      `Row in ${ctx} must have 6 pipe-separated fields, found ${parts.length}:\n  ${row}`,
    );
  }
  const [rawTitle, diff, pattern, tags, companies, description] = parts.map((p) => p.trim());

  if (!DIFFICULTY[diff]) {
    throw new Error(`Unknown difficulty "${diff}" in ${ctx} for "${rawTitle}"`);
  }
  if (!PATTERNS[pattern]) {
    throw new Error(`Unknown pattern "${pattern}" in ${ctx} for "${rawTitle}"`);
  }

  const link = resolveLink(rawTitle);

  return {
    title: link.title,
    platform: link.platform,
    externalUrl: link.url,
    urlDerivedFromTitle: link.derived,
    difficulty: DIFFICULTY[diff],
    pattern,
    tags: tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    companies:
      companies === '-'
        ? []
        : companies
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean),
    description,
  };
}

export function buildDataset() {
  const topics = [];
  const subtopics = [];
  const problems = [];

  let overallNo = 0;

  ROADMAP.forEach((topic, tIndex) => {
    const topicId = `topic-${String(tIndex + 1).padStart(2, '0')}`;
    let problemNoInTopic = 0;
    let topicProblemCount = 0;

    topic.subtopics.forEach((sub, sIndex) => {
      const subtopicId = `${topicId}-s${String(sIndex + 1).padStart(2, '0')}`;

      sub.rows.forEach((row, rIndex) => {
        const ctx = `${topic.slug}/${sub.slug}[${rIndex}]`;
        const parsed = parseRow(row, ctx);
        const p = PATTERNS[parsed.pattern];

        overallNo += 1;
        problemNoInTopic += 1;
        topicProblemCount += 1;

        const slug = kebab(parsed.title);
        const statement = STATEMENTS[slug] ?? {};

        problems.push({
          id: `al-${String(overallNo).padStart(4, '0')}`,
          slug,
          title: parsed.title,

          topicId,
          topicSlug: topic.slug,
          topicName: topic.name,
          subtopicId,
          subtopicSlug: sub.slug,
          subtopicName: sub.name,

          difficulty: parsed.difficulty,
          problemNoInTopic,
          overallNo,
          recommendedOrder: overallNo,

          description: statement.description ?? parsed.description,
          platform: parsed.platform,
          externalUrl: parsed.externalUrl,
          urlDerivedFromTitle: parsed.urlDerivedFromTitle,
          videoUrl: null,

          tags: parsed.tags,
          companies: parsed.companies,

          isPremium: false,
          isRevision: false,

          pattern: parsed.pattern,
          patternName: p.name,
          patternFamily: p.family,

          // A problem with a full statement in statements.mjs overrides the
          // pattern-level defaults; anything it omits still falls back to them.
          hints: statement.hints ?? p.hints,
          approach: statement.approach ?? p.approach,
          timeComplexity: statement.timeComplexity ?? p.tc,
          spaceComplexity: statement.spaceComplexity ?? p.sc,

          ioFormat: statement.ioFormat ?? null,
          examples: statement.examples ?? [],
          constraints: statement.constraints ?? [],

        });
      });

      subtopics.push({
        id: subtopicId,
        topicId,
        topicSlug: topic.slug,
        slug: sub.slug,
        name: sub.name,
        description: sub.description,
        position: sIndex + 1,
        problemCount: sub.rows.length,
      });
    });

    topics.push({
      id: topicId,
      slug: topic.slug,
      name: topic.name,
      icon: topic.icon ?? 'circle',
      description: topic.description,
      position: tIndex + 1,
      isPremium: false,
      problemCount: topicProblemCount,
    });
  });

  // Every key in statements.mjs must name a real problem. A typo in a slug
  // would otherwise fail silently, leaving the problem with pattern defaults.
  const slugs = new Set(problems.map((p) => p.slug));
  const orphans = Object.keys(STATEMENTS).filter((slug) => !slugs.has(slug));
  if (orphans.length) {
    throw new Error(
      `statements.mjs has ${orphans.length} key(s) matching no problem:\n  ${orphans.join('\n  ')}`,
    );
  }

  // ---- Revision list -----------------------------------------------------
  // Seed the default revision list with the highest-leverage problems: the
  // hard ones plus every problem that opens a new pattern. This is a starting
  // point — each user then curates their own list from the UI.
  const seenPattern = new Set();
  for (const p of problems) {
    const firstOfPattern = !seenPattern.has(p.pattern);
    seenPattern.add(p.pattern);
    p.isRevision = p.difficulty === 'Hard' || firstOfPattern;
  }

  return { topics, subtopics, problems };
}

function main() {
  const { topics, subtopics, problems } = buildDataset();

  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(resolve(DATA_DIR, 'topics.json'), JSON.stringify(topics, null, 2) + '\n');
  writeFileSync(resolve(DATA_DIR, 'subtopics.json'), JSON.stringify(subtopics, null, 2) + '\n');
  writeFileSync(resolve(DATA_DIR, 'problems.json'), JSON.stringify(problems, null, 2) + '\n');

  console.log('Dataset written to data/');
  console.log(`  topics.json     ${topics.length} topics`);
  console.log(`  subtopics.json  ${subtopics.length} subtopics`);
  console.log(`  problems.json   ${problems.length} problems`);
  console.log('');
  for (const t of topics) {
    console.log(`  ${String(t.position).padStart(2)}. ${t.name.padEnd(46)} ${String(t.problemCount).padStart(3)}`);
  }
  console.log(`  ${''.padEnd(50)} ${String(problems.length).padStart(3)}`);

  if (problems.length !== EXPECTED_TOTAL) {
    console.error(
      `\nERROR: expected exactly ${EXPECTED_TOTAL} problems, produced ${problems.length} ` +
        `(${problems.length > EXPECTED_TOTAL ? 'remove' : 'add'} ${Math.abs(problems.length - EXPECTED_TOTAL)}).`,
    );
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
