-- Add ball_in_court_id to rfis table
ALTER TABLE rfis
  ADD COLUMN IF NOT EXISTS ball_in_court_id UUID REFERENCES directory_contacts(id) ON DELETE SET NULL;
