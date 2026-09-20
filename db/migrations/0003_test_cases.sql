-- ---------------------------------------------------------------------------
-- 0003_test_cases
--
-- Test cases belong to the problem, not to the user, so they live beside the
-- rest of the statement and are replaced wholesale by every seed run.
--
-- Shape: [{ "input": "...", "expected": "...", "hidden": false }]
-- `hidden` cases still run, but the UI shows only pass/fail — enough to stop
-- someone hard-coding the answers, without pretending this is a contest judge.
-- ---------------------------------------------------------------------------

ALTER TABLE problems
  ADD COLUMN IF NOT EXISTS test_cases jsonb NOT NULL DEFAULT '[]'::jsonb;
