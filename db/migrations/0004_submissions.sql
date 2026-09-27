-- ---------------------------------------------------------------------------
-- 0004_submissions
--
-- One row per Submit. `user_problem_code` only ever holds the LATEST draft, so
-- without this table the history — how many tries a problem took, whether the
-- first attempt passed, which verdicts came back — is thrown away the moment
-- the next submission overwrites the draft. That history is the raw material
-- for per-topic strength/weakness estimates, so it is recorded from day one.
--
-- Rows are append-only: nothing in the app updates or deletes a submission.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS submissions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  problem_id   text NOT NULL REFERENCES problems(id) ON DELETE CASCADE,

  language     text NOT NULL,

  -- 'accepted' means every stored case passed. The rest are failure kinds,
  -- kept apart because they mean different things about the student: a
  -- compile error is a syntax gap, a wrong answer is a reasoning gap.
  verdict      text NOT NULL CHECK (verdict IN (
                 'accepted', 'wrong_answer', 'compile_error',
                 'runtime_error', 'timed_out'
               )),

  cases_passed integer NOT NULL DEFAULT 0 CHECK (cases_passed >= 0),
  cases_total  integer NOT NULL DEFAULT 0 CHECK (cases_total  >= 0),

  -- 1 for the first ever submission on this problem, 2 for the next, and so
  -- on. attempt_no = 1 AND verdict = 'accepted' is the first-try pass signal.
  attempt_no   integer NOT NULL DEFAULT 1 CHECK (attempt_no >= 1),

  -- True when the problem was already marked solved before this submission,
  -- so revision attempts can be told apart from first-time learning.
  solved_before boolean NOT NULL DEFAULT false,

  -- Total sandbox wall time across the cases that ran, in milliseconds. This
  -- is execution time, NOT how long the student thought about the problem.
  wall_time_ms integer NOT NULL DEFAULT 0 CHECK (wall_time_ms >= 0),

  source       text,

  created_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT submissions_source_size CHECK (source IS NULL OR length(source) <= 60000)
);

-- The submission feed on the dashboard, and "what has this user done lately".
CREATE INDEX IF NOT EXISTS idx_submissions_user_time
  ON submissions (user_id, created_at DESC);

-- Per-problem history for one user: attempt counting and the history panel.
CREATE INDEX IF NOT EXISTS idx_submissions_user_problem
  ON submissions (user_id, problem_id, created_at DESC);

-- Cross-user stats for a single problem (acceptance rate, common verdicts).
CREATE INDEX IF NOT EXISTS idx_submissions_problem
  ON submissions (problem_id, created_at DESC);
