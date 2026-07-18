-- Training: verifiable credentials ("SiteCommand Certified").
--
-- When a trainee's competency profile (lib/training-competency.ts — quizzes +
-- meeting checkpoints + scenario outcomes + phase reviews rolled up per skill)
-- meets the eligibility bar, they can issue themselves a credential. The row
-- snapshots the profile at issue time, and `code` is the public verification
-- slug served at /verify/[code] (no auth) so the credential can be linked from
-- a resume or LinkedIn profile. Re-issuing refreshes the snapshot but keeps
-- the same code, so shared links never break.

CREATE TABLE IF NOT EXISTS training_credentials (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Public verification slug, e.g. "SC-7K2M-9QX4". Unguessable, stable.
  code          TEXT NOT NULL UNIQUE,
  holder_name   TEXT NOT NULL,
  title         TEXT NOT NULL DEFAULT 'SiteCommand Certified — Construction Project Management',
  overall_level TEXT NOT NULL DEFAULT '',
  overall_score INTEGER NOT NULL DEFAULT 0,
  -- Snapshot of the skills profile at issue time:
  -- { skills: [{ key, label, score, level, evidence: [] }], stats: {...} }
  profile       JSONB NOT NULL DEFAULT '{}'::jsonb,
  issued_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_training_credentials_code
  ON training_credentials(code);
