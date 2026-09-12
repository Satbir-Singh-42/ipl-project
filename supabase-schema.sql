-- =====================================================
-- IPL AUCTION 2025 - ROBUST SUPABASE DATABASE SCHEMA
-- =====================================================
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
-- =====================================================


-- 0. TOURNAMENTS & ROOMS TABLE (Multi-Tenancy SaaS Core)
CREATE TABLE IF NOT EXISTS tournaments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  room_code VARCHAR(12) NOT NULL,
  description TEXT DEFAULT '',
  currency_symbol TEXT DEFAULT '₹',
  currency_code TEXT DEFAULT 'INR',
  is_locked BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false,
  room_password TEXT DEFAULT '',
  admin_password TEXT DEFAULT 'admin123',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Idempotently add new columns if table already exists
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS room_password TEXT DEFAULT '';
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS admin_password TEXT DEFAULT 'admin123';
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS created_by UUID;

-- Ensure Unique Constraints on tournaments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournaments_slug_key') THEN
    ALTER TABLE tournaments ADD CONSTRAINT tournaments_slug_key UNIQUE (slug);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournaments_room_code_key') THEN
    ALTER TABLE tournaments ADD CONSTRAINT tournaments_room_code_key UNIQUE (room_code);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tournaments_room_code ON tournaments(room_code);
CREATE INDEX IF NOT EXISTS idx_tournaments_slug ON tournaments(slug);
CREATE INDEX IF NOT EXISTS idx_tournaments_created_by ON tournaments(created_by);

-- Enable RLS for tournaments
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tournaments are viewable by everyone" ON tournaments;
CREATE POLICY "Tournaments are viewable by everyone"
  ON tournaments FOR SELECT USING (true);

-- NOTE: The insert/update/delete policies for tournaments are defined further
-- below in the "ROW LEVEL SECURITY POLICIES" section, AFTER the users_meta
-- table exists, because the owner/admin checks reference users_meta.

-- Insert Default Tournament #1 (IPL 2025 Mega Auction)
INSERT INTO tournaments (id, name, slug, room_code, description, currency_symbol, currency_code)
OVERRIDING SYSTEM VALUE
VALUES (1, 'IPL 2025 Mega Auction', 'ipl-2025', 'IPL2025', 'Official IPL 2025 Mega Player Auction', '₹', 'INR')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  room_code = EXCLUDED.room_code;


