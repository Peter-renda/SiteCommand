-- Fix change_events.created_by FK to point to users(id) instead of auth.users(id)

ALTER TABLE change_events
  DROP CONSTRAINT IF EXISTS change_events_created_by_fkey;

ALTER TABLE change_events
  ADD CONSTRAINT change_events_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
