-- Add invoiced_date and paid_date to change_orders for payment tracking.
ALTER TABLE change_orders
  ADD COLUMN IF NOT EXISTS invoiced_date DATE,
  ADD COLUMN IF NOT EXISTS paid_date DATE,
  ADD COLUMN IF NOT EXISTS reviewer TEXT NOT NULL DEFAULT '';

NOTIFY pgrst, 'reload schema';
