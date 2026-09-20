# The AlgoLadder dataset

Everything the app knows about problems comes from here. Nothing is hardcoded in components.

```
source/roadmap.mjs      curation: 19 topics, 61 subtopics, 474 problem rows
source/patterns.mjs     hints, approach write-ups and complexity, keyed by pattern
        ↓  npm run dataset:build
topics.json             19 topics
subtopics.json          61 subtopics
problems.json           exactly 474 problems  ← what the seed script reads
        ↓  npm run db:seed
Postgres                ← what the app reads
```

Also here, generated for convenience and not read by the app:

- **`problems.csv`** — the full dataset as a spreadsheet, if you would rather edit it in Excel or
  Sheets than in JavaScript.
- **`problems.import-template.csv`** — the same columns with three worked rows and some blanks, for
  supplying your own list.

---

## Editing the roadmap (the normal route)

Open `source/roadmap.mjs`. Each problem is one pipe-delimited line:

```js
'Two Sum|E|hashing|Hashing,Arrays|Amazon,Google|Return the indices of the two numbers that add up to a target, using one pass and a value-to-index map.'
```

| Field | Meaning |
| --- | --- |
| `Title` | Real, publicly known problem title. Must be unique across all 474. |
| `[@override]` | Optional, appended to the title. Controls the URL — see below. |
| `Difficulty` | `E`, `M` or `H` |
| `pattern` | A key from `source/patterns.mjs`. Supplies the hints, approach and complexity. |
| `tags` | Comma separated |
| `companies` | Comma separated, or `-` for none |
| `description` | One original sentence. Do not paste the host site's statement. |

**URL overrides**, appended to the title:

| Written as | Produces |
| --- | --- |
| *(nothing)* | `https://leetcode.com/problems/<kebab-case-title>/` |
| `@lc:two-sum-ii` | `https://leetcode.com/problems/two-sum-ii/` |
| `@gfg:aggressive-cows/1` | `https://www.geeksforgeeks.org/problems/aggressive-cows/1` |
| `@url:https://example.com/x` | exactly that |

Then:

```bash
npm run dataset:build        # regenerate the JSON
npm run validate-problems    # 10 checks, fails loudly
npm run db:seed -- --prune   # push to Postgres
```

Adding or removing a problem changes the count, and the build gate expects exactly 474. Either keep
the count, or change `EXPECTED_TOTAL` in **both** `scripts/validate-problems.mjs` and
`src/lib/validate-dataset.ts`.

---

## Supplying your own list instead

Two routes, both fine:

**CSV via the admin panel.** Fill in `problems.import-template.csv`, convert it to JSON (any
online CSV-to-JSON tool, or a few lines of Node), and paste it into
**Admin → Import / export → Import problems**. Existing IDs are updated, new ones inserted, and the
whole import runs in one transaction so a bad row rolls the lot back.

**Directly in the roadmap.** Replace the rows in `source/roadmap.mjs` and re-run the pipeline. This
is the better option if the list is going to keep changing, because it keeps the dataset in version
control.

### Column reference

| Column | Required | Notes |
| --- | --- | --- |
| `id` | yes | Stable unique key, e.g. `al-0001` |
| `slug` | yes | Unique. Lowercase letters, digits and hyphens |
| `title` | yes | Unique |
| `topicId` / `subtopicId` | yes | Must exist, and the subtopic must belong to the topic |
| `difficulty` | yes | `Easy`, `Medium` or `Hard` |
| `problemNoInTopic` | yes | 1..n within its topic, continuous |
| `overallNo` | yes | 1..474, unique, continuous |
| `recommendedOrder` | yes | Usually the same as `overallNo` |
| `description` | yes | Your own words |
| `platform` | yes | `LeetCode`, `GeeksforGeeks`, `CodeStudio`, `HackerRank`, `InterviewBit`, `Codeforces` |
| `externalUrl` | yes | Valid https URL, unique |
| `videoUrl` | no | Only if you have the right to link it |
| `tags`, `companies` | no | Semicolon-separated in CSV, arrays in JSON |
| `isPremium`, `isRevision` | no | Booleans |
| `pattern`, `patternName` | no | Drives the hints and approach |
| `timeComplexity`, `spaceComplexity` | no | e.g. `O(n log n)` |

---

## A note on what is in here

The problem **titles** refer to publicly known problems, and every `externalUrl` points at the host
site, which remains the authoritative statement.

The **descriptions, hints, approaches and complexity notes are original to AlgoLadder**. The hints
and approaches are pattern-level teaching material in `source/patterns.mjs` rather than per-problem
editorials — deliberately, both because pattern recognition is the thing worth learning and because
it keeps this project clear of anyone else's editorial content.

Problem statements, worked examples and constraints are **not** reproduced. The problem page links
out for those and says so.

If you add content here, keep that true.
