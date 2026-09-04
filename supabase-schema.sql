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
  banner_url TEXT,
  logo_url TEXT,
  is_locked BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false,
  room_password TEXT DEFAULT '',
  admin_password TEXT DEFAULT 'admin123',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Idempotently add new columns if table already exists
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS room_password TEXT DEFAULT '';
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS admin_password TEXT DEFAULT 'admin123';

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

-- Enable RLS for tournaments
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tournaments are viewable by everyone" ON tournaments;
CREATE POLICY "Tournaments are viewable by everyone"
  ON tournaments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert tournaments" ON tournaments;
CREATE POLICY "Authenticated users can insert tournaments"
  ON tournaments FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update tournaments" ON tournaments;
CREATE POLICY "Authenticated users can update tournaments"
  ON tournaments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can delete tournaments" ON tournaments;
CREATE POLICY "Authenticated users can delete tournaments"
  ON tournaments FOR DELETE TO authenticated USING (true);

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


-- 5. USERS META TABLE
CREATE TABLE IF NOT EXISTS users_meta (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  auth_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_meta_auth_id ON users_meta(auth_id);


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
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
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

-- Tournaments
DROP POLICY IF EXISTS "Tournaments are viewable by everyone" ON tournaments;
CREATE POLICY "Tournaments are viewable by everyone" ON tournaments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert tournaments" ON tournaments;
CREATE POLICY "Anyone can insert tournaments" ON tournaments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update tournaments" ON tournaments;
CREATE POLICY "Anyone can update tournaments" ON tournaments FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can delete tournaments" ON tournaments;
CREATE POLICY "Anyone can delete tournaments" ON tournaments FOR DELETE USING (true);

-- Players
DROP POLICY IF EXISTS "Players are viewable by everyone" ON players;
CREATE POLICY "Players are viewable by everyone" ON players FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert players" ON players;
CREATE POLICY "Anyone can insert players" ON players FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update players" ON players;
CREATE POLICY "Anyone can update players" ON players FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can delete players" ON players;
CREATE POLICY "Anyone can delete players" ON players FOR DELETE USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert players" ON players;
DROP POLICY IF EXISTS "Authenticated users can update players" ON players;
DROP POLICY IF EXISTS "Authenticated users can delete players" ON players;

-- Teams
DROP POLICY IF EXISTS "Teams are viewable by everyone" ON teams;
CREATE POLICY "Teams are viewable by everyone" ON teams FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert teams" ON teams;
CREATE POLICY "Anyone can insert teams" ON teams FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update teams" ON teams;
CREATE POLICY "Anyone can update teams" ON teams FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can delete teams" ON teams;
CREATE POLICY "Anyone can delete teams" ON teams FOR DELETE USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert teams" ON teams;
DROP POLICY IF EXISTS "Authenticated users can update teams" ON teams;
DROP POLICY IF EXISTS "Authenticated users can delete teams" ON teams;

-- Auction Log
DROP POLICY IF EXISTS "Auction log is viewable by everyone" ON auction_log;
CREATE POLICY "Auction log is viewable by everyone" ON auction_log FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert auction log" ON auction_log;
CREATE POLICY "Anyone can insert auction log" ON auction_log FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update auction log" ON auction_log;
CREATE POLICY "Anyone can update auction log" ON auction_log FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can delete auction log" ON auction_log;
CREATE POLICY "Anyone can delete auction log" ON auction_log FOR DELETE USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert auction log" ON auction_log;
DROP POLICY IF EXISTS "Authenticated users can update auction log" ON auction_log;
DROP POLICY IF EXISTS "Authenticated users can delete auction log" ON auction_log;

-- Users Meta
DROP POLICY IF EXISTS "Users can read their own meta" ON users_meta;
CREATE POLICY "Users can read their own meta" ON users_meta FOR SELECT USING (true);

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
DROP POLICY IF EXISTS "Authenticated users can insert pools" ON pools;
DROP POLICY IF EXISTS "Authenticated users can update pools" ON pools;
DROP POLICY IF EXISTS "Authenticated users can delete pools" ON pools;


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

DROP POLICY IF EXISTS "Authenticated users can upload player images" ON storage.objects;
CREATE POLICY "Authenticated users can upload player images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'player-images');

DROP POLICY IF EXISTS "Authenticated users can update player images" ON storage.objects;
CREATE POLICY "Authenticated users can update player images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'player-images');

DROP POLICY IF EXISTS "Authenticated users can delete player images" ON storage.objects;
CREATE POLICY "Authenticated users can delete player images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'player-images');

DROP POLICY IF EXISTS "Authenticated users can upload team logos" ON storage.objects;
CREATE POLICY "Authenticated users can upload team logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'team-logos');

DROP POLICY IF EXISTS "Authenticated users can update team logos" ON storage.objects;
CREATE POLICY "Authenticated users can update team logos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'team-logos');

DROP POLICY IF EXISTS "Authenticated users can delete team logos" ON storage.objects;
CREATE POLICY "Authenticated users can delete team logos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'team-logos');


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

