CREATE TABLE IF NOT EXISTS prime_contract_settings (
  project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  number_of_change_order_tiers INTEGER NOT NULL DEFAULT 2,
  allow_standard_users_create_pccos BOOLEAN NOT NULL DEFAULT false,
  allow_standard_users_create_pcos BOOLEAN NOT NULL DEFAULT true,
  enable_always_editable_sov BOOLEAN NOT NULL DEFAULT false,
  show_financial_markup_on_change_order_pdf BOOLEAN NOT NULL DEFAULT false,
  show_financial_markup_on_invoice_exports BOOLEAN NOT NULL DEFAULT false,
  default_prime_contract_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  default_prime_contract_change_order_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  default_prime_contract_potential_change_order_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION set_prime_contract_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prime_contract_settings_updated_at ON prime_contract_settings;
CREATE TRIGGER trg_prime_contract_settings_updated_at
BEFORE UPDATE ON prime_contract_settings
FOR EACH ROW
EXECUTE FUNCTION set_prime_contract_settings_updated_at();

NOTIFY pgrst, 'reload schema';
