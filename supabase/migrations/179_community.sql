-- Community hub (linked under Career Center).
--
-- Five surfaces for trainees / PMs to connect:
--   1. Discussion boards      — community_posts + community_post_replies
--   2. Mentorship matching    — community_mentorship_profiles (opt in as
--                               mentor or mentee; matched by focus + region)
--   3. Office hours           — community_office_hours + …_signups (experienced
--                               PMs host time slots; members reserve a seat)
--   4. Regional networking    — community_region_members (join a region, see
--                               who else is nearby)
--   5. Leaderboard            — derived at read time from the existing training
--                               tables (no new table); ranks users by their
--                               simulation performance.

-- ── 1. Discussion boards ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_name  TEXT NOT NULL,
  category     TEXT NOT NULL DEFAULT 'general',
  title        TEXT NOT NULL,
  body         TEXT NOT NULL DEFAULT '',
  reply_count  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_community_posts_category
  ON community_posts(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_recent
  ON community_posts(updated_at DESC);

CREATE TABLE IF NOT EXISTS community_post_replies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_community_post_replies_post
  ON community_post_replies(post_id, created_at);

-- ── 2. Mentorship matching ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_mentorship_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name     TEXT NOT NULL,
  role             TEXT NOT NULL DEFAULT 'mentee',  -- 'mentor' | 'mentee'
  years_experience INTEGER NOT NULL DEFAULT 0,
  focus_areas      JSONB NOT NULL DEFAULT '[]'::jsonb,  -- string[]
  region           TEXT NOT NULL DEFAULT '',
  bio              TEXT NOT NULL DEFAULT '',
  contact          TEXT NOT NULL DEFAULT '',
  available        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);
CREATE INDEX IF NOT EXISTS idx_community_mentorship_role
  ON community_mentorship_profiles(role);

-- ── 3. Office hours ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_office_hours (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  host_name        TEXT NOT NULL,
  host_title       TEXT NOT NULL DEFAULT '',
  topic            TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  starts_at        TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  capacity         INTEGER NOT NULL DEFAULT 5,
  meeting_link     TEXT NOT NULL DEFAULT '',
  region           TEXT NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_community_office_hours_start
  ON community_office_hours(starts_at);

CREATE TABLE IF NOT EXISTS community_office_hour_signups (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES community_office_hours(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name  TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, user_id)
);

-- ── 4. Regional networking ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_region_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  region       TEXT NOT NULL,
  city         TEXT NOT NULL DEFAULT '',
  headline     TEXT NOT NULL DEFAULT '',
  contact      TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);
CREATE INDEX IF NOT EXISTS idx_community_region_members_region
  ON community_region_members(region);
