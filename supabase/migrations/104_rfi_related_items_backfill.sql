-- Backfill: migration 098 tried to add `official_response_id` and
-- `related_items` in a single ALTER TABLE. When the FK on
-- `official_response_id` failed in some environments the whole
-- statement rolled back, leaving `related_items` missing too.
-- Migration 103 recovered `official_response_id`; this migration
-- recovers `related_items` for any environment that missed it,
-- and asks PostgREST to reload its schema cache so the column is
-- visible to the API layer immediately.

ALTER TABLE rfis
  ADD COLUMN IF NOT EXISTS related_items JSONB DEFAULT '[]'::jsonb;

UPDATE rfis SET related_items = '[]'::jsonb WHERE related_items IS NULL;

NOTIFY pgrst, 'reload schema';
