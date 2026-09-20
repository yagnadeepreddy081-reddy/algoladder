-- ===========================================================================
-- AlgoLadder — initial schema
-- Postgres 14+. Works unchanged on Supabase, Neon or a local server.
-- ===========================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;     -- case-insensitive e-mail

-- ---------------------------------------------------------------- enums ---
DO $$ BEGIN
  CREATE TYPE user_role        AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE difficulty_level AS ENUM ('Easy', 'Medium', 'Hard');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE progress_status  AS ENUM ('not_started', 'in_progress', 'solved', 'needs_revision');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE plan_tier        AS ENUM ('free', 'pro', 'lifetime');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sub_status       AS ENUM ('active', 'trialing', 'expired', 'canceled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE report_status    AS ENUM ('open', 'in_review', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------- helpers ---
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- 1. users
-- =========================================================================
CREATE TABLE IF NOT EXISTS users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           citext NOT NULL,
  password_hash   text   NOT NULL,
  role            user_role NOT NULL DEFAULT 'user',
  email_verified  boolean NOT NULL DEFAULT false,
  -- bumped on "sign out everywhere" and on password change, which invalidates
  -- every session token issued before the bump.
  session_version integer NOT NULL DEFAULT 1,
  last_login_at   timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_email_shape CHECK (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

CREATE INDEX IF NOT EXISTS idx_users_role       ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at DESC);

DROP TRIGGER IF EXISTS trg_users_updated ON users;
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================================
-- 2. profiles  (1:1 with users)
-- =========================================================================
CREATE TABLE IF NOT EXISTS profiles (
  user_id       uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name  text NOT NULL DEFAULT '',
  avatar_url    text,
  bio           text NOT NULL DEFAULT '',
  target_role   text NOT NULL DEFAULT '',
  target_date   date,
  daily_goal    integer NOT NULL DEFAULT 3 CHECK (daily_goal BETWEEN 1 AND 50),
  preferred_language text NOT NULL DEFAULT 'java',
  theme         text NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  timezone      text NOT NULL DEFAULT 'Asia/Kolkata',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================================
-- 3. topics
-- =========================================================================
CREATE TABLE IF NOT EXISTS topics (
  id           text PRIMARY KEY,
  slug         text NOT NULL,
  name         text NOT NULL,
  description  text NOT NULL DEFAULT '',
  icon         text NOT NULL DEFAULT 'circle',
  position     integer NOT NULL,
  is_premium   boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT topics_slug_unique     UNIQUE (slug),
  CONSTRAINT topics_position_unique UNIQUE (position)
);

CREATE INDEX IF NOT EXISTS idx_topics_position ON topics (position);

DROP TRIGGER IF EXISTS trg_topics_updated ON topics;
CREATE TRIGGER trg_topics_updated BEFORE UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================================
-- 4. subtopics
-- =========================================================================
CREATE TABLE IF NOT EXISTS subtopics (
  id           text PRIMARY KEY,
  topic_id     text NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  slug         text NOT NULL,
  name         text NOT NULL,
  description  text NOT NULL DEFAULT '',
  position     integer NOT NULL,
  is_premium   boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subtopics_slug_unique     UNIQUE (topic_id, slug),
  CONSTRAINT subtopics_position_unique UNIQUE (topic_id, position)
);

CREATE INDEX IF NOT EXISTS idx_subtopics_topic ON subtopics (topic_id, position);

DROP TRIGGER IF EXISTS trg_subtopics_updated ON subtopics;
CREATE TRIGGER trg_subtopics_updated BEFORE UPDATE ON subtopics
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================================
-- 5. problems
-- =========================================================================
CREATE TABLE IF NOT EXISTS problems (
  id                 text PRIMARY KEY,
  slug               text NOT NULL,
  title              text NOT NULL,

  topic_id           text NOT NULL REFERENCES topics(id)    ON DELETE RESTRICT,
  subtopic_id        text NOT NULL REFERENCES subtopics(id) ON DELETE RESTRICT,

  difficulty         difficulty_level NOT NULL,
  problem_no_in_topic integer NOT NULL CHECK (problem_no_in_topic > 0),
  overall_no          integer NOT NULL CHECK (overall_no > 0),
  recommended_order   integer NOT NULL CHECK (recommended_order > 0),

  description        text NOT NULL,
  platform           text NOT NULL DEFAULT 'LeetCode',
  external_url       text NOT NULL,
  video_url          text,

  tags               text[] NOT NULL DEFAULT '{}',
  companies          text[] NOT NULL DEFAULT '{}',

  is_premium         boolean NOT NULL DEFAULT false,
  is_revision        boolean NOT NULL DEFAULT false,
  is_active          boolean NOT NULL DEFAULT true,

  pattern            text NOT NULL DEFAULT '',
  pattern_name       text NOT NULL DEFAULT '',
  pattern_family     text NOT NULL DEFAULT '',
  hints              text[] NOT NULL DEFAULT '{}',
  approach           text NOT NULL DEFAULT '',
  time_complexity    text NOT NULL DEFAULT '',
  space_complexity   text NOT NULL DEFAULT '',

  io_format          jsonb,
  examples           jsonb NOT NULL DEFAULT '[]'::jsonb,
  constraints        text[] NOT NULL DEFAULT '{}',

  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT problems_slug_unique       UNIQUE (slug),
  CONSTRAINT problems_title_unique      UNIQUE (title),
  CONSTRAINT problems_overall_no_unique UNIQUE (overall_no),
  CONSTRAINT problems_topic_no_unique   UNIQUE (topic_id, problem_no_in_topic),
  CONSTRAINT problems_url_not_blank     CHECK (length(btrim(external_url)) > 0),
  CONSTRAINT problems_title_not_blank   CHECK (length(btrim(title)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_problems_topic       ON problems (topic_id, problem_no_in_topic);
CREATE INDEX IF NOT EXISTS idx_problems_subtopic    ON problems (subtopic_id);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty  ON problems (difficulty);
CREATE INDEX IF NOT EXISTS idx_problems_order       ON problems (recommended_order);
CREATE INDEX IF NOT EXISTS idx_problems_premium     ON problems (is_premium);
CREATE INDEX IF NOT EXISTS idx_problems_platform    ON problems (platform);
CREATE INDEX IF NOT EXISTS idx_problems_tags        ON problems USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_problems_companies   ON problems USING gin (companies);
-- Fast case-insensitive title search for the search box.
CREATE INDEX IF NOT EXISTS idx_problems_title_lower ON problems (lower(title) text_pattern_ops);

DROP TRIGGER IF EXISTS trg_problems_updated ON problems;
CREATE TRIGGER trg_problems_updated BEFORE UPDATE ON problems
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================================
-- 6. user_problem_progress   (exactly one row per user per problem)
-- =========================================================================
CREATE TABLE IF NOT EXISTS user_problem_progress (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  problem_id         text NOT NULL REFERENCES problems(id) ON DELETE CASCADE,

  status             progress_status NOT NULL DEFAULT 'not_started',
  is_bookmarked      boolean NOT NULL DEFAULT false,
  is_starred         boolean NOT NULL DEFAULT false,
  in_revision        boolean NOT NULL DEFAULT false,

  attempts           integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  time_spent_seconds integer NOT NULL DEFAULT 0 CHECK (time_spent_seconds >= 0),
  confidence         integer CHECK (confidence BETWEEN 1 AND 5),

  solution_url       text,
  custom_tags        text[] NOT NULL DEFAULT '{}',

  next_review_date   date,
  last_attempted_at  timestamptz,
  solved_at          timestamptz,

  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  -- THE constraint the brief calls for: one progress record per user/problem.
  CONSTRAINT upp_user_problem_unique UNIQUE (user_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_upp_user            ON user_problem_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_upp_user_status     ON user_problem_progress (user_id, status);
CREATE INDEX IF NOT EXISTS idx_upp_user_bookmark   ON user_problem_progress (user_id) WHERE is_bookmarked;
CREATE INDEX IF NOT EXISTS idx_upp_user_revision   ON user_problem_progress (user_id) WHERE in_revision;
CREATE INDEX IF NOT EXISTS idx_upp_review_due      ON user_problem_progress (user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_upp_solved_at       ON user_problem_progress (user_id, solved_at DESC);
CREATE INDEX IF NOT EXISTS idx_upp_custom_tags     ON user_problem_progress USING gin (custom_tags);

DROP TRIGGER IF EXISTS trg_upp_updated ON user_problem_progress;
CREATE TRIGGER trg_upp_updated BEFORE UPDATE ON user_problem_progress
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================================
-- 7. notes   (many notes + code snippets per user per problem)
-- =========================================================================
CREATE TABLE IF NOT EXISTS notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  problem_id  text NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  title       text NOT NULL DEFAULT '',
  content     text NOT NULL DEFAULT '',
  code        text NOT NULL DEFAULT '',
  language    text NOT NULL DEFAULT 'java',
  is_private  boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notes_not_empty CHECK (length(btrim(content)) > 0 OR length(btrim(code)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_notes_user         ON notes (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_user_problem ON notes (user_id, problem_id);

DROP TRIGGER IF EXISTS trg_notes_updated ON notes;
CREATE TRIGGER trg_notes_updated BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================================
-- 8. bookmarks
-- =========================================================================
CREATE TABLE IF NOT EXISTS bookmarks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  problem_id text NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  folder     text NOT NULL DEFAULT 'default',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bookmarks_unique UNIQUE (user_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks (user_id, created_at DESC);

-- =========================================================================
-- 9. revision_items   (spaced repetition schedule)
-- =========================================================================
CREATE TABLE IF NOT EXISTS revision_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  problem_id       text NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  due_date         date NOT NULL DEFAULT CURRENT_DATE,
  interval_days    integer NOT NULL DEFAULT 1 CHECK (interval_days > 0),
  ease             numeric(4,2) NOT NULL DEFAULT 2.50 CHECK (ease >= 1.30),
  review_count     integer NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  lapses           integer NOT NULL DEFAULT 0 CHECK (lapses >= 0),
  last_reviewed_at timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT revision_items_unique UNIQUE (user_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_revision_due ON revision_items (user_id, due_date);

DROP TRIGGER IF EXISTS trg_revision_updated ON revision_items;
CREATE TRIGGER trg_revision_updated BEFORE UPDATE ON revision_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================================
-- 10. study_plans + study_plan_items
-- =========================================================================
CREATE TABLE IF NOT EXISTS study_plans (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name             text NOT NULL,
  description      text NOT NULL DEFAULT '',
  start_date       date NOT NULL DEFAULT CURRENT_DATE,
  end_date         date,
  problems_per_day integer NOT NULL DEFAULT 3 CHECK (problems_per_day BETWEEN 1 AND 50),
  topic_ids        text[] NOT NULL DEFAULT '{}',
  difficulties     text[] NOT NULL DEFAULT '{}',
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT study_plans_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_study_plans_user ON study_plans (user_id, is_active);

DROP TRIGGER IF EXISTS trg_study_plans_updated ON study_plans;
CREATE TRIGGER trg_study_plans_updated BEFORE UPDATE ON study_plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS study_plan_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id        uuid NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  problem_id     text NOT NULL REFERENCES problems(id)    ON DELETE CASCADE,
  scheduled_date date NOT NULL,
  position       integer NOT NULL DEFAULT 0,
  completed      boolean NOT NULL DEFAULT false,
  CONSTRAINT study_plan_items_unique UNIQUE (plan_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_plan_items_plan ON study_plan_items (plan_id, scheduled_date, position);

-- =========================================================================
-- 11. activity_logs   (streaks, weekly activity, recent activity feed)
-- =========================================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id         bigserial PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  problem_id text REFERENCES problems(id) ON DELETE SET NULL,
  action     text NOT NULL,
  metadata   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_user_time   ON activity_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_user_action ON activity_logs (user_id, action, created_at DESC);

-- =========================================================================
-- 12. subscriptions   (one per user)
-- =========================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan                 plan_tier  NOT NULL DEFAULT 'free',
  status               sub_status NOT NULL DEFAULT 'active',
  trial_ends_at        timestamptz,
  current_period_end   timestamptz,
  provider             text NOT NULL DEFAULT 'mock',
  provider_customer_id text,
  provider_sub_id      text,
  granted_by           uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_user_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions (status, current_period_end);

DROP TRIGGER IF EXISTS trg_subscriptions_updated ON subscriptions;
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================================
-- 13. admin_users   (audit trail on top of users.role)
-- =========================================================================
CREATE TABLE IF NOT EXISTS admin_users (
  user_id     uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  granted_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  permissions text[] NOT NULL DEFAULT ARRAY['problems:write','users:read','subscriptions:write','reports:write'],
  note        text NOT NULL DEFAULT '',
  granted_at  timestamptz NOT NULL DEFAULT now()
);

-- =========================================================================
-- 14. reports   (users flagging a broken link or wrong classification)
-- =========================================================================
CREATE TABLE IF NOT EXISTS reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id)    ON DELETE SET NULL,
  problem_id  text REFERENCES problems(id) ON DELETE CASCADE,
  reason      text NOT NULL,
  details     text NOT NULL DEFAULT '',
  status      report_status NOT NULL DEFAULT 'open',
  resolved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_problem ON reports (problem_id);

-- =========================================================================
-- 15. password_reset_tokens
-- =========================================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT prt_token_unique UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS idx_prt_user ON password_reset_tokens (user_id, expires_at DESC);

-- =========================================================================
-- Views used by the dashboard / analytics pages
-- =========================================================================

-- One row per user per day they did anything. Drives streaks + weekly chart.
CREATE OR REPLACE VIEW user_daily_activity AS
SELECT
  user_id,
  (created_at AT TIME ZONE 'UTC')::date AS activity_date,
  count(*)                                                       AS events,
  count(*) FILTER (WHERE action = 'solved')                      AS solved,
  count(*) FILTER (WHERE action = 'attempted')                   AS attempted,
  count(*) FILTER (WHERE action = 'reviewed')                    AS reviewed
FROM activity_logs
GROUP BY user_id, (created_at AT TIME ZONE 'UTC')::date;

-- Per-user, per-topic completion. The topic page and analytics read this.
CREATE OR REPLACE VIEW user_topic_progress AS
SELECT
  u.id                                                            AS user_id,
  t.id                                                            AS topic_id,
  t.slug                                                          AS topic_slug,
  t.name                                                          AS topic_name,
  t.position                                                      AS topic_position,
  count(p.id)                                                     AS total,
  count(*) FILTER (WHERE pr.status = 'solved')                    AS solved,
  count(*) FILTER (WHERE pr.status = 'in_progress')               AS in_progress,
  count(*) FILTER (WHERE pr.status = 'needs_revision')            AS needs_revision,
  count(*) FILTER (WHERE p.difficulty = 'Easy')                   AS easy_total,
  count(*) FILTER (WHERE p.difficulty = 'Easy'   AND pr.status = 'solved') AS easy_solved,
  count(*) FILTER (WHERE p.difficulty = 'Medium')                 AS medium_total,
  count(*) FILTER (WHERE p.difficulty = 'Medium' AND pr.status = 'solved') AS medium_solved,
  count(*) FILTER (WHERE p.difficulty = 'Hard')                   AS hard_total,
  count(*) FILTER (WHERE p.difficulty = 'Hard'   AND pr.status = 'solved') AS hard_solved
FROM users u
CROSS JOIN topics t
JOIN problems p ON p.topic_id = t.id AND p.is_active
LEFT JOIN user_problem_progress pr ON pr.problem_id = p.id AND pr.user_id = u.id
GROUP BY u.id, t.id, t.slug, t.name, t.position;
