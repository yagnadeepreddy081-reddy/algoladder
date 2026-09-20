# AlgoLadder

A structured A-to-Z DSA preparation site: **474 curated problems** across 19 topics and 61
subtopics, with real progress tracking, spaced-repetition revision, notes, analytics, premium
access control and a full admin panel.

Built with Next.js 15 (App Router), TypeScript, Tailwind CSS v4 and PostgreSQL. No paid services
are required to run or deploy it.

---

## Contents

- [What this is — and what it deliberately is not](#what-this-is--and-what-it-deliberately-is-not)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Commands](#commands)
- [The 474-problem dataset](#the-474-problem-dataset)
- [What you must check yourself](#what-you-must-check-yourself)
- [Architecture](#architecture)
- [Database schema](#database-schema)
- [Authentication](#authentication)
- [Admin setup](#admin-setup)
- [Premium and payments](#premium-and-payments)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## What this is — and what it deliberately is not

AlgoLadder is an **independent study tracker**. It is not affiliated with, endorsed by, or derived
from any other DSA course, sheet or channel.

- **Problem titles** refer to publicly known coding problems. Every one links out to its page on
  LeetCode or GeeksforGeeks — the host site remains the authoritative statement.
- **All explanatory material is original to this project.** The descriptions, hints, approach
  write-ups and complexity notes were written from scratch for AlgoLadder. The hints and approaches
  are *pattern-level* teaching material (see `data/source/patterns.mjs`), not per-problem
  editorials, which is both a deliberate design decision and what keeps the project clean of
  anyone else's editorial content.
- **Problem statements, worked examples and constraints are not reproduced.** The problem page
  links out for those and says so.
- **Premium here locks AlgoLadder's own tooling** — analytics, study plans, the revision scheduler,
  company filters, exports. It never locks, mirrors or resells anybody else's paid material, and a
  problem marked premium still links to exactly the same public URL as a free one.

If you publish this, keep that footer on the landing page and keep the above true.

---

## Quick start

You need **Node 20.9+** and a **PostgreSQL 14+** database.

```bash
# 1. install
npm install

# 2. configure
cp .env.example .env.local
#    then edit .env.local — at minimum set DATABASE_URL and AUTH_SECRET
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"   # generates AUTH_SECRET

# 3. create the schema and load the 474 problems
npm run db:migrate
npm run db:seed

# 4. run it
npm run dev          # http://localhost:3000
```

Then sign up in the browser, and give yourself admin rights:

```bash
npm run admin:create -- your@email.com
```

Sign out and back in for the role to take effect — it is carried in the session token.

### Getting a free Postgres in two minutes

Either works, and both have a free tier:

- **Supabase** — create a project, then Project Settings → Database → Connection string → URI.
  Use the *session pooler* string. Set `PGSSLMODE=require`.
- **Neon** — create a project and copy the connection string from the dashboard.
  Set `PGSSLMODE=require`.

For a local server instead: `createdb algoladder` and use
`postgres://postgres:postgres@localhost:5432/algoladder` with `PGSSLMODE=disable`.

---

## Environment variables

Everything is documented inline in [`.env.example`](.env.example). The ones that matter:

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Any Postgres 14+ connection string. |
| `PGSSLMODE` | yes | `require` for hosted Postgres, `disable` for local. |
| `AUTH_SECRET` | yes | Signs session cookies. At least 32 random characters. |
| `AUTH_SESSION_DAYS` | no | Session lifetime, default 30. |
| `ADMIN_EMAILS` | no | Comma-separated. Anyone signing up with one of these becomes an admin. |
| `PREMIUM_TOPIC_SLUGS` | no | Topics seeded as premium. Default: `dynamic-programming,advanced-dsa`. |
| `MOCK_SUBSCRIPTIONS` | no | `true` lets you switch plans locally with no payment provider. |
| `PAYMENTS_ENABLED` | no | **Leave `false`.** Nothing charges a card while this is false. |
| `EMAIL_ENABLED` | no | `false` prints password-reset links to the server console instead of e-mailing them. |

---

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on :3000 |
| `npm run build` | **Validates the dataset, then builds.** The build fails if the dataset is not exactly 474 valid problems. |
| `npm start` | Production server (after `build`) |
| `npm run typecheck` | TypeScript across the app and the tests |
| `npm run validate-problems` | The dataset gate. Add `-- --json` for machine-readable output. |
| `npm run dataset:build` | Expands `data/source/roadmap.mjs` into `data/*.json` |
| `npm run dataset:check-urls` | Requests every external URL and reports the ones that do not resolve |
| `npm run db:migrate` | Applies `db/migrations/*.sql`. `-- --reset` drops everything first. |
| `npm run db:seed` | Loads the dataset into Postgres. `-- --prune` also deletes rows no longer in the dataset. |
| `npm run db:reset` | Reset + migrate + seed |
| `npm run admin:create -- you@example.com` | Grants admin. `--revoke` takes it away. |
| `npm test` | Unit + integration tests (Vitest) |
| `npm run test:e2e` | Browser tests (Playwright) |
| `npm run test:all` | Validation + unit + integration + browser |

---

## The 474-problem dataset

### Where it lives

```
data/
  source/
    roadmap.mjs      <- THE source of truth. Curation lives here.
    patterns.mjs     <- hints, approach write-ups and complexity per pattern
  topics.json        <- generated: 19 topics
  subtopics.json     <- generated: 61 subtopics
  problems.json      <- generated: exactly 474 problems
  problems.import-template.csv   <- blank template if you want to supply your own list
```

`roadmap.mjs` → `npm run dataset:build` → `data/*.json` → `npm run db:seed` → Postgres → the app.

The app never hardcodes problems anywhere else. One source, one pipeline.

### Editing the roadmap

Each problem is one line in `data/source/roadmap.mjs`:

```
'Title[@override]|Difficulty|pattern|tags|companies|description'
```

- **`@override`** controls the external URL. Omit it and the URL is built from the title
  (`Two Sum` → `https://leetcode.com/problems/two-sum/`). Otherwise use `@lc:slug`,
  `@gfg:path` or `@url:https://...`.
- **Difficulty** is `E`, `M` or `H`.
- **pattern** is a key from `patterns.mjs`, which supplies the hints, approach and complexity.
- **companies** uses `-` for none.

After editing:

```bash
npm run dataset:build
npm run validate-problems
npm run db:seed -- --prune
```

### The distribution

| # | Topic | Problems | | # | Topic | Problems |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Basics | 20 | | 11 | Sliding Window & Two Pointers | 20 |
| 2 | Sorting | 10 | | 12 | Heaps | 17 |
| 3 | Arrays | 40 | | 13 | Greedy Algorithms | 16 |
| 4 | Binary Search | 32 | | 14 | Binary Trees | 39 |
| 5 | Strings | 20 | | 15 | Binary Search Trees | 16 |
| 6 | Linked Lists | 31 | | 16 | Graphs | 54 |
| 7 | Recursion | 20 | | 17 | Dynamic Programming | 56 |
| 8 | Backtracking | 20 | | 18 | Tries | 7 |
| 9 | Bit Manipulation | 16 | | 19 | Advanced DSA | 10 |
| 10 | Stack and Queue | 30 | | | **Total** | **474** |

118 Easy, 270 Medium, 86 Hard. 450 LeetCode, 24 GeeksforGeeks.

### Validation

`npm run validate-problems` prints totals by topic, difficulty and platform, and checks:
total count is exactly 474 · unique IDs · non-empty titles · no duplicate titles, slugs or URLs ·
every problem has a topic and subtopic that exist and agree · valid difficulty · valid https URL ·
no placeholder titles · topic totals add to 474 · continuous numbering 1–474 overall and 1–n within
each topic.

It exits non-zero on failure, and `npm run build` runs it first — so **the build cannot succeed
with a broken dataset**. The same checks are available inside the app at
**Admin → Import / export → Run validation**, where they run against the live database.

---

## What you must check yourself

Three things are mine to flag rather than silently assert:

### 1. The external URLs — please verify before publishing

447 of the 474 URLs are **derived from the problem title** by slugifying it, which is how LeetCode
URLs are formed and is right for the overwhelming majority. It is still a derivation, not a fact I
can guarantee for every row.

```bash
npm run dataset:check-urls -- --out link-report.json
```

This requests every URL and lists the failures. Coding sites rate-limit and sometimes block
automated requests, so treat a failure as "look at this one", not proof it is dead. Fix any real
ones by adding a link override in `data/source/roadmap.mjs` and re-running
`npm run dataset:build`.

The 24 GeeksforGeeks entries use practice-problem paths that are more likely to drift than
LeetCode slugs — check those first.

### 2. The curation is mine, not an official list

You asked for a 474-problem A-to-Z roadmap. I could not scrape a copyrighted sheet, so **I authored
the selection**: 474 real, publicly available problems, ordered so each topic builds on the last.
It is a genuine roadmap, but it is AlgoLadder's roadmap.

If you have your own official list, you have two clean ways in:

- Edit `data/source/roadmap.mjs` and re-run the pipeline, or
- Fill in `data/problems.import-template.csv` and load it through
  **Admin → Import / export**.

Nothing in the app assumes my particular selection.

### 3. Company tags are indicative

The `companies` field carries widely reported associations between problems and interview
processes. They are commonly circulated, not sourced from any company. Treat them as a study aid,
and delete the field if you would rather not make the claim — the app works fine with it empty.

---

## Architecture

```
src/
  app/
    (auth)/            login, signup, forgot-password, reset-password
    (app)/             everything behind authentication
      dashboard/ problems/ topics/ bookmarks/ revision/ notes/
      study-plan/ analytics/ premium/ settings/ admin/
    api/export/        the user's own data, JSON or CSV
    api/admin/export/  the catalogue, JSON or CSV (admins only)
  components/          UI primitives, charts, nav, problem and admin components
  lib/
    db.ts              pooled Postgres access
    auth/              scrypt hashing, JWT session cookies, guards
    actions/           server actions: progress, notes, admin, subscription, …
    data/              read queries for problems, topics, dashboard, analytics
    filters.ts         URL ⇄ filter parsing and SQL building (pure, unit-tested)
    progress.ts        completion maths and streaks (pure, unit-tested)
    spaced-repetition.ts  the review scheduler (pure, unit-tested)
    premium.ts         access-control rules (pure, unit-tested)
    validate-dataset.ts   the in-app dataset validator
db/migrations/         SQL schema
scripts/               migrate, seed, validate, check-urls, create-admin
tests/                 unit, integration (real Postgres), e2e (real browser)
```

Design decisions worth knowing:

- **Server Components by default.** Client components are only where interaction demands them, and
  every mutation is a server action, so nothing trusts the client.
- **Filters live in the URL.** That is what makes them compose with each other and with sorting for
  free, and makes any view shareable and bookmarkable.
- **Pure logic is separated from I/O**, which is why the progress maths, filter building, scheduler
  and premium rules are all unit-testable without a database.
- **The search box is a real GET form.** It works with JavaScript disabled, and it sidesteps a
  Next.js quirk where a `router.push` issued from a debounce timer fires the request but does not
  reliably commit the navigation.

---

## Database schema

`db/migrations/0001_init.sql`. Fifteen tables, plus two views:

`users` · `profiles` · `topics` · `subtopics` · `problems` · `user_problem_progress` · `notes` ·
`bookmarks` · `revision_items` · `study_plans` · `study_plan_items` · `activity_logs` ·
`subscriptions` · `admin_users` · `reports` · `password_reset_tokens`

Constraints and indexes that matter:

- `user_problem_progress` has **`UNIQUE (user_id, problem_id)`** — exactly one progress record per
  user per problem, enforced by the database, not by application code.
- `problems` enforces unique `slug`, `title`, `overall_no` and `(topic_id, problem_no_in_topic)`.
- GIN indexes on `problems.tags` and `problems.companies` for the array filters; a
  `lower(title)` index for search; partial indexes for bookmarked and in-revision lookups.
- Everything user-owned cascades on account deletion.
- `user_daily_activity` and `user_topic_progress` views back the streak and topic-progress figures.

---

## Authentication

Built in, no third-party SDK:

- Passwords hashed with **scrypt** (N=16384, r=8, p=1), salted per user, stored as
  `scrypt$N$r$p$salt$hash` so the cost can be raised later without invalidating anyone.
- Sessions are **HS256 JWTs in an httpOnly, SameSite=Lax cookie**, verified against the database on
  every request. A `session_version` column means "sign out everywhere" and a password reset
  invalidate every existing token.
- Password reset tokens are stored **hashed**, single-use, and expire after an hour.
- Login and the forgot-password form return identical responses whether or not the account exists,
  so neither can be used to enumerate users.
- `requireUser()` and `requireAdmin()` guard server components; route handlers use `getApiUser()`.

With `EMAIL_ENABLED=false` (the default) the reset link is printed to the server console **and**
shown in the UI, so you can test the whole flow locally. Wire a real mail provider in
`requestPasswordResetAction` before you turn that on.

---

## Admin setup

```bash
npm run admin:create -- you@example.com                   # promote an existing account
npm run admin:create -- you@example.com --password 'Pw1'  # create a new admin account
npm run admin:create -- you@example.com --revoke          # take it away
```

Or set `ADMIN_EMAILS` before signing up.

The admin panel (`/admin`) gives you: add / edit / delete / reorder problems · change topic,
subtopic, difficulty and free-vs-premium · edit tags and links · JSON and CSV import and export ·
run dataset validation · user statistics · grant plans and admin rights · the reported-problems
queue.

Role-based access control is enforced server-side in the layout, before any admin data is queried —
a normal user hitting `/admin` is redirected, and `/api/admin/export` returns 403.

---

## Premium and payments

**No payment provider is wired up, and nothing can charge a card.**

- `MOCK_SUBSCRIPTIONS=true` (default) turns on a mock mode: from `/premium` you can start a trial
  or switch plans instantly, with no money involved, so you can exercise every premium path.
- `PAYMENTS_ENABLED=false` (default) makes the real checkout action refuse outright. Turning it on
  additionally requires `PAYMENT_PROVIDER` and provider keys, and you still have to implement the
  checkout and webhook yourself in `src/lib/actions/subscription.ts`.
- Admins always have full access without a subscription.

What premium gates: advanced analytics · custom study plans · the grading revision scheduler ·
company-wise filters · progress export · unlimited notes (free accounts get 25 problems) ·
the hints and approach on problems in premium topics — where the problem itself, its external
link and all progress tracking stay free, which is the free preview.

---

## Testing

```bash
npm test              # 133 unit + integration tests (Vitest)
npm run test:e2e      # 60 browser tests (Playwright, desktop + mobile)
npm run test:all      # everything, including the dataset gate
```

**Unit** (`tests/unit/`) — dataset integrity (count, duplicates, fields, URLs, mappings,
numbering, topic totals), progress maths, streaks, filter parsing and SQL building, the revision
scheduler, premium rules, password hashing.

**Integration** (`tests/integration/`) — runs against your real Postgres. Creates throwaway users
and cleans up after itself, so it is safe against a development database. Covers the seeded
catalogue, search and filters at the SQL level, the one-progress-row-per-user constraint, progress
persistence, topic progress maths, dashboard statistics, bookmarks, revisions, related problems and
premium gating on real rows.

**End-to-end** (`tests/e2e/`) — boots the real server and drives a real browser. Covers sign-up,
login, logout, the full password-reset flow, marking problems solved and the progress surviving a
refresh *and* a re-login, notes with code snippets, attempts and time, bookmarks, search, every
filter and sort, pagination, access control for signed-out users and non-admins, premium lock
screens, mock upgrades and trials, the admin panel including editing, reordering, import/export and
reports, and the mobile layout at phone width.

Playwright needs a browser: `npx playwright install chromium`. If you already have one, point
`PW_CHROMIUM_PATH` at it instead.

---

## Deployment

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for the full walkthrough. The short version, all on free tiers:

1. Create a Postgres database (Supabase or Neon).
2. Push this repository to GitHub.
3. Import it on Vercel.
4. Set `DATABASE_URL`, `PGSSLMODE=require`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`,
   `MOCK_SUBSCRIPTIONS=false`, `PAYMENTS_ENABLED=false` in the Vercel project.
5. Deploy, then run `npm run db:migrate && npm run db:seed` locally against the production
   `DATABASE_URL`.
6. `npm run admin:create -- you@example.com` against the same database.

---

## Troubleshooting

**"The database is not reachable yet" on the landing page** — `DATABASE_URL` is wrong or the server
is not running. The exact driver error is printed on that page.

**`npm run build` fails at validation** — the dataset is not exactly 474 valid problems. The output
names the problem. This is the gate working.

**Seeded, but the app shows fewer than 474** — you have rows from an older dataset. Run
`npm run db:seed -- --prune`.

**Nothing is marked premium** — set `PREMIUM_TOPIC_SLUGS` in `.env.local` *before* seeding, then
re-run `npm run db:seed`.

**Admin panel redirects you to the dashboard** — the role is carried in the session token. Sign out
and back in after `admin:create`.

**Password reset e-mail never arrives** — expected with `EMAIL_ENABLED=false`. The link is in the
server console and on screen.

**Playwright fails with chunk-loading errors** — a stale server is running on port 3100 from an
earlier build. Kill it; the config no longer reuses an existing server for exactly this reason.

---

Built for Surasani Yagnadeep Reddy.
