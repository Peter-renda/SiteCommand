-- Meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  meeting_number integer NOT NULL,
  title text NOT NULL,
  series text,
  overview text,
  date timestamptz,
  end_date timestamptz,
  location text,
  status text NOT NULL DEFAULT 'scheduled',
  agenda_items_count integer NOT NULL DEFAULT 0,
  template text,
  is_locked boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, meeting_number)
);

CREATE INDEX IF NOT EXISTS meetings_project_id_idx ON meetings(project_id);
CREATE INDEX IF NOT EXISTS meetings_deleted_at_idx ON meetings(deleted_at);
