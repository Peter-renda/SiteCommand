-- Pending signups: a paid-plan signup is staged here (NOT in `users`/`companies`)
-- until Stripe confirms the checkout is complete. Only then is the real account
-- materialized. This prevents accounts from being created for people who never
-- actually pay (e.g. they bail out of the Stripe checkout page).
CREATE TABLE IF NOT EXISTS pending_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  plan TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- One live pending signup per email; re-submitting refreshes it in place.
CREATE UNIQUE INDEX IF NOT EXISTS pending_signups_email_key
  ON pending_signups (lower(email));
