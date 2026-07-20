-- Training sandbox: graded deliverable submissions.
--
-- Scheduled tasks that produce a document deliverable (gap log, submittal
-- register, pay application, owner report, …) are backed by a downloadable
-- Excel template (lib/training-deliverables.ts + public/training/templates/).
-- The trainee fills the template out and submits the completed workbook via
-- the deliverable workspace (/training/deliverable); where the deliverable has
-- a follow-up step, the submission also sends a simulated email (with the file
-- attached) to the named project personas. The workbook is AI-graded against
-- the definition's criteria and the grade shows next to the task in the Day
-- panel.
--
-- One row per (project, deliverable) — resubmitting regrades in place and
-- bumps attempts. deliverable_id is a free-text key matching
-- TrainingDeliverable.id (static content, not a database row) — same pattern
-- as training_scenario_outcomes / training_lesson_progress.

CREATE TABLE IF NOT EXISTS training_deliverable_submissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  deliverable_id    TEXT NOT NULL,
  user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  -- In-sim day the deliverable belongs to (TrainingDeliverable.day).
  day               INTEGER NOT NULL DEFAULT 0,
  -- The uploaded workbook (original filename + project-drawings storage path).
  file_name         TEXT NOT NULL DEFAULT '',
  file_storage_path TEXT NOT NULL DEFAULT '',
  -- Simulated-email recipients the file was sent to: [{ key, name, company }].
  sent_to           JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Optional trainee note included in the outbound email.
  note              TEXT NOT NULL DEFAULT '',
  -- Text extracted from the workbook, kept for audit / regrade context.
  extracted_text    TEXT NOT NULL DEFAULT '',
  -- Grade: 0-100 plus the derived letter (A+ … F).
  score             INTEGER,
  letter            TEXT NOT NULL DEFAULT '',
  -- { summary, strengths[], gaps[], criteria: [{ id, title, met, note }] }
  feedback          JSONB NOT NULL DEFAULT '{}'::jsonb,
  attempts          INTEGER NOT NULL DEFAULT 1,
  graded_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, deliverable_id)
);

CREATE INDEX IF NOT EXISTS idx_training_deliverable_submissions_project
  ON training_deliverable_submissions(project_id);
