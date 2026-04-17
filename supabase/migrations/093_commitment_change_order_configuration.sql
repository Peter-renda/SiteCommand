-- Commitments advanced change-order configuration settings
-- Aligns project-level commitment settings with Procore's configuration workflow.

ALTER TABLE commitment_settings
  ADD COLUMN IF NOT EXISTS number_of_change_order_tiers INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS allow_standard_users_create_ccos BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_standard_users_create_pcos BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS enable_field_initiated_change_orders BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE commitment_settings
  DROP CONSTRAINT IF EXISTS commitment_settings_number_of_change_order_tiers_check;

ALTER TABLE commitment_settings
  ADD CONSTRAINT commitment_settings_number_of_change_order_tiers_check
  CHECK (number_of_change_order_tiers IN (1, 2, 3));

NOTIFY pgrst, 'reload schema';
