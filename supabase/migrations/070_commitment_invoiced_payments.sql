-- Add invoiced and payments_issued columns to commitments table

ALTER TABLE commitments
  ADD COLUMN IF NOT EXISTS invoiced NUMERIC(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payments_issued NUMERIC(15,2) NOT NULL DEFAULT 0;
