-- Password reset tokens: a user who forgets their password requests a reset,
-- which stores a single-use, time-limited token (hashed — never the raw value)
-- keyed to their account. The emailed link carries the raw token; the reset
-- endpoint hashes the incoming value and matches it here.
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Look up an incoming reset by its hash.
CREATE UNIQUE INDEX IF NOT EXISTS password_reset_tokens_token_hash_key
  ON password_reset_tokens (token_hash);

-- Invalidate a user's prior outstanding resets when a new one is requested.
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx
  ON password_reset_tokens (user_id);
