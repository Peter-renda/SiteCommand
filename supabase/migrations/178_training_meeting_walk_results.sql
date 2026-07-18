-- Training meetings: timed site-walk Q&A results.
--
-- The recurring OAC meetings (lib/training-meetings.ts, days 30/60) end with a
-- site walk where the owner and architect quiz the PM about recent/upcoming
-- work under a 30-second clock. Each answer is graded when the minutes are
-- generated: FULL credit (1.0) for a substantively correct on-the-spot answer,
-- HALF credit (0.5) for correctly telling the asker where the information
-- lives, none for expired/vague/wrong. Results persist on the meeting's
-- minutes row alongside the checkpoint scoring.

ALTER TABLE training_meeting_minutes
  -- [{ id, title, question, credit: 'full'|'half'|'none', note, answer,
  --    elapsedMs, expired, skill }]
  ADD COLUMN IF NOT EXISTS walk_results JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS walk_points  NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS walk_total   INTEGER NOT NULL DEFAULT 0;
