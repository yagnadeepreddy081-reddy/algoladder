/**
 * Dataset validation, in TypeScript, for the admin panel and the test suite.
 *
 * `scripts/validate-problems.mjs` runs the same checks against the JSON files
 * at build time; this module runs them against whatever is actually in the
 * database, which is what the admin "Run validation" button reports. Keeping
 * them as two files is deliberate — the build gate must run with no database
 * and no bundler, and this one must run inside the app.
 */

export const EXPECTED_TOTAL = 474;

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export interface ValidatableProblem {
  id: string;
  slug: string;
  title: string;
  topicId: string;
  topicSlug: string;
  subtopicId: string;
  difficulty: string;
  description: string;
  externalUrl: string;
  platform: string;
  overallNo: number;
  problemNoInTopic: number;
  isPremium: boolean;
}

export interface ValidationReport {
  passed: boolean;
  expectedTotal: number;
  total: number;
  byTopic: Record<string, number>;
  byDifficulty: Record<string, number>;
  byPlatform: Record<string, number>;
  duplicateIds: string[];
  duplicateTitles: string[];
  duplicateSlugs: string[];
  missingFields: string[];
  invalidUrls: string[];
  missingMappings: string[];
  numberingGaps: string[];
  premiumCount: number;
  errors: string[];
}

function isValidUrl(value: string): boolean {
  if (!value) return false;
  try {
    const u = new URL(value);
    return (u.protocol === 'https:' || u.protocol === 'http:') && u.hostname.includes('.');
  } catch {
    return false;
  }
}

export function validateDatasetRows(
  problems: ValidatableProblem[],
  topics: { id: string; slug: string; name: string }[],
  subtopics: { id: string; topicId: string }[],
): ValidationReport {
  const errors: string[] = [];

  // --- counts ------------------------------------------------------------
  if (problems.length !== EXPECTED_TOTAL) {
    errors.push(`Total problem count is ${problems.length}, expected exactly ${EXPECTED_TOTAL}.`);
  }

  // --- duplicates --------------------------------------------------------
  const seenId = new Set<string>();
  const seenTitle = new Set<string>();
  const seenSlug = new Set<string>();
  const duplicateIds: string[] = [];
  const duplicateTitles: string[] = [];
  const duplicateSlugs: string[] = [];

  for (const p of problems) {
    if (seenId.has(p.id)) duplicateIds.push(p.id);
    seenId.add(p.id);

    const titleKey = p.title.trim().toLowerCase().replace(/\s+/g, ' ');
    if (seenTitle.has(titleKey)) duplicateTitles.push(p.title);
    seenTitle.add(titleKey);

    if (seenSlug.has(p.slug)) duplicateSlugs.push(p.slug);
    seenSlug.add(p.slug);
  }

  if (duplicateIds.length) errors.push(`Duplicate IDs: ${duplicateIds.join(', ')}`);
  if (duplicateTitles.length) errors.push(`Duplicate titles: ${duplicateTitles.join(' | ')}`);
  if (duplicateSlugs.length) errors.push(`Duplicate slugs: ${duplicateSlugs.join(', ')}`);

  // --- fields, difficulty, URLs -----------------------------------------
  const missingFields: string[] = [];
  const invalidUrls: string[] = [];
  const PLACEHOLDER = /^(problem\s*\d+|coming soon|tbd|todo|untitled|test)\b/i;

  for (const p of problems) {
    if (!p.title?.trim()) missingFields.push(`${p.id}: title`);
    if (!p.topicId) missingFields.push(`${p.id}: topic`);
    if (!p.subtopicId) missingFields.push(`${p.id}: subtopic`);
    if (!p.description?.trim()) missingFields.push(`${p.id}: description`);
    if (!DIFFICULTIES.includes(p.difficulty)) missingFields.push(`${p.id}: difficulty`);
    if (!isValidUrl(p.externalUrl)) invalidUrls.push(`${p.id} (${p.title}): ${p.externalUrl}`);
    if (PLACEHOLDER.test(p.title ?? '')) missingFields.push(`${p.id}: placeholder title "${p.title}"`);
  }

  if (missingFields.length) {
    errors.push(`Missing or invalid fields on ${missingFields.length} problems.`);
  }
  if (invalidUrls.length) {
    errors.push(`${invalidUrls.length} problems have an invalid external URL.`);
  }

  // --- mappings ----------------------------------------------------------
  const topicById = new Map(topics.map((t) => [t.id, t]));
  const subtopicById = new Map(subtopics.map((s) => [s.id, s]));
  const missingMappings: string[] = [];

  for (const p of problems) {
    if (!topicById.has(p.topicId)) missingMappings.push(`${p.id}: unknown topic ${p.topicId}`);
    const sub = subtopicById.get(p.subtopicId);
    if (!sub) missingMappings.push(`${p.id}: unknown subtopic ${p.subtopicId}`);
    else if (sub.topicId !== p.topicId) {
      missingMappings.push(`${p.id}: subtopic belongs to a different topic`);
    }
  }
  if (missingMappings.length) {
    errors.push(`${missingMappings.length} problems have a broken topic or subtopic mapping.`);
  }

  // --- topic totals ------------------------------------------------------
  const byTopic: Record<string, number> = {};
  for (const p of problems) {
    const slug = topicById.get(p.topicId)?.slug ?? p.topicSlug ?? 'unknown';
    byTopic[slug] = (byTopic[slug] ?? 0) + 1;
  }
  const topicSum = Object.values(byTopic).reduce((a, b) => a + b, 0);
  if (topicSum !== problems.length) {
    errors.push(`Topic totals add up to ${topicSum} but there are ${problems.length} problems.`);
  }
  if (problems.length === EXPECTED_TOTAL && topicSum !== EXPECTED_TOTAL) {
    errors.push(`Topic totals do not add up to ${EXPECTED_TOTAL}.`);
  }

  // --- numbering ---------------------------------------------------------
  const numberingGaps: string[] = [];
  const sorted = problems.map((p) => p.overallNo).sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i += 1) {
    if (sorted[i] !== i + 1) {
      numberingGaps.push(`expected ${i + 1}, found ${sorted[i]}`);
      if (numberingGaps.length >= 10) break;
    }
  }
  if (numberingGaps.length) {
    errors.push(`Overall numbering is not continuous from 1 to ${problems.length}.`);
  }

  // --- stats -------------------------------------------------------------
  const byDifficulty: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 };
  const byPlatform: Record<string, number> = {};
  let premiumCount = 0;
  for (const p of problems) {
    if (byDifficulty[p.difficulty] !== undefined) byDifficulty[p.difficulty] += 1;
    byPlatform[p.platform] = (byPlatform[p.platform] ?? 0) + 1;
    if (p.isPremium) premiumCount += 1;
  }

  return {
    passed: errors.length === 0,
    expectedTotal: EXPECTED_TOTAL,
    total: problems.length,
    byTopic,
    byDifficulty,
    byPlatform,
    duplicateIds,
    duplicateTitles,
    duplicateSlugs,
    missingFields: missingFields.slice(0, 50),
    invalidUrls: invalidUrls.slice(0, 50),
    missingMappings: missingMappings.slice(0, 50),
    numberingGaps,
    premiumCount,
    errors,
  };
}
