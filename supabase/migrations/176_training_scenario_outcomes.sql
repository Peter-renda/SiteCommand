-- Training sandbox: graded scenario outcomes (the "competency spine").
--
-- The PM sandbox plants real decision points in the inbox feed and meetings
-- (lib/training-scenarios.ts): a rental invoice with a deliberate overbilling,
-- a missing lien waiver holding a payment, a long-lead switchgear release, an
-- elevator submittal fab-slot deadline, failed compaction tests, etc. This
-- table closes the loop on those plants: one row per (project, scenario)
-- recording whether the trainee actually handled the decision (status
-- handled/missed), the judge's note, and the evidence it was scored from.
--
-- Rows are written by lib/training-scenario-eval.ts, which runs on day
-- advance once a scenario's deadline day passes. The same rows feed:
--   - the consequence layer (a missed scenario delivers a delayed
--     consequence email into the sandbox inbox — decisions ripple), and
--   - the per-skill competency profile (lib/training-competency.ts).
--
-- scenario_id is a free-text key matching TrainingScenario.id (static
-- content, not a database row) — same pattern as training_lesson_progress.

CREATE TABLE IF NOT EXISTS training_scenario_outcomes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scenario_id  TEXT NOT NULL,
  -- handled | missed
  status       TEXT NOT NULL DEFAULT 'missed',
  -- One-sentence judge note on how the trainee handled (or missed) it.
  note         TEXT NOT NULL DEFAULT '',
  -- Snippet of the evidence the score was based on (trainee emails / tasks).
  evidence     TEXT NOT NULL DEFAULT '',
  -- In-sim day the evaluation ran on.
  evaluated_day INTEGER NOT NULL DEFAULT 0,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Set when the ripple email (consequence or confirmation) was delivered.
  consequence_delivered_at TIMESTAMPTZ,
  UNIQUE (project_id, scenario_id)
);

CREATE INDEX IF NOT EXISTS idx_training_scenario_outcomes_project
  ON training_scenario_outcomes(project_id);
