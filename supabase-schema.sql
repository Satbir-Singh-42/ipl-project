-- =====================================================
-- IPL AUCTION 2025 - SUPABASE DATABASE SCHEMA
-- =====================================================
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
-- =====================================================


-- 1. POOLS TABLE (Auction Sets & Rounds)
CREATE TABLE IF NOT EXISTS pools (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pools_order ON pools(order_index);

-- 2. PLAYERS TABLE
-- Stores all player data (replaces Players Catalogue + Auctioneer Sheet)
CREATE TABLE IF NOT EXISTS players (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
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

-- Ensure columns exist if table was already created
ALTER TABLE players ADD COLUMN IF NOT EXISTS pool_id BIGINT REFERENCES pools(id) ON DELETE SET NULL;
ALTER TABLE players ADD COLUMN IF NOT EXISTS auction_order INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_players_pool_id ON players(pool_id);
CREATE INDEX IF NOT EXISTS idx_players_auction_order ON players(auction_order);
CREATE INDEX IF NOT EXISTS idx_players_status ON players(status);
CREATE INDEX IF NOT EXISTS idx_players_sold_to_team ON players(sold_to_team);
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);


-- 3. TEAMS TABLE
CREATE TABLE IF NOT EXISTS teams (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  border_color TEXT,
  bg_gradient TEXT,
  starting_budget NUMERIC DEFAULT 10000000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teams_slug ON teams(slug);


-- 3. AUCTION LOG TABLE
CREATE TABLE IF NOT EXISTS auction_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  player_id BIGINT REFERENCES players(id) ON DELETE SET NULL,
  player_name TEXT NOT NULL,
  team_name TEXT,
  action TEXT NOT NULL CHECK (action IN ('sold', 'unsold', 'undo')),
  final_price NUMERIC DEFAULT 0,
  performed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_auction_log_created ON auction_log(created_at DESC);


-- 4. USERS META TABLE
CREATE TABLE IF NOT EXISTS users_meta (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  auth_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'auctioneer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_meta_auth_id ON users_meta(auth_id);


-- 5. PLAYING XI TABLE
CREATE TABLE IF NOT EXISTS playing_xi (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  team_slug TEXT NOT NULL,
  player_id BIGINT REFERENCES players(id) ON DELETE CASCADE,
  selected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_slug, player_id)
);

CREATE INDEX idx_playing_xi_team ON playing_xi(team_slug);


-- 6. AUCTION SETTINGS & SQUAD RULES TABLE
CREATE TABLE IF NOT EXISTS auction_settings (
  id BIGINT PRIMARY KEY DEFAULT 1,
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

-- Ensure columns exist if table was already created
ALTER TABLE auction_settings ADD COLUMN IF NOT EXISTS enable_captain_multiplier BOOLEAN DEFAULT true;
ALTER TABLE auction_settings ADD COLUMN IF NOT EXISTS captain_multiplier NUMERIC DEFAULT 2.0;
ALTER TABLE auction_settings ADD COLUMN IF NOT EXISTS vice_captain_multiplier NUMERIC DEFAULT 1.5;

-- Enable Row Level Security immediately
ALTER TABLE auction_settings ENABLE ROW LEVEL SECURITY;

-- Insert default row if not present
INSERT INTO auction_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Policies for auction_settings
DROP POLICY IF EXISTS "Auction settings are viewable by everyone" ON auction_settings;
CREATE POLICY "Auction settings are viewable by everyone"
  ON auction_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Auction settings can be updated" ON auction_settings;
CREATE POLICY "Auction settings can be updated"
  ON auction_settings FOR ALL
  USING (true)
  WITH CHECK (true);


-- AUTO-UPDATE TIMESTAMPS
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS auction_settings_updated_at ON auction_settings;
CREATE TRIGGER auction_settings_updated_at
  BEFORE UPDATE ON auction_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ROW LEVEL SECURITY (Other tables)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE playing_xi ENABLE ROW LEVEL SECURITY;

-- Players: public read, authenticated write
CREATE POLICY "Players are viewable by everyone"
  ON players FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert players"
  ON players FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update players"
  ON players FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete players"
  ON players FOR DELETE TO authenticated USING (true);

-- Teams: public read, authenticated write
CREATE POLICY "Teams are viewable by everyone"
  ON teams FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert teams"
  ON teams FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update teams"
  ON teams FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete teams"
  ON teams FOR DELETE TO authenticated USING (true);

-- Auction log: public read, authenticated insert, update, delete
CREATE POLICY "Auction log is viewable by everyone"
  ON auction_log FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert auction log"
  ON auction_log FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update auction log"
  ON auction_log FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete auction log"
  ON auction_log FOR DELETE TO authenticated USING (true);

-- Users meta: users can only read their own row
CREATE POLICY "Users can read their own meta"
  ON users_meta FOR SELECT TO authenticated USING (auth.uid() = auth_id);

-- Playing XI: fully public (no login needed)
CREATE POLICY "Playing XI is viewable by everyone"
  ON playing_xi FOR SELECT USING (true);
CREATE POLICY "Anyone can insert playing XI"
  ON playing_xi FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update playing XI"
  ON playing_xi FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete playing XI"
  ON playing_xi FOR DELETE USING (true);

-- POOLS RLS POLICIES
ALTER TABLE pools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public pools view" ON pools;
CREATE POLICY "Public pools view"
  ON pools FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert pools" ON pools;
CREATE POLICY "Authenticated users can insert pools"
  ON pools FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update pools" ON pools;
CREATE POLICY "Authenticated users can update pools"
  ON pools FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete pools" ON pools;
CREATE POLICY "Authenticated users can delete pools"
  ON pools FOR DELETE TO authenticated USING (true);


-- ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE pools;


-- =====================================================
-- 6. SUPABASE STORAGE BUCKETS (Player Images & Team Logos)
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('player-images', 'player-images', true),
  ('team-logos', 'team-logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS Policies: Public View Access
DROP POLICY IF EXISTS "Public player images access" ON storage.objects;
CREATE POLICY "Public player images access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'player-images');

DROP POLICY IF EXISTS "Public team logos access" ON storage.objects;
CREATE POLICY "Public team logos access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'team-logos');

-- Storage RLS Policies: Authenticated Write Access
DROP POLICY IF EXISTS "Authenticated users can upload player images" ON storage.objects;
CREATE POLICY "Authenticated users can upload player images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'player-images');

DROP POLICY IF EXISTS "Authenticated users can update player images" ON storage.objects;
CREATE POLICY "Authenticated users can update player images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'player-images');

DROP POLICY IF EXISTS "Authenticated users can delete player images" ON storage.objects;
CREATE POLICY "Authenticated users can delete player images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'player-images');

DROP POLICY IF EXISTS "Authenticated users can upload team logos" ON storage.objects;
CREATE POLICY "Authenticated users can upload team logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'team-logos');

DROP POLICY IF EXISTS "Authenticated users can update team logos" ON storage.objects;
CREATE POLICY "Authenticated users can update team logos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'team-logos');

DROP POLICY IF EXISTS "Authenticated users can delete team logos" ON storage.objects;
CREATE POLICY "Authenticated users can delete team logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'team-logos');


-- SEED: 12 TEAMS (with branding from teamBranding.ts)
INSERT INTO teams (name, slug, logo_url, border_color, bg_gradient, starting_budget) VALUES
  ('Sunrisers Hyderabad', 'sunrisers-hyderabad', '/images/teams/srh.webp', 'border-[#F26522]', 'bg-[linear-gradient(135deg,rgba(242,101,34,0.95)_0%,rgba(200,80,25,0.85)_45%,rgba(160,65,20,0.9)_100%)]', 10000000),
  ('Chennai Super Kings', 'chennai-super-kings', '/images/teams/csk.jpg', 'border-[#F9CD00]', 'bg-[linear-gradient(135deg,rgba(180,140,0,0.95)_0%,rgba(140,110,0,0.85)_45%,rgba(100,80,0,0.9)_100%)]', 10000000),
  ('Rajasthan Royals', 'rajasthan-royals', '/images/teams/rr.png', 'border-[#EA1A8C]', 'bg-[linear-gradient(135deg,rgba(234,26,140,0.95)_0%,rgba(190,20,115,0.85)_45%,rgba(150,15,90,0.9)_100%)]', 10000000),
  ('Delhi Capitals', 'delhi-capitals', '/images/teams/dc.jpg', 'border-[#004C97]', 'bg-[linear-gradient(135deg,rgba(0,76,151,0.95)_0%,rgba(0,60,120,0.85)_45%,rgba(0,45,95,0.9)_100%)]', 10000000),
  ('Punjab Kings', 'punjab-kings', '/images/teams/pbks.png', 'border-[#C8102E]', 'bg-[linear-gradient(135deg,rgba(200,16,46,0.95)_0%,rgba(160,10,35,0.85)_45%,rgba(120,8,25,0.9)_100%)]', 10000000),
  ('Indore Titans', 'indore-titans', '/images/teams/it.png', 'border-[#0074D9]', 'bg-[linear-gradient(135deg,rgba(0,116,217,0.95)_0%,rgba(0,90,170,0.85)_45%,rgba(0,70,130,0.9)_100%)]', 10000000),
  ('Lucknow Giants', 'lucknow-giants', '/images/teams/lsg.png', 'border-[#0097A7]', 'bg-[linear-gradient(135deg,rgba(0,151,167,0.95)_0%,rgba(0,120,135,0.85)_45%,rgba(0,90,110,0.9)_100%)]', 10000000),
  ('Royal Challengers Bengaluru', 'royal-challengers-bengaluru', '/images/teams/rcb.jpg', 'border-[#DA1212]', 'bg-[linear-gradient(135deg,rgba(218,18,18,0.95)_0%,rgba(180,15,15,0.85)_45%,rgba(140,10,10,0.9)_100%)]', 10000000),
  ('Goa Gladiators', 'goa-gladiators', '/images/teams/gg.png', 'border-[#00BCD4]', 'bg-[linear-gradient(135deg,rgba(0,188,212,0.95)_0%,rgba(0,150,170,0.85)_45%,rgba(0,120,140,0.9)_100%)]', 10000000),
  ('Gujarat Titans', 'gujarat-titans', '/images/teams/gt.png', 'border-[#0A1931]', 'bg-[linear-gradient(135deg,rgba(10,25,49,0.95)_0%,rgba(7,20,40,0.85)_45%,rgba(5,15,30,0.9)_100%)]', 10000000),
  ('Kolkata Night Riders', 'kolkata-night-riders', '/images/teams/kkr.jpeg', 'border-[#3E1F47]', 'bg-[linear-gradient(135deg,rgba(62,31,71,0.95)_0%,rgba(45,20,55,0.85)_45%,rgba(30,15,40,0.9)_100%)]', 10000000),
  ('Mumbai Indians', 'mumbai-indians', '/images/teams/mi.jpg', 'border-[#045093]', 'bg-[linear-gradient(135deg,rgba(4,80,147,0.95)_0%,rgba(2,50,93,0.85)_45%,rgba(1,30,70,0.9)_100%)]', 10000000)
ON CONFLICT (name) DO NOTHING;


-- =====================================================
-- AFTER RUNNING THIS SQL:
-- 1. Go to Authentication > Users > Add User
--    Create admin user (email + password)
--    Create auctioneer user (email + password)
-- 2. Copy each user UUID from the Users table
-- 3. Run these inserts with real UUIDs:
--
--    INSERT INTO users_meta (auth_id, email, display_name, role)
--    VALUES ('ADMIN_UUID', 'admin@example.com', 'Admin', 'admin');
--
--    INSERT INTO users_meta (auth_id, email, display_name, role)
--    VALUES ('AUCTIONEER_UUID', 'auctioneer@example.com', 'Auctioneer', 'auctioneer');
-- =====================================================
