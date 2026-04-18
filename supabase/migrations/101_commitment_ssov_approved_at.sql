-- Commitments: track when a Subcontractor SOV review is approved.
--
-- Adds a timestamp so the Commitments UI can surface when the upstream
-- reviewer approved the SSOV (complementing ssov_notified_at / ssov_submitted_at).
-- The existing check constraint already allows 'approved' as an ssov_status
-- value; this column simply captures the timestamp for that transition.

ALTER TABLE commitments
  ADD COLUMN IF NOT EXISTS ssov_approved_at TIMESTAMPTZ;

NOTIFY pgrst, 'reload schema';
