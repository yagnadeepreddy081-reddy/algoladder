-- ---------------------------------------------------------------------------
-- 0002_code_playground
--
-- The in-browser playground keeps one draft per user, per problem, per
-- language, so switching between Python and C++ on the same problem does not
-- throw away what you already wrote. Drafts are scratch work — they are
-- deliberately separate from `notes`, which is the deliberate, saved record.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_problem_code (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  problem_id text NOT NULL REFERENCES problems(id) ON DELETE CASCADE,

  language   text NOT NULL,
  source     text NOT NULL DEFAULT '',
  stdin      text NOT NULL DEFAULT '',

  run_count  integer NOT NULL DEFAULT 0 CHECK (run_count >= 0),
  last_run_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT upc_user_problem_language_unique UNIQUE (user_id, problem_id, language),
  CONSTRAINT upc_source_size CHECK (length(source) <= 60000),
  CONSTRAINT upc_stdin_size  CHECK (length(stdin)  <= 20000)
);

CREATE INDEX IF NOT EXISTS upc_user_problem_idx ON user_problem_code (user_id, problem_id);