-- 1. POOLS TABLE (Auction Sets & Rounds)
CREATE TABLE IF NOT EXISTS pools (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE DEFAULT 1,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pools ADD COLUMN IF NOT EXISTS tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_pools_tournament_id ON pools(tournament_id);
CREATE INDEX IF NOT EXISTS idx_pools_order ON pools(order_index);


-- 2. PLAYERS TABLE
CREATE TABLE IF NOT EXISTS players (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE DEFAULT 1,
  pool_id BIGINT REFERENCES pools(id) ON DELETE SET NULL,
  auction_order INTEGER DEFAULT 0,
  name TEXT NOT NULL,
  age INTEGER,
  country TEXT DEFAULT 'India',
  t20_matches INTEGER DEFAULT 0,
  runs INTEGER,
  batting_sr NUMERIC,
  wickets INTEGER,
  economy NUMERIC,
  eval_points INTEGER DEFAULT 0,
  base_price NUMERIC DEFAULT 400000,
  role TEXT NOT NULL CHECK (role IN ('Batsman', 'Bowler', 'All Rounder', 'Wicket Keeper')),
  image_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sold', 'unsold')),
  sold_price NUMERIC DEFAULT 0,
  sold_to_team TEXT,
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE players ADD COLUMN IF NOT EXISTS tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE DEFAULT 1;
ALTER TABLE players ADD COLUMN IF NOT EXISTS pool_id BIGINT REFERENCES pools(id) ON DELETE SET NULL;
ALTER TABLE players ADD COLUMN IF NOT EXISTS auction_order INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_players_tournament_id ON players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_players_pool_id ON players(pool_id);
CREATE INDEX IF NOT EXISTS idx_players_auction_order ON players(auction_order);
CREATE INDEX IF NOT EXISTS idx_players_status ON players(status);
CREATE INDEX IF NOT EXISTS idx_players_sold_to_team ON players(sold_to_team);
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);


-- 3. TEAMS TABLE
CREATE TABLE IF NOT EXISTS teams (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE DEFAULT 1,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  logo_url TEXT,
  border_color TEXT,
  bg_gradient TEXT,
  starting_budget NUMERIC DEFAULT 10000000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE teams ADD COLUMN IF NOT EXISTS tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE DEFAULT 1;

-- Ensure unique constraint on (tournament_id, slug)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_tournament_team_slug') THEN
    ALTER TABLE teams ADD CONSTRAINT unique_tournament_team_slug UNIQUE (tournament_id, slug);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_teams_tournament_id ON teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_teams_slug ON teams(slug);


-- 4. AUCTION LOG TABLE
CREATE TABLE IF NOT EXISTS auction_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE DEFAULT 1,
  player_id BIGINT REFERENCES players(id) ON DELETE SET NULL,
  player_name TEXT NOT NULL,
  team_name TEXT,
  action TEXT NOT NULL CHECK (action IN ('sold', 'unsold', 'undo')),
  final_price NUMERIC DEFAULT 0,
  performed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE auction_log ADD COLUMN IF NOT EXISTS tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_auction_log_tournament_id ON auction_log(tournament_id);
CREATE INDEX IF NOT EXISTS idx_auction_log_created ON auction_log(created_at DESC);


-- 5. USERS META TABLE (Auth: admins & room organizers)
CREATE TABLE IF NOT EXISTS users_meta (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  auth_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  username TEXT,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'organizer' CHECK (role IN ('admin','organizer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Idempotently add username column if the table already existed
ALTER TABLE users_meta ADD COLUMN IF NOT EXISTS username TEXT;

-- Allow 'organizer' role on pre-existing tables (drop old inline check, re-add widened one)
DO $$
BEGIN
  ALTER TABLE users_meta DROP CONSTRAINT IF EXISTS users_meta_role_check;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_meta_role_ck') THEN
    ALTER TABLE users_meta ADD CONSTRAINT users_meta_role_ck CHECK (role IN ('admin','organizer'));
  END IF;
END $$;

-- Ensure unique email for public sign-ups
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_meta_email_key') THEN
    ALTER TABLE users_meta ADD CONSTRAINT users_meta_email_key UNIQUE (email);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_meta_auth_id ON users_meta(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_meta_email ON users_meta(email);


-- 6. PLAYING XI TABLE
CREATE TABLE IF NOT EXISTS playing_xi (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE DEFAULT 1,
  team_slug TEXT NOT NULL,
  player_id BIGINT REFERENCES players(id) ON DELETE CASCADE,
  selected_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE playing_xi ADD COLUMN IF NOT EXISTS tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE DEFAULT 1;

-- Ensure unique constraint on (tournament_id, team_slug, player_id)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_tournament_team_player') THEN
    ALTER TABLE playing_xi ADD CONSTRAINT unique_tournament_team_player UNIQUE (tournament_id, team_slug, player_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_playing_xi_tournament_id ON playing_xi(tournament_id);
CREATE INDEX IF NOT EXISTS idx_playing_xi_team ON playing_xi(team_slug);


-- 7. AUCTION SETTINGS & SQUAD RULES TABLE
CREATE TABLE IF NOT EXISTS auction_settings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE DEFAULT 1,
  max_players INTEGER NOT NULL DEFAULT 15,
  min_players INTEGER NOT NULL DEFAULT 11,
  max_overseas INTEGER NOT NULL DEFAULT 7,
  min_indians INTEGER NOT NULL DEFAULT 8,
  playing_xi_total INTEGER NOT NULL DEFAULT 11,
  playing_xi_max_overseas INTEGER NOT NULL DEFAULT 4,
  batsmen_min INTEGER NOT NULL DEFAULT 2,
  batsmen_max INTEGER NOT NULL DEFAULT 5,
  wk_min INTEGER NOT NULL DEFAULT 1,
  wk_max INTEGER NOT NULL DEFAULT 3,
  all_rounders_min INTEGER NOT NULL DEFAULT 1,
  bowlers_min INTEGER NOT NULL DEFAULT 2,
  starting_budget NUMERIC NOT NULL DEFAULT 10000000,
  default_base_price NUMERIC NOT NULL DEFAULT 400000,
  bid_increment NUMERIC NOT NULL DEFAULT 100000,
  teams_qualifying INTEGER NOT NULL DEFAULT 8,
  auto_advance_delay_ms INTEGER NOT NULL DEFAULT 1000,
  enable_captain_multiplier BOOLEAN NOT NULL DEFAULT true,
  captain_multiplier NUMERIC NOT NULL DEFAULT 2.0,
  vice_captain_multiplier NUMERIC NOT NULL DEFAULT 1.5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE auction_settings ADD COLUMN IF NOT EXISTS tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE DEFAULT 1;
ALTER TABLE auction_settings ADD COLUMN IF NOT EXISTS enable_captain_multiplier BOOLEAN DEFAULT true;
ALTER TABLE auction_settings ADD COLUMN IF NOT EXISTS captain_multiplier NUMERIC DEFAULT 2.0;
ALTER TABLE auction_settings ADD COLUMN IF NOT EXISTS vice_captain_multiplier NUMERIC DEFAULT 1.5;

-- Ensure unique constraint on tournament_id for auction_settings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_tournament_settings') THEN
    ALTER TABLE auction_settings ADD CONSTRAINT unique_tournament_settings UNIQUE (tournament_id);
  END IF;
END $$;

-- Enable Row Level Security immediately
ALTER TABLE auction_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auction settings are viewable by everyone" ON auction_settings;
CREATE POLICY "Auction settings are viewable by everyone"
  ON auction_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Auction settings can be updated" ON auction_settings;
CREATE POLICY "Auction settings can be updated"
  ON auction_settings FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert Default Row for Tournament 1
INSERT INTO auction_settings (tournament_id) VALUES (1) ON CONFLICT (tournament_id) DO NOTHING;

-- PERFORMANCE INDEXES (High-speed multi-tenancy & filtered queries)
CREATE INDEX IF NOT EXISTS idx_pools_tournament_id ON pools(tournament_id);
CREATE INDEX IF NOT EXISTS idx_players_tournament_id ON players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_players_status ON players(status);
CREATE INDEX IF NOT EXISTS idx_players_pool_id ON players(pool_id);
CREATE INDEX IF NOT EXISTS idx_teams_tournament_id ON teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_auction_log_tournament_id ON auction_log(tournament_id);
CREATE INDEX IF NOT EXISTS idx_playing_xi_tournament_id ON playing_xi(tournament_id);
CREATE INDEX IF NOT EXISTS idx_auction_settings_tournament_id ON auction_settings(tournament_id);



-- AUTO-UPDATE TIMESTAMPS
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS players_updated_at ON players;
CREATE TRIGGER players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS teams_updated_at ON teams;
CREATE TRIGGER teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS auction_settings_updated_at ON auction_settings;
CREATE TRIGGER auction_settings_updated_at
  BEFORE UPDATE ON auction_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ROW LEVEL SECURITY POLICIES
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE playing_xi ENABLE ROW LEVEL SECURITY;
ALTER TABLE pools ENABLE ROW LEVEL SECURITY;

-- Players
DROP POLICY IF EXISTS "Players are viewable by everyone" ON players;
CREATE POLICY "Players are viewable by everyone" ON players FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert players" ON players;
CREATE POLICY "Anyone can insert players" ON players FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update players" ON players;
CREATE POLICY "Anyone can update players" ON players FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can delete players" ON players;
CREATE POLICY "Anyone can delete players" ON players FOR DELETE USING (true);

-- Teams
DROP POLICY IF EXISTS "Teams are viewable by everyone" ON teams;
CREATE POLICY "Teams are viewable by everyone" ON teams FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert teams" ON teams;
CREATE POLICY "Anyone can insert teams" ON teams FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update teams" ON teams;
CREATE POLICY "Anyone can update teams" ON teams FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can delete teams" ON teams;
CREATE POLICY "Anyone can delete teams" ON teams FOR DELETE USING (true);

-- Auction Log
DROP POLICY IF EXISTS "Auction log is viewable by everyone" ON auction_log;
CREATE POLICY "Auction log is viewable by everyone" ON auction_log FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert auction log" ON auction_log;
CREATE POLICY "Anyone can insert auction log" ON auction_log FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update auction log" ON auction_log;
CREATE POLICY "Anyone can update auction log" ON auction_log FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can delete auction log" ON auction_log;
CREATE POLICY "Anyone can delete auction log" ON auction_log FOR DELETE USING (true);

-- Users Meta
DROP POLICY IF EXISTS "Users can read their own meta" ON users_meta;
CREATE POLICY "Users can read their own meta" ON users_meta FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert users_meta (sign-up)" ON users_meta;
CREATE POLICY "Anyone can insert users_meta (sign-up)" ON users_meta FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update users_meta" ON users_meta;
CREATE POLICY "Anyone can update users_meta" ON users_meta FOR UPDATE USING (true) WITH CHECK (true);

-- Tournaments (owner/admin enforcement — placed here so users_meta exists)
-- Only registered (authenticated) users can create rooms, and the room is
-- automatically owned by the signed-up user who created it.
DROP POLICY IF EXISTS "Registered users can create tournament rooms" ON tournaments;
DROP POLICY IF EXISTS "Authenticated users can insert tournaments" ON tournaments;
CREATE POLICY "Registered users can create tournament rooms"
  ON tournaments FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- The room creator (or a users_meta admin) can update their own rooms.
DROP POLICY IF EXISTS "Room owner or admin can update tournaments" ON tournaments;
DROP POLICY IF EXISTS "Authenticated users can update tournaments" ON tournaments;
CREATE POLICY "Room owner or admin can update tournaments"
  ON tournaments FOR UPDATE
  USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM users_meta WHERE auth_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM users_meta WHERE auth_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Room owner or admin can delete tournaments" ON tournaments;
DROP POLICY IF EXISTS "Authenticated users can delete tournaments" ON tournaments;
CREATE POLICY "Room owner or admin can delete tournaments"
  ON tournaments FOR DELETE
  USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM users_meta WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- Playing XI
DROP POLICY IF EXISTS "Playing XI is viewable by everyone" ON playing_xi;
CREATE POLICY "Playing XI is viewable by everyone" ON playing_xi FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert playing XI" ON playing_xi;
CREATE POLICY "Anyone can insert playing XI" ON playing_xi FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update playing XI" ON playing_xi;
CREATE POLICY "Anyone can update playing XI" ON playing_xi FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can delete playing XI" ON playing_xi;
CREATE POLICY "Anyone can delete playing XI" ON playing_xi FOR DELETE USING (true);

-- Pools
DROP POLICY IF EXISTS "Public pools view" ON pools;
CREATE POLICY "Public pools view" ON pools FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert pools" ON pools;
CREATE POLICY "Anyone can insert pools" ON pools FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update pools" ON pools;
CREATE POLICY "Anyone can update pools" ON pools FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can delete pools" ON pools;
CREATE POLICY "Anyone can delete pools" ON pools FOR DELETE USING (true);


-- ENABLE REALTIME REPLICATION (Drop first to prevent duplicate table error)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE tournaments;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE players;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE teams;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE pools;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE auction_settings;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;


-- STORAGE BUCKETS CONFIGURATION
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('player-images', 'player-images', true),
  ('team-logos', 'team-logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public player images access" ON storage.objects;
CREATE POLICY "Public player images access" ON storage.objects FOR SELECT USING (bucket_id = 'player-images');

DROP POLICY IF EXISTS "Public team logos access" ON storage.objects;
CREATE POLICY "Public team logos access" ON storage.objects FOR SELECT USING (bucket_id = 'team-logos');

DROP POLICY IF EXISTS "Allow upload player images" ON storage.objects;
CREATE POLICY "Allow upload player images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'player-images');

DROP POLICY IF EXISTS "Allow update player images" ON storage.objects;
CREATE POLICY "Allow update player images" ON storage.objects FOR UPDATE USING (bucket_id = 'player-images');

DROP POLICY IF EXISTS "Allow delete player images" ON storage.objects;
CREATE POLICY "Allow delete player images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'player-images');

DROP POLICY IF EXISTS "Allow upload team logos" ON storage.objects;
CREATE POLICY "Allow upload team logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'team-logos');

DROP POLICY IF EXISTS "Allow update team logos" ON storage.objects;
CREATE POLICY "Allow update team logos" ON storage.objects FOR UPDATE USING (bucket_id = 'team-logos');

DROP POLICY IF EXISTS "Allow delete team logos" ON storage.objects;
CREATE POLICY "Allow delete team logos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'team-logos');


-- SEED 12 TEAMS (TOURNAMENT 1)
INSERT INTO teams (tournament_id, name, slug, logo_url, border_color, bg_gradient, starting_budget) VALUES
  (1, 'Sunrisers Hyderabad', 'sunrisers-hyderabad', '/images/teams/srh.webp', 'border-[#F26522]', 'bg-[linear-gradient(135deg,rgba(242,101,34,0.95)_0%,rgba(200,80,25,0.85)_45%,rgba(160,65,20,0.9)_100%)]', 10000000),
  (1, 'Chennai Super Kings', 'chennai-super-kings', '/images/teams/csk.jpg', 'border-[#F9CD00]', 'bg-[linear-gradient(135deg,rgba(180,140,0,0.95)_0%,rgba(140,110,0,0.85)_45%,rgba(100,80,0,0.9)_100%)]', 10000000),
  (1, 'Rajasthan Royals', 'rajasthan-royals', '/images/teams/rr.png', 'border-[#EA1A8C]', 'bg-[linear-gradient(135deg,rgba(234,26,140,0.95)_0%,rgba(190,20,115,0.85)_45%,rgba(150,15,90,0.9)_100%)]', 10000000),
  (1, 'Delhi Capitals', 'delhi-capitals', '/images/teams/dc.jpg', 'border-[#004C97]', 'bg-[linear-gradient(135deg,rgba(0,76,151,0.95)_0%,rgba(0,60,120,0.85)_45%,rgba(0,45,95,0.9)_100%)]', 10000000),
  (1, 'Punjab Kings', 'punjab-kings', '/images/teams/pbks.png', 'border-[#C8102E]', 'bg-[linear-gradient(135deg,rgba(200,16,46,0.95)_0%,rgba(160,10,35,0.85)_45%,rgba(120,8,25,0.9)_100%)]', 10000000),
  (1, 'Indore Titans', 'indore-titans', '/images/teams/it.png', 'border-[#0074D9]', 'bg-[linear-gradient(135deg,rgba(0,116,217,0.95)_0%,rgba(0,90,170,0.85)_45%,rgba(0,70,130,0.9)_100%)]', 10000000),
  (1, 'Lucknow Giants', 'lucknow-giants', '/images/teams/lsg.png', 'border-[#0097A7]', 'bg-[linear-gradient(135deg,rgba(0,151,167,0.95)_0%,rgba(0,120,135,0.85)_45%,rgba(0,90,110,0.9)_100%)]', 10000000),
  (1, 'Royal Challengers Bengaluru', 'royal-challengers-bengaluru', '/images/teams/rcb.jpg', 'border-[#DA1212]', 'bg-[linear-gradient(135deg,rgba(218,18,18,0.95)_0%,rgba(180,15,15,0.85)_45%,rgba(140,10,10,0.9)_100%)]', 10000000),
  (1, 'Goa Gladiators', 'goa-gladiators', '/images/teams/gg.png', 'border-[#00BCD4]', 'bg-[linear-gradient(135deg,rgba(0,188,212,0.95)_0%,rgba(0,150,170,0.85)_45%,rgba(0,120,140,0.9)_100%)]', 10000000),
  (1, 'Gujarat Titans', 'gujarat-titans', '/images/teams/gt.png', 'border-[#0A1931]', 'bg-[linear-gradient(135deg,rgba(10,25,49,0.95)_0%,rgba(7,20,40,0.85)_45%,rgba(5,15,30,0.9)_100%)]', 10000000),
  (1, 'Kolkata Night Riders', 'kolkata-night-riders', '/images/teams/kkr.jpeg', 'border-[#3E1F47]', 'bg-[linear-gradient(135deg,rgba(62,31,71,0.95)_0%,rgba(45,20,55,0.85)_45%,rgba(30,15,40,0.9)_100%)]', 10000000),
  (1, 'Mumbai Indians', 'mumbai-indians', '/images/teams/mi.jpg', 'border-[#045093]', 'bg-[linear-gradient(135deg,rgba(4,80,147,0.95)_0%,rgba(2,50,93,0.85)_45%,rgba(1,30,70,0.9)_100%)]', 10000000)
ON CONFLICT (tournament_id, slug) DO NOTHING;

-- SYNCHRONIZE PRIMARY KEY SEQUENCES
-- Prevents "duplicate key value violates unique constraint" errors on new inserts
SELECT setval(pg_get_serial_sequence('tournaments', 'id'), COALESCE(MAX(id), 1)) FROM tournaments;
SELECT setval(pg_get_serial_sequence('pools', 'id'), COALESCE(MAX(id), 1)) FROM pools;
SELECT setval(pg_get_serial_sequence('players', 'id'), COALESCE(MAX(id), 1)) FROM players;
SELECT setval(pg_get_serial_sequence('teams', 'id'), COALESCE(MAX(id), 1)) FROM teams;
SELECT setval(pg_get_serial_sequence('auction_log', 'id'), COALESCE(MAX(id), 1)) FROM auction_log;
SELECT setval(pg_get_serial_sequence('playing_xi', 'id'), COALESCE(MAX(id), 1)) FROM playing_xi;
SELECT setval(pg_get_serial_sequence('auction_settings', 'id'), COALESCE(MAX(id), 1)) FROM auction_settings;


-- =====================================================
-- DEFAULT PLAYER TEMPLATE SEED (166 IPL 2025 players)
-- Source: players_rows.sql
-- Shared default player list used as the template that is
-- offered to every tournament room. Uses explicit IDs so the
-- same set is referenced by the front-end DEFAULT_PLAYERS.
-- Idempotent: re-running does not duplicate rows.
-- =====================================================
INSERT INTO "public"."players" ("id", "tournament_id", "pool_id", "auction_order", "name", "age", "country", "t20_matches", "runs", "batting_sr", "wickets", "economy", "eval_points", "base_price", "role", "image_url", "status", "sold_price", "sold_to_team", "sold_at", "created_at", "updated_at") OVERRIDING SYSTEM VALUE VALUES (12, 1, null, 0, 'Jasprit Bumrah', 31, 'India', 250, null, null, 322, '7.4', 89, '400000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/9.png', 'pending', '0', null, null, '2026-09-09 08:05:47.941091+00', '2026-09-09 08:05:47.941091+00'), (13, 1, null, 0, 'Shubman Gill', 26, 'India', 170, 5305, null, null, null, 86, '400000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/62.png', 'pending', '0', null, null, '2026-09-09 08:05:48.253846+00', '2026-09-09 08:05:48.253846+00'), (14, 1, null, 0, 'Arshdeep Singh', 26, 'India', 120, null, null, 160, '7.5', 87, '400000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/125.png', 'pending', '0', null, null, '2026-09-09 08:05:48.543203+00', '2026-09-09 08:05:48.543203+00'), (15, 1, null, 0, 'Hardik Pandya', 32, 'India', 250, 4500, null, 160, '8.1', 88, '400000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/54.png', 'pending', '0', null, null, '2026-09-09 08:05:48.833693+00', '2026-09-09 08:05:48.833693+00'), (16, 1, null, 0, 'Virat Kohli', 37, 'India', 414, 13543, null, null, null, 86, '400000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/2.png', 'pending', '0', null, null, '2026-09-09 08:05:49.150471+00', '2026-09-09 08:05:49.150471+00'), (17, 1, null, 0, 'Rashid Khan', 25, 'Afghanistan', 500, null, null, 681, '6.8', 85, '400000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/218.png', 'pending', '0', null, null, '2026-09-09 08:05:49.448673+00', '2026-09-09 08:05:49.448673+00'), (18, 1, null, 0, 'Rishabh Pant', 28, 'India', 220, 6800, null, null, null, 86, '400000', 'Wicket Keeper', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/18.png', 'pending', '0', null, null, '2026-09-09 08:05:49.731997+00', '2026-09-09 08:05:49.731997+00'), (19, 1, null, 0, 'Rohit Sharma', 38, 'India', 463, 12248, null, null, null, 85, '400000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/6.png', 'pending', '0', null, null, '2026-09-09 08:05:50.02921+00', '2026-09-09 08:05:50.02921+00'), (20, 1, null, 0, 'Travis Head', 30, 'Australia', 150, 4800, null, null, null, 84, '400000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/37.png', 'pending', '0', null, null, '2026-09-09 08:05:50.342776+00', '2026-09-09 08:05:50.342776+00'), (21, 1, null, 0, 'Shreyas Iyer', 29, 'India', 240, 6578, null, null, null, 84, '400000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/12.png', 'pending', '0', null, null, '2026-09-09 08:05:50.623755+00', '2026-09-09 08:05:50.623755+00'), (22, 1, null, 0, 'Mitchell Starc', 34, 'Australia', 153, null, null, 207, '7.8', 84, '400000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/31.png', 'pending', '0', null, null, '2026-09-09 08:05:50.916135+00', '2026-09-09 08:05:50.916135+00'), (23, 1, null, 0, 'Kagiso Rabada', 28, 'South Africa', 229, null, null, 290, '7.9', 84, '400000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/116.png', 'pending', '0', null, null, '2026-09-09 08:05:51.215765+00', '2026-09-09 08:05:51.215765+00'), (24, 1, null, 0, 'Abhishek Sharma', 24, 'India', 80, 2300, null, 50, '8.2', 85, '400000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/212.png', 'pending', '0', null, null, '2026-09-09 08:05:51.509099+00', '2026-09-09 08:05:51.509099+00'), (25, 1, null, 0, 'KL Rahul', 31, 'India', 250, 8200, null, null, null, 86, '400000', 'Wicket Keeper', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/19.png', 'pending', '0', null, null, '2026-09-09 08:05:51.826392+00', '2026-09-09 08:05:51.826392+00'), (26, 1, null, 0, 'Heinrich Klaasen', 32, 'South Africa', 180, 5000, null, null, null, 84, '400000', 'Wicket Keeper', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/202.png', 'pending', '0', null, null, '2026-09-09 08:05:52.128657+00', '2026-09-09 08:05:52.128657+00'), (27, 1, null, 0, 'Yashasvi Jaiswal', 22, 'India', 118, 3537, null, null, null, 84, '400000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/533.png', 'pending', '0', null, null, '2026-09-09 08:05:52.416981+00', '2026-09-09 08:05:52.416981+00'), (28, 1, null, 0, 'Jofra Archer', 29, 'England', 180, null, null, 220, '7.5', 83, '400000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/181.png', 'pending', '0', null, null, '2026-09-09 08:05:52.698679+00', '2026-09-09 08:05:52.698679+00'), (29, 1, null, 0, 'Yuzvendra Chahal', 33, 'India', 326, null, null, 380, '7.1', 85, '400000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/10.png', 'pending', '0', null, null, '2026-09-09 08:05:52.974604+00', '2026-09-09 08:05:52.974604+00'), (30, 1, null, 0, 'Ravindra Jadeja', 35, 'India', 300, 5500, null, 220, '7.4', 84, '400000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/46.png', 'pending', '0', null, null, '2026-09-09 08:05:53.263173+00', '2026-09-09 08:05:53.263173+00'), (31, 1, null, 0, 'Shivam Dube', 30, 'India', 180, 3800, null, 100, '8.5', 83, '400000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/211.png', 'pending', '0', null, null, '2026-09-09 08:05:53.56756+00', '2026-09-09 08:05:53.56756+00'), (32, 1, null, 0, 'Faf du Plessis', 41, 'South Africa', 424, 11906, null, null, null, 83, '400000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/94.png', 'pending', '0', null, null, '2026-09-09 08:05:53.846751+00', '2026-09-09 08:05:53.846751+00'), (33, 1, null, 0, 'Suryakumar Yadav', 35, 'India', 335, 8700, null, null, null, 85, '400000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/174.png', 'pending', '0', null, null, '2026-09-09 08:05:54.147369+00', '2026-09-09 08:05:54.147369+00'), (34, 1, null, 0, 'Pat Cummins', 31, 'Australia', 171, null, null, 192, '8', 84, '400000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/33.png', 'pending', '0', null, null, '2026-09-09 08:05:54.428501+00', '2026-09-09 08:05:54.428501+00'), (35, 1, null, 0, 'Trent Boult', 34, 'New Zealand', 282, null, null, 350, '7.6', 84, '400000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/66.png', 'pending', '0', null, null, '2026-09-09 08:05:54.704547+00', '2026-09-09 08:05:54.704547+00'), (36, 1, null, 0, 'Mohammed Shami', 34, 'India', 176, null, null, 210, '8.2', 84, '400000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/47.png', 'pending', '0', null, null, '2026-09-09 08:05:54.991909+00', '2026-09-09 08:05:54.991909+00'), (37, 1, null, 0, 'Harry Brook', 25, 'England', 140, 3900, null, null, null, 78, '300000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2024/1218.png', 'pending', '0', null, null, '2026-09-09 08:05:55.296566+00', '2026-09-09 08:05:55.296566+00'), (38, 1, null, 0, 'Will Jacks', 25, 'England', 100, 2800, null, null, null, 79, '300000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/1941.png', 'pending', '0', null, null, '2026-09-09 08:05:55.639939+00', '2026-09-09 08:05:55.639939+00'), (39, 1, null, 0, 'Ruturaj Gaikwad', 27, 'India', 150, 5000, null, null, null, 81, '300000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/102.png', 'pending', '0', null, null, '2026-09-09 08:05:55.942678+00', '2026-09-09 08:05:55.942678+00'), (40, 1, null, 0, 'David Warner', 37, 'Australia', 424, 13595, null, null, null, 80, '300000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2024/214.png', 'pending', '0', null, null, '2026-09-09 08:05:56.222721+00', '2026-09-09 08:05:56.222721+00'), (41, 1, null, 0, 'Jonny Bairstow', 34, 'England', 230, 7600, null, null, null, 78, '300000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/216.png', 'pending', '0', null, null, '2026-09-09 08:05:56.513127+00', '2026-09-09 08:05:56.513127+00'), (42, 1, null, 0, 'Kane Williamson', 34, 'New Zealand', 270, 8400, null, null, null, 80, '300000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2024/65.png', 'pending', '0', null, null, '2026-09-09 08:05:56.809495+00', '2026-09-09 08:05:56.809495+00'), (43, 1, null, 0, 'Nehal Wadhera', 23, 'India', 56, 1043, null, null, null, 78, '300000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/1541.png', 'pending', '0', null, null, '2026-09-09 08:05:57.091827+00', '2026-09-09 08:05:57.091827+00'), (44, 1, null, 0, 'Rinku Singh', 26, 'India', 167, 3225, null, null, null, 80, '300000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/152.png', 'pending', '0', null, null, '2026-09-09 08:05:57.373546+00', '2026-09-09 08:05:57.373546+00'), (45, 1, null, 0, 'Aiden Markram', 30, 'South Africa', 200, 5000, null, null, null, 80, '300000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/287.png', 'pending', '0', null, null, '2026-09-09 08:05:57.656464+00', '2026-09-09 08:05:57.656464+00'), (46, 1, null, 0, 'Steve Smith', 34, 'Australia', 270, 8000, null, null, null, 78, '300000', 'Batsman', 'https://documents.iplt20.com/playerheadshot/ipl/284/271.png', 'pending', '0', null, null, '2026-09-09 08:05:57.935038+00', '2026-09-09 08:05:57.935038+00'), (47, 1, null, 0, 'Devdutt Padikkal', 23, 'India', 90, 2500, null, null, null, 78, '300000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/200.png', 'pending', '0', null, null, '2026-09-09 08:05:58.229367+00', '2026-09-09 08:05:58.229367+00'), (48, 1, null, 0, 'Sai Sudharsan', 23, 'India', 60, 2271, null, null, null, 79, '300000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/976.png', 'pending', '0', null, null, '2026-09-09 08:05:58.540437+00', '2026-09-09 08:05:58.540437+00'), (49, 1, null, 0, 'Tilak Varma', 21, 'India', 80, 2500, null, null, null, 79, '300000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/993.png', 'pending', '0', null, null, '2026-09-09 08:05:58.84714+00', '2026-09-09 08:05:58.84714+00'), (50, 1, null, 0, 'Dewald Brevis', 22, 'South Africa', 15, 400, null, null, null, 79, '300000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/797.png', 'pending', '0', null, null, '2026-09-09 08:05:59.131678+00', '2026-09-09 08:05:59.131678+00'), (51, 1, null, 0, 'Alex Hales', 34, 'England', 320, 9700, null, null, null, 77, '300000', 'Batsman', 'https://documents.iplt20.com/playerheadshot/ipl/284/511.png', 'pending', '0', null, null, '2026-09-09 08:05:59.415458+00', '2026-09-09 08:05:59.415458+00'), (52, 1, null, 0, 'Rajat Patidar', 32, 'India', 27, 799, null, null, null, 79, '300000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/597.png', 'pending', '0', null, null, '2026-09-09 08:05:59.702884+00', '2026-09-09 08:05:59.702884+00'), (53, 1, null, 0, 'David Miller', 36, 'South Africa', 450, 9500, null, null, null, 78, '300000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2024/128.png', 'pending', '0', null, null, '2026-09-09 08:05:59.982586+00', '2026-09-09 08:05:59.982586+00'), (54, 1, null, 0, 'Ramandeep Singh', 28, 'India', 77, 687, null, null, null, 78, '300000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2024/991.png', 'pending', '0', null, null, '2026-09-09 08:06:00.263507+00', '2026-09-09 08:06:00.263507+00'), (55, 1, null, 0, 'Prithvi Shaw', 26, 'India', 117, 2850, null, null, null, 76, '300000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2024/51.png', 'pending', '0', null, null, '2026-09-09 08:06:00.544475+00', '2026-09-09 08:06:00.544475+00'), (56, 1, null, 0, 'Tristan Stubbs', 25, 'South Africa', 50, 1000, null, null, null, 77, '300000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/1017.png', 'pending', '0', null, null, '2026-09-09 08:06:00.834723+00', '2026-09-09 08:06:00.834723+00'), (57, 1, null, 0, 'Sarfaraz Khan', 26, 'India', 95, 2400, null, null, null, 76, '300000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2023/139.png', 'pending', '0', null, null, '2026-09-09 08:06:01.121836+00', '2026-09-09 08:06:01.121836+00'), (58, 1, null, 0, 'Shimron Hetmyer', 28, 'West Indies', 200, 3700, null, null, null, 78, '300000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/210.png', 'pending', '0', null, null, '2026-09-09 08:06:01.472609+00', '2026-09-09 08:06:01.472609+00'), (59, 1, null, 0, 'Joe Root', 34, 'England', 110, 3500, null, null, null, 75, '300000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2023/312.png', 'pending', '0', null, null, '2026-09-09 08:06:01.755946+00', '2026-09-09 08:06:01.755946+00'), (60, 1, null, 0, 'Nitish Rana', 30, 'India', 200, 4800, null, null, null, 78, '300000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/148.png', 'pending', '0', null, null, '2026-09-09 08:06:02.080657+00', '2026-09-09 08:06:02.080657+00'), (61, 1, null, 0, 'Rachin Ravindra', 25, 'New Zealand', 80, 2300, null, null, null, 77, '300000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/724.png', 'pending', '0', null, null, '2026-09-09 08:06:02.394471+00', '2026-09-09 08:06:02.394471+00'), (62, 1, null, 0, 'Shai Hope', 31, 'West Indies', 150, 4200, null, null, null, 75, '300000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2024/268.png', 'pending', '0', null, null, '2026-09-09 08:06:02.704098+00', '2026-09-09 08:06:02.704098+00'), (63, 1, null, 0, 'Rovman Powell', 30, 'West Indies', 160, 4800, null, null, null, 76, '300000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/329.png', 'pending', '0', null, null, '2026-09-09 08:06:02.995748+00', '2026-09-09 08:06:02.995748+00'), (64, 1, null, 0, 'Rilee Rossouw', 35, 'South Africa', 170, 6000, null, null, null, 75, '300000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2024/1426.png', 'pending', '0', null, null, '2026-09-09 08:06:03.300337+00', '2026-09-09 08:06:03.300337+00'), (65, 1, null, 0, 'Shahrukh Khan', 30, 'India', 60, 900, null, null, null, 78, '300000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/590.png', 'pending', '0', null, null, '2026-09-09 08:06:03.724967+00', '2026-09-09 08:06:03.724967+00'), (66, 1, null, 0, 'Priyansh Arya', 24, 'India', 35, 1048, null, null, null, 76, '300000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/3573.png', 'pending', '0', null, null, '2026-09-09 08:06:04.022623+00', '2026-09-09 08:06:04.022623+00'), (67, 1, null, 0, 'Manish Pandey', 35, 'India', 260, 6000, null, null, null, 73, '200000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/16.png', 'pending', '0', null, null, '2026-09-09 08:06:04.313527+00', '2026-09-09 08:06:04.313527+00'), (68, 1, null, 0, 'Shaik Rasheed', 21, 'India', 10, 150, null, null, null, 73, '200000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2024/778.png', 'pending', '0', null, null, '2026-09-09 08:06:04.617996+00', '2026-09-09 08:06:04.617996+00'), (69, 1, null, 0, 'Abhinav Manohar', 31, 'India', 30, 500, null, null, null, 73, '200000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/974.png', 'pending', '0', null, null, '2026-09-09 08:06:04.89886+00', '2026-09-09 08:06:04.89886+00'), (70, 1, null, 0, 'Karun Nair', 32, 'India', 100, 2300, null, null, null, 74, '200000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/131.png', 'pending', '0', null, null, '2026-09-09 08:06:05.181321+00', '2026-09-09 08:06:05.181321+00'), (71, 1, null, 0, 'Ajinkya Rahane', 36, 'India', 210, 5200, null, null, null, 75, '200000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/44.png', 'pending', '0', null, null, '2026-09-09 08:06:05.465528+00', '2026-09-09 08:06:05.465528+00'), (72, 1, null, 0, 'Anmolpreet Singh', 25, 'India', 80, 2000, null, null, null, 72, '200000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2024/159.png', 'pending', '0', null, null, '2026-09-09 08:06:05.750537+00', '2026-09-09 08:06:05.750537+00'), (73, 1, null, 0, 'Mayank Agarwal', 32, 'India', 190, 4500, null, null, null, 73, '200000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/55.png', 'pending', '0', null, null, '2026-09-09 08:06:06.108195+00', '2026-09-09 08:06:06.108195+00'), (74, 1, null, 0, 'Rahul Tripathi', 32, 'India', 135, 3950, null, null, null, 71, '200000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/188.png', 'pending', '0', null, null, '2026-09-09 08:06:06.400358+00', '2026-09-09 08:06:06.400358+00'), (75, 1, null, 0, 'Colin Munro', 37, 'New Zealand', 350, 9500, null, null, null, 72, '200000', 'Batsman', 'https://documents.iplt20.com/playerheadshot/ipl/284/773.png', 'pending', '0', null, null, '2026-09-09 08:06:06.699891+00', '2026-09-09 08:06:06.699891+00'), (76, 1, null, 0, 'Manan Vohra', 30, 'India', 120, 3100, null, null, null, 70, '200000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2023/185.png', 'pending', '0', null, null, '2026-09-09 08:06:06.977039+00', '2026-09-09 08:06:06.977039+00'), (77, 1, null, 0, 'Evin Lewis', 32, 'West Indies', 200, 5900, null, null, null, 70, '200000', 'Batsman', 'https://assets.iplt20.com/ipl/IPLHeadshot2022/872.png', 'pending', '0', null, null, '2026-09-09 08:06:07.25721+00', '2026-09-09 08:06:07.25721+00'), (78, 1, null, 0, 'Shashank Singh', 33, 'India', 91, 1530, null, null, null, 78, '200000', 'Batsman', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/191.png', 'pending', '0', null, null, '2026-09-09 08:06:07.550559+00', '2026-09-09 08:06:07.550559+00'), (79, 1, null, 0, 'Josh Hazlewood', 33, 'Australia', 140, null, null, 150, '7.5', 81, '300000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/36.png', 'pending', '0', null, null, '2026-09-09 08:06:07.828179+00', '2026-09-09 08:06:07.828179+00'), (80, 1, null, 0, 'Kuldeep Yadav', 29, 'India', 120, null, null, 150, '7.2', 81, '300000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/14.png', 'pending', '0', null, null, '2026-09-09 08:06:08.103098+00', '2026-09-09 08:06:08.103098+00'), (81, 1, null, 0, 'Mohammad Siraj', 29, 'India', 110, null, null, 125, '7.9', 81, '300000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/63.png', 'pending', '0', null, null, '2026-09-09 08:06:08.382671+00', '2026-09-09 08:06:08.382671+00'), (82, 1, null, 0, 'Bhuvneshwar Kumar', 34, 'India', 310, null, null, 290, '7.2', 81, '300000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/15.png', 'pending', '0', null, null, '2026-09-09 08:06:08.663208+00', '2026-09-09 08:06:08.663208+00'), (83, 1, null, 0, 'Avesh Khan', 27, 'India', 110, null, null, 140, '8', 78, '300000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/109.png', 'pending', '0', null, null, '2026-09-09 08:06:08.941217+00', '2026-09-09 08:06:08.941217+00'), (84, 1, null, 0, 'Varun Chakravarthy', 32, 'India', 110, null, null, 120, '7.3', 80, '300000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/140.png', 'pending', '0', null, null, '2026-09-09 08:06:09.236342+00', '2026-09-09 08:06:09.236342+00'), (85, 1, null, 0, 'Deepak Chahar', 32, 'India', 140, null, null, 160, '7.7', 80, '300000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/91.png', 'pending', '0', null, null, '2026-09-09 08:06:09.544227+00', '2026-09-09 08:06:09.544227+00'), (86, 1, null, 0, 'Sandeep Sharma', 30, 'India', 180, null, null, 200, '7.8', 79, '300000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/220.png', 'pending', '0', null, null, '2026-09-09 08:06:09.859827+00', '2026-09-09 08:06:09.859827+00'), (87, 1, null, 0, 'Shardul Thakur', 32, 'India', 130, null, null, 160, '8.3', 78, '300000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/105.png', 'pending', '0', null, null, '2026-09-09 08:06:10.183016+00', '2026-09-09 08:06:10.183016+00'), (88, 1, null, 0, 'T Natarajan', 33, 'India', 90, null, null, 110, '8.1', 79, '300000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/224.png', 'pending', '0', null, null, '2026-09-09 08:06:10.59655+00', '2026-09-09 08:06:10.59655+00'), (89, 1, null, 0, 'Mark Wood', 34, 'England', 170, null, null, 180, '7.8', 78, '300000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2023/315.png', 'pending', '0', null, null, '2026-09-09 08:06:10.887629+00', '2026-09-09 08:06:10.887629+00'), (90, 1, null, 0, 'Ravi Bishnoi', 24, 'India', 90, null, null, 120, '7.3', 78, '300000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/520.png', 'pending', '0', null, null, '2026-09-09 08:06:11.167089+00', '2026-09-09 08:06:11.167089+00'), (91, 1, null, 0, 'Noor Ahmed', 20, 'Afghanistan', 176, null, null, 211, '7.5', 78, '300000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/975.png', 'pending', '0', null, null, '2026-09-09 08:06:11.458599+00', '2026-09-09 08:06:11.458599+00'), (92, 1, null, 0, 'Ishant Sharma', 37, 'India', 179, null, null, 97, '8.3', 78, '300000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/50.png', 'pending', '0', null, null, '2026-09-09 08:06:11.755925+00', '2026-09-09 08:06:11.755925+00'), (93, 1, null, 0, 'Mohit Sharma', 37, 'India', 172, null, null, 170, '8.1', 78, '300000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/100.png', 'pending', '0', null, null, '2026-09-09 08:06:12.036314+00', '2026-09-09 08:06:12.036314+00'), (94, 1, null, 0, 'Matheesha Pathirana', 22, 'Sri Lanka', 50, null, null, 70, '8.5', 77, '300000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/1014.png', 'pending', '0', null, null, '2026-09-09 08:06:12.329672+00', '2026-09-09 08:06:12.329672+00'), (95, 1, null, 0, 'Umran Malik', 24, 'India', 50, null, null, 40, '8.9', 77, '300000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2024/637.png', 'pending', '0', null, null, '2026-09-09 08:06:12.633391+00', '2026-09-09 08:06:12.633391+00'), (96, 1, null, 0, 'Maheesh Theekshana', 23, 'Sri Lanka', 110, null, null, 130, '7', 77, '300000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/629.png', 'pending', '0', null, null, '2026-09-09 08:06:12.923244+00', '2026-09-09 08:06:12.923244+00'), (97, 1, null, 0, 'Mustafizur Rahman', 30, 'Bangladesh', 300, null, null, 378, '7.6', 78, '300000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2024/258.png', 'pending', '0', null, null, '2026-09-09 08:06:13.200196+00', '2026-09-09 08:06:13.200196+00'), (98, 1, null, 0, 'Anrich Nortje', 31, 'South Africa', 145, null, null, 103, '7.9', 77, '300000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2024/142.png', 'pending', '0', null, null, '2026-09-09 08:06:13.482293+00', '2026-09-09 08:06:13.482293+00'), (99, 1, null, 0, 'Adam Zampa', 31, 'Australia', 190, null, null, 220, '7.3', 76, '300000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/24.png', 'pending', '0', null, null, '2026-09-09 08:06:13.774808+00', '2026-09-09 08:06:13.774808+00'), (100, 1, null, 0, 'Harshit Rana', 23, 'India', 43, null, null, 48, '9.2', 76, '300000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/1013.png', 'pending', '0', null, null, '2026-09-09 08:06:14.088393+00', '2026-09-09 08:06:14.088393+00'), (101, 1, null, 0, 'Prasidh Krishna', 27, 'India', 85, null, null, 110, '8.3', 77, '300000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/150.png', 'pending', '0', null, null, '2026-09-09 08:06:14.398649+00', '2026-09-09 08:06:14.398649+00'), (102, 1, null, 0, 'Harshal Patel', 33, 'India', 200, null, null, 220, '8.6', 76, '300000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/114.png', 'pending', '0', null, null, '2026-09-09 08:06:14.688432+00', '2026-09-09 08:06:14.688432+00'), (103, 1, null, 0, 'Khaleel Ahmed', 27, 'India', 114, null, null, 144, '8.37', 75, '300000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/8.png', 'pending', '0', null, null, '2026-09-09 08:06:14.996136+00', '2026-09-09 08:06:14.996136+00'), (104, 1, null, 0, 'Ravichandran Ashwin', 39, 'India', 333, null, null, 317, '6.9', 78, '300000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/45.png', 'pending', '0', null, null, '2026-09-09 08:06:15.284792+00', '2026-09-09 08:06:15.284792+00'), (105, 1, null, 0, 'Nathan Ellis', 31, 'Australia', 170, null, null, 206, '8.2', 75, '300000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/633.png', 'pending', '0', null, null, '2026-09-09 08:06:15.612198+00', '2026-09-09 08:06:15.612198+00'), (106, 1, null, 0, 'Muskesh Choudhary', 29, 'India', 29, null, null, 17, '8.7', 74, '300000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2024/970.png', 'pending', '0', null, null, '2026-09-09 08:06:15.956288+00', '2026-09-09 08:06:15.956288+00'), (107, 1, null, 0, 'Yash Dayal', 26, 'India', 55, null, null, 70, '8.3', 76, '200000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/978.png', 'pending', '0', null, null, '2026-09-09 08:06:16.265723+00', '2026-09-09 08:06:16.265723+00'), (108, 1, null, 0, 'Shreyas Gopal', 31, 'India', 100, 600, null, 100, '7.8', 75, '200000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2024/192.png', 'pending', '0', null, null, '2026-09-09 08:06:16.645355+00', '2026-09-09 08:06:16.645355+00'), (109, 1, null, 0, 'Simarjeet Singh', 27, 'India', 39, null, null, 22, '8.4', 74, '200000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2024/622.png', 'pending', '0', null, null, '2026-09-09 08:06:16.993746+00', '2026-09-09 08:06:16.993746+00'), (110, 1, null, 0, 'Rasikh Dar', 25, 'India', 25, null, null, 15, '8.6', 74, '200000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/172.png', 'pending', '0', null, null, '2026-09-09 08:06:17.279999+00', '2026-09-09 08:06:17.279999+00'), (111, 1, null, 0, 'Jaydev Unadkat', 32, 'India', 180, null, null, 210, '8', 72, '200000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/180.png', 'pending', '0', null, null, '2026-09-09 08:06:17.577333+00', '2026-09-09 08:06:17.577333+00'), (112, 1, null, 0, 'Mayank Markande', 26, 'India', 60, null, null, 80, '7.7', 73, '200000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/87.png', 'pending', '0', null, null, '2026-09-09 08:06:17.856866+00', '2026-09-09 08:06:17.856866+00'), (113, 1, null, 0, 'Mukesh Kumar', 28, 'India', 60, null, null, 75, '8.2', 74, '200000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/1462.png', 'pending', '0', null, null, '2026-09-09 08:06:18.187951+00', '2026-09-09 08:06:18.187951+00'), (114, 1, null, 0, 'R Sai Kishore', 27, 'India', 65, null, null, 85, '7.6', 74, '200000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/544.png', 'pending', '0', null, null, '2026-09-09 08:06:18.481184+00', '2026-09-09 08:06:18.481184+00'), (115, 1, null, 0, 'Rahul Chahar', 26, 'India', 131, null, null, 98, '7.4', 73, '200000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/171.png', 'pending', '0', null, null, '2026-09-09 08:06:18.968641+00', '2026-09-09 08:06:18.968641+00'), (116, 1, null, 0, 'Mohsin Khan', 25, 'India', 40, null, null, 50, '8.1', 72, '200000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2024/541.png', 'pending', '0', null, null, '2026-09-09 08:06:19.409669+00', '2026-09-09 08:06:19.409669+00'), (117, 1, null, 0, 'Shams Mulani', 27, 'India', 50, null, null, 60, '7.9', 72, '200000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2024/600.png', 'pending', '0', null, null, '2026-09-09 08:06:19.786961+00', '2026-09-09 08:06:19.786961+00'), (118, 1, null, 0, 'Tushar Deshpande', 28, 'India', 75, null, null, 85, '8.5', 72, '200000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/539.png', 'pending', '0', null, null, '2026-09-09 08:06:20.095496+00', '2026-09-09 08:06:20.095496+00'), (119, 1, null, 0, 'Umesh Yadav', 37, 'India', 170, null, null, 190, '8.5', 72, '200000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2024/21.png', 'pending', '0', null, null, '2026-09-09 08:06:20.389667+00', '2026-09-09 08:06:20.389667+00'), (120, 1, null, 0, 'Chetan Sakariya', 25, 'India', 70, null, null, 90, '7.9', 72, '200000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/592.png', 'pending', '0', null, null, '2026-09-09 08:06:20.672683+00', '2026-09-09 08:06:20.672683+00'), (121, 1, null, 0, 'Kamlesh Nagarkoti', 25, 'India', 12, null, null, 14, '8.5', 72, '200000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/146.png', 'pending', '0', null, null, '2026-09-09 08:06:20.952251+00', '2026-09-09 08:06:20.952251+00'), (122, 1, null, 0, 'Rajvardhan Hangargekar', 21, 'India', 40, null, null, 55, '8.6', 70, '200000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/783.png', 'pending', '0', null, null, '2026-09-09 08:06:21.26756+00', '2026-09-09 08:06:21.26756+00'), (123, 1, null, 0, 'Arjun Tendulkar', 25, 'India', 20, 100, null, 20, '9', 70, '200000', 'Bowler', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/585.png', 'pending', '0', null, null, '2026-09-09 08:06:21.576794+00', '2026-09-09 08:06:21.576794+00'), (124, 1, null, 0, 'Ishan Kishan', 25, 'India', 150, 4600, null, null, null, 80, '300000', 'Wicket Keeper', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/164.png', 'pending', '0', null, null, '2026-09-09 08:06:21.883788+00', '2026-09-09 08:06:21.883788+00'), (125, 1, null, 0, 'Nicholas Pooran', 28, 'West Indies', 210, 6200, null, null, null, 82, '300000', 'Wicket Keeper', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/136.png', 'pending', '0', null, null, '2026-09-09 08:06:22.187198+00', '2026-09-09 08:06:22.187198+00'), (126, 1, null, 0, 'Phil Salt', 27, 'England', 130, 3800, null, null, null, 81, '300000', 'Wicket Keeper', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/1220.png', 'pending', '0', null, null, '2026-09-09 08:06:22.521213+00', '2026-09-09 08:06:22.521213+00'), (127, 1, null, 0, 'Sanju Samson', 29, 'India', 200, 5500, null, null, null, 81, '300000', 'Wicket Keeper', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/190.png', 'pending', '0', null, null, '2026-09-09 08:06:22.825219+00', '2026-09-09 08:06:22.825219+00'), (128, 1, null, 0, 'Jos Buttler', 33, 'England', 250, 8500, null, null, null, 82, '300000', 'Wicket Keeper', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/182.png', 'pending', '0', null, null, '2026-09-09 08:06:23.113215+00', '2026-09-09 08:06:23.113215+00'), (129, 1, null, 0, 'Rahmanullah Gurbaz', 22, 'Afghanistan', 90, 2600, null, null, null, 81, '300000', 'Wicket Keeper', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/641.png', 'pending', '0', null, null, '2026-09-09 08:06:23.409908+00', '2026-09-09 08:06:23.409908+00'), (130, 1, null, 0, 'MS Dhoni', 42, 'India', 360, 7000, null, null, null, 80, '300000', 'Wicket Keeper', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/57.png', 'pending', '0', null, null, '2026-09-09 08:06:23.710446+00', '2026-09-09 08:06:23.710446+00'), (131, 1, null, 0, 'Jitesh Sharma', 29, 'India', 90, 2800, null, null, null, 80, '300000', 'Wicket Keeper', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/1000.png', 'pending', '0', null, null, '2026-09-09 08:06:24.00066+00', '2026-09-09 08:06:24.00066+00'), (132, 1, null, 0, 'Devon Conway', 32, 'New Zealand', 150, 5200, null, null, null, 80, '300000', 'Wicket Keeper', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/601.png', 'pending', '0', null, null, '2026-09-09 08:06:24.279676+00', '2026-09-09 08:06:24.279676+00'), (133, 1, null, 0, 'Quinton de Kock', 32, 'South Africa', 280, 9000, null, null, null, 80, '300000', 'Wicket Keeper', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/170.png', 'pending', '0', null, null, '2026-09-09 08:06:24.570824+00', '2026-09-09 08:06:24.570824+00'), (134, 1, null, 0, 'Prabhsimran Singh', 23, 'India', 75, 2300, null, null, null, 78, '300000', 'Wicket Keeper', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/137.png', 'pending', '0', null, null, '2026-09-09 08:06:24.846504+00', '2026-09-09 08:06:24.846504+00'), (135, 1, null, 0, 'Wriddhiman Saha', 41, 'India', 200, 4655, null, null, null, 76, '300000', 'Wicket Keeper', 'https://documents.iplt20.com/ipl/IPLHeadshot2024/225.png', 'pending', '0', null, null, '2026-09-09 08:06:25.138652+00', '2026-09-09 08:06:25.138652+00'), (136, 1, null, 0, 'Kusal Mendis', 30, 'Sri Lanka', 100, 5101, null, null, null, 76, '300000', 'Wicket Keeper', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/276.png', 'pending', '0', null, null, '2026-09-09 08:06:25.463356+00', '2026-09-09 08:06:25.463356+00'), (137, 1, null, 0, 'Sam Billings', 34, 'England', 384, 7238, null, null, null, 75, '300000', 'Wicket Keeper', 'https://assets.iplt20.com/ipl/IPLHeadshot2022/2756.png', 'pending', '0', null, null, '2026-09-09 08:06:25.765414+00', '2026-09-09 08:06:25.765414+00'), (138, 1, null, 0, 'Dinesh Karthik', 38, 'India', 412, 7537, null, null, null, 75, '300000', 'Wicket Keeper', 'https://documents.iplt20.com/ipl/IPLHeadshot2024/13.png', 'pending', '0', null, null, '2026-09-09 08:06:26.054532+00', '2026-09-09 08:06:26.054532+00'), (139, 1, null, 0, 'Abishek Porel', 23, 'India', 15, 250, null, null, null, 74, '200000', 'Wicket Keeper', 'https://documents.iplt20.com/ipl/IPLHeadshot2024/1580.png', 'pending', '0', null, null, '2026-09-09 08:06:26.335942+00', '2026-09-09 08:06:26.335942+00'), (140, 1, null, 0, 'Anuj Rawat', 24, 'India', 60, 1700, null, null, null, 73, '200000', 'Wicket Keeper', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/534.png', 'pending', '0', null, null, '2026-09-09 08:06:26.628733+00', '2026-09-09 08:06:26.628733+00'), (141, 1, null, 0, 'KS Bharat', 30, 'India', 70, 1800, null, null, null, 72, '200000', 'Wicket Keeper', 'https://documents.iplt20.com/ipl/IPLHeadshot2024/365.png', 'pending', '0', null, null, '2026-09-09 08:06:26.911145+00', '2026-09-09 08:06:26.911145+00'), (142, 1, null, 0, 'Vishnu Vinod', 30, 'India', 85, 2500, null, null, null, 72, '200000', 'Wicket Keeper', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/581.png', 'pending', '0', null, null, '2026-09-09 08:06:27.323891+00', '2026-09-09 08:06:27.323891+00'), (143, 1, null, 0, 'N Jagadeesan', 28, 'India', 60, 1900, null, null, null, 72, '200000', 'Wicket Keeper', 'https://documents.iplt20.com/ipl/IPLHeadshot2023/97.png', 'pending', '0', null, null, '2026-09-09 08:06:27.611635+00', '2026-09-09 08:06:27.611635+00'), (144, 1, null, 0, 'Matthew Wade', 37, 'Australia', 276, 5267, null, null, null, 74, '200000', 'Wicket Keeper', 'https://documents.iplt20.com/ipl/IPLHeadshot2024/549.png', 'pending', '0', null, null, '2026-09-09 08:06:27.911325+00', '2026-09-09 08:06:27.911325+00'), (145, 1, null, 0, 'Axar Patel', 30, 'India', 190, 3600, null, 180, '7.2', 82, '300000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/110.png', 'pending', '0', null, null, '2026-09-09 08:06:28.187183+00', '2026-09-09 08:06:28.187183+00'), (146, 1, null, 0, 'Marcus Stoinis', 34, 'Australia', 260, 5200, null, 190, '8', 81, '300000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/23.png', 'pending', '0', null, null, '2026-09-09 08:06:28.467562+00', '2026-09-09 08:06:28.467562+00'), (147, 1, null, 0, 'Andre Russell', 36, 'West Indies', 350, 7000, null, 280, '9.2', 82, '300000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/141.png', 'pending', '0', null, null, '2026-09-09 08:06:28.77476+00', '2026-09-09 08:06:28.77476+00'), (148, 1, null, 0, 'Glenn Maxwell', 35, 'Australia', 320, 7800, null, 210, '7.8', 79, '300000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/28.png', 'pending', '0', null, null, '2026-09-09 08:06:29.073553+00', '2026-09-09 08:06:29.073553+00'), (149, 1, null, 0, 'Liam Livingstone', 30, 'England', 200, 4500, null, 130, '8.1', 80, '300000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/183.png', 'pending', '0', null, null, '2026-09-09 08:06:29.364566+00', '2026-09-09 08:06:29.364566+00'), (150, 1, null, 0, 'Washington Sundar', 25, 'India', 160, 2800, null, 120, '7.3', 80, '300000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/20.png', 'pending', '0', null, null, '2026-09-09 08:06:29.661927+00', '2026-09-09 08:06:29.661927+00'), (151, 1, null, 0, 'Cameron Green', 24, 'Australia', 90, 2500, null, 80, '8.3', 80, '300000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2024/550.png', 'pending', '0', null, null, '2026-09-09 08:06:29.94191+00', '2026-09-09 08:06:29.94191+00'), (152, 1, null, 0, 'Sunil Narine', 37, 'West Indies', 450, 3200, null, 450, '6.7', 80, '300000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/156.png', 'pending', '0', null, null, '2026-09-09 08:06:30.223689+00', '2026-09-09 08:06:30.223689+00'), (153, 1, null, 0, 'Riyan Parag', 22, 'India', 140, 2600, null, 80, '8.2', 79, '300000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/189.png', 'pending', '0', null, null, '2026-09-09 08:06:30.508056+00', '2026-09-09 08:06:30.508056+00'), (154, 1, null, 0, 'Sherfane Rutherford', 27, 'West Indies', 208, 3436, null, null, null, 79, '300000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/122.png', 'pending', '0', null, null, '2026-09-09 08:06:30.799705+00', '2026-09-09 08:06:30.799705+00'), (155, 1, null, 0, 'Wanindu Hasaranga', 26, 'Sri Lanka', 220, 3800, null, 260, '7', 79, '300000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/377.png', 'pending', '0', null, null, '2026-09-09 08:06:31.153997+00', '2026-09-09 08:06:31.153997+00'), (156, 1, null, 0, 'Mitchell Santner', 33, 'New Zealand', 200, 1500, null, 180, '7.1', 79, '300000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/75.png', 'pending', '0', null, null, '2026-09-09 08:06:31.46712+00', '2026-09-09 08:06:31.46712+00'), (157, 1, null, 0, 'Ben Stokes', 34, 'England', 240, 5300, null, 180, '8', 78, '300000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2023/177.png', 'pending', '0', null, null, '2026-09-09 08:06:31.754467+00', '2026-09-09 08:06:31.754467+00'), (158, 1, null, 0, 'Marco Jansen', 25, 'South Africa', 80, 600, null, 90, '8.3', 78, '300000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2024/586.png', 'pending', '0', null, null, '2026-09-09 08:06:32.034937+00', '2026-09-09 08:06:32.034937+00'), (159, 1, null, 0, 'Krunal Pandya', 33, 'India', 180, 3900, null, 150, '7.5', 78, '300000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/17.png', 'pending', '0', null, null, '2026-09-09 08:06:32.326413+00', '2026-09-09 08:06:32.326413+00'), (160, 1, null, 0, 'Shakib Al Hasan', 37, 'Bangladesh', 400, 6500, null, 420, '7', 77, '300000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2023/222.png', 'pending', '0', null, null, '2026-09-09 08:06:32.605993+00', '2026-09-09 08:06:32.605993+00'), (161, 1, null, 0, 'Rahul Tewatia', 30, 'India', 130, 2900, null, 70, '8.5', 78, '300000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/120.png', 'pending', '0', null, null, '2026-09-09 08:06:32.885819+00', '2026-09-09 08:06:32.885819+00'), (162, 1, null, 0, 'Sam Curran', 26, 'England', 170, 3000, null, 150, '8', 77, '300000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/138.png', 'pending', '0', null, null, '2026-09-09 08:06:33.167952+00', '2026-09-09 08:06:33.167952+00'), (163, 1, null, 0, 'Moeen Ali', 36, 'England', 280, 5200, null, 190, '7.5', 76, '300000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/206.png', 'pending', '0', null, null, '2026-09-09 08:06:33.443099+00', '2026-09-09 08:06:33.443099+00'), (164, 1, null, 0, 'Michael Bracewell', 34, 'New Zealand', 60, 700, null, 40, '7.8', 75, '300000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2023/1465.png', 'pending', '0', null, null, '2026-09-09 08:06:33.720064+00', '2026-09-09 08:06:33.720064+00'), (165, 1, null, 0, 'Venkatesh Iyer', 29, 'India', 120, 3500, null, 90, '8.4', 76, '300000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/584.png', 'pending', '0', null, null, '2026-09-09 08:06:34.042093+00', '2026-09-09 08:06:34.042093+00'), (166, 1, null, 0, 'Harpreet Brar', 29, 'India', 60, 400, null, 50, '7.5', 74, '200000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/130.png', 'pending', '0', null, null, '2026-09-09 08:06:34.348971+00', '2026-09-09 08:06:34.348971+00'), (167, 1, null, 0, 'Vijay Shankar', 34, 'India', 120, 1800, null, 30, '8.2', 74, '200000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/61.png', 'pending', '0', null, null, '2026-09-09 08:06:34.647294+00', '2026-09-09 08:06:34.647294+00'), (168, 1, null, 0, 'Vaibhav Suryavanshi', 14, 'India', 5, 50, null, 2, '9.5', 74, '200000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/3498.png', 'pending', '0', null, null, '2026-09-09 08:06:34.932363+00', '2026-09-09 08:06:34.932363+00'), (169, 1, null, 0, 'Swapnil Singh', 34, 'India', 50, 400, null, 45, '7.6', 74, '200000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/1483.png', 'pending', '0', null, null, '2026-09-09 08:06:35.212913+00', '2026-09-09 08:06:35.212913+00'), (170, 1, null, 0, 'Dasun Shanaka', 32, 'Sri Lanka', 130, 2700, null, 70, '8.6', 73, '200000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/375.png', 'pending', '0', null, null, '2026-09-09 08:06:35.49061+00', '2026-09-09 08:06:35.49061+00'), (171, 1, null, 0, 'Deepak Hooda', 28, 'India', 150, 3200, null, 60, '8.8', 73, '200000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/215.png', 'pending', '0', null, null, '2026-09-09 08:06:35.772735+00', '2026-09-09 08:06:35.772735+00'), (172, 1, null, 0, 'Mohammad Nabi', 40, 'Afghanistan', 350, 3200, null, 300, '7.2', 74, '200000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2024/217.png', 'pending', '0', null, null, '2026-09-09 08:06:36.058613+00', '2026-09-09 08:06:36.058613+00'), (173, 1, null, 0, 'Jason Holder', 34, 'West Indies', 319, 3089, null, 337, '8', 75, '200000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2023/263.png', 'pending', '0', null, null, '2026-09-09 08:06:36.372086+00', '2026-09-09 08:06:36.372086+00'), (174, 1, null, 0, 'Mahipal Lomror', 24, 'India', 100, 2100, null, 50, '8.7', 71, '200000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/184.png', 'pending', '0', null, null, '2026-09-09 08:06:36.665728+00', '2026-09-09 08:06:36.665728+00'), (175, 1, null, 0, 'Shahbaz Ahmed', 29, 'India', 90, 2000, null, 60, '7.8', 73, '200000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2025/523.png', 'pending', '0', null, null, '2026-09-09 08:06:36.95893+00', '2026-09-09 08:06:36.95893+00'), (176, 1, null, 0, 'Tom Curran', 30, 'England', 150, 1200, null, 160, '8.5', 71, '200000', 'All Rounder', 'https://documents.iplt20.com/ipl/IPLHeadshot2024/309.png', 'pending', '0', null, null, '2026-09-09 08:06:37.248577+00', '2026-09-09 08:06:37.248577+00'), (177, 1, null, 0, 'Chris Jordan', 37, 'England', 300, 1500, null, 320, '8.6', 70, '200000', 'All Rounder', 'https://assets.iplt20.com/ipl/IPLHeadshot2022/1299.png', 'pending', '0', null, null, '2026-09-09 08:06:37.555698+00', '2026-09-09 08:06:37.555698+00') ON CONFLICT (id) DO NOTHING;

