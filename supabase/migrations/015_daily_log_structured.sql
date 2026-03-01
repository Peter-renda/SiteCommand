ALTER TABLE daily_logs
  ADD COLUMN IF NOT EXISTS note_entries        JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS weather_observations JSONB NOT NULL DEFAULT '[]';
