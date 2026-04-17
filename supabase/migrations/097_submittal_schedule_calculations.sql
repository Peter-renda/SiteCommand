ALTER TABLE submittals
  ADD COLUMN IF NOT EXISTS design_team_review_time INT,
  ADD COLUMN IF NOT EXISTS internal_review_time INT,
  ADD COLUMN IF NOT EXISTS planned_return_date DATE,
  ADD COLUMN IF NOT EXISTS planned_internal_review_completed_date DATE,
  ADD COLUMN IF NOT EXISTS planned_submit_by_date DATE,
  ADD COLUMN IF NOT EXISTS submitter_due_date DATE,
  ADD COLUMN IF NOT EXISTS approver_due_date DATE;
