import { supabase } from "@/lib/supabase";
import {
  getTeamLogo,
  getTeamBorderColor,
  getTeamGradient,
} from "@/config/teamBranding";
import { DEFAULT_PLAYERS } from "@/config/defaultPlayers";

// Re-export the same interfaces used by all consumers
export interface Tournament {
  id: number;
  name: string;
  slug: string;
  room_code: string;
  description?: string;
  currency_symbol?: string;
  currency_code?: string;
  banner_url?: string | null;
  logo_url?: string | null;
  is_locked?: boolean;
  is_private?: boolean;
  room_password?: string;
  admin_password?: string;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Player {
  name: string;
  team: string;
  role: string;
  nation: string;
  age?: number;
  basePrice: number;
  soldPrice: number;
  status: "sold" | "unsold" | "available";
  overseas: boolean;
  points?: number;
  originalIndex?: number;
  images?: string;
  t20Matches?: number;
  isUnsold?: boolean;
  dbId?: number;
  runs?: number;
  battingSr?: number;
  wickets?: number;
  economy?: number;
  poolId?: number | null;
  auctionOrder?: number;
  tournamentId?: number;
}

export interface Pool {
  id: number;
  tournamentId?: number;
  name: string;
  orderIndex: number;
  playerCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Team {
  id: string;
  name: string;
  logo: string;
  fundsRemaining: number;
  overseasPlayers: number;
  totalPlayers: number;
  totalPoints?: number;
  startingBudget?: number;
  totalSpent?: number;
  borderColor?: string;
  bgGradient?: string;
  tournamentId?: number;
}

export interface LeaderboardTeam {
  teamId: string;
  teamName: string;
  playersCount: number;
  overseasCount: number;
  totalSpent: number;
  fundsRemaining: number;
  startingBudget: number;
  totalPoints: number;
}

export interface TeamStats {
  teamId: string;
  teamName: string;
  totalSpent: number;
  playersCount: number;
  overseasCount: number;
  fundsRemaining: number;
  totalPoints: number;
  startingBudget: number;
  logoUrl?: string | null;
  borderColor?: string | null;
  bgGradient?: string | null;
}

// Raw DB row types
interface DBPool {
  id: number;
  tournament_id?: number;
  name: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface DBPlayer {
  id: number;
  tournament_id?: number;
  name: string;
  age: number | null;
  country: string | null;
  t20_matches: number | null;
  runs: number | null;
  batting_sr: number | null;
  wickets: number | null;
  economy: number | null;
  eval_points: number | null;
  base_price: number | null;
  role: string;
  image_url: string | null;
  status: string;
  sold_price: number | null;
  sold_to_team: string | null;
  sold_at: string | null;
  pool_id?: number | null;
  auction_order?: number | null;
}

interface DBTeam {
  id: number;
  tournament_id?: number;
  name: string;
  slug: string;
  logo_url: string | null;
  border_color: string | null;
  bg_gradient: string | null;
  starting_budget: number;
}

const ACTIVE_TOURNAMENT_KEY = "ipl_active_tournament_id";

// Run an async mapper over a list with a bounded concurrency so we don't burst
// hundreds of network calls (e.g. image uploads) at once or block sequentially.
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  const worker = async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await fn(items[idx], idx);
    }
  };

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

class SupabaseService {
  private activeTournamentId: number = 1;

  constructor() {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(ACTIVE_TOURNAMENT_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed > 0) {
          this.activeTournamentId = parsed;
        }
      }
    }
  }

  getActiveTournamentId(): number {
    return this.activeTournamentId;
  }

  setActiveTournamentId(id: number): void {
    if (!id || isNaN(id)) return;
    this.activeTournamentId = id;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(ACTIVE_TOURNAMENT_KEY, String(id));
        window.dispatchEvent(
          new CustomEvent("ipl_tournament_changed", { detail: { tournamentId: id } }),
        );
      } catch {
        // ignore
      }
    }
  }

  // ─── TOURNAMENT MANAGEMENT (Multi-Tenancy) ───

  async getTournaments(): Promise<Tournament[]> {
    const { data, error } = await supabase
      .from("tournaments")
      .select("id, name, slug, room_code, description, currency_symbol, currency_code, banner_url, logo_url, is_locked, is_private, created_by, created_at, updated_at")
      .order("id", { ascending: true });

    if (error) {
      console.error("Failed to fetch tournaments:", error.message);
      return [
        {
          id: 1,
          name: "IPL 2025 Mega Auction",
          slug: "ipl-2025",
          room_code: "IPL2025",
          description: "Official IPL 2025 Mega Player Auction",
          currency_symbol: "₹",
          currency_code: "INR",
        },
      ];
    }
    return data || [];
  }

  async getTournamentById(id: number): Promise<Tournament | null> {
    const { data, error } = await supabase
      .from("tournaments")
      .select("id, name, slug, room_code, description, currency_symbol, currency_code, banner_url, logo_url, is_locked, is_private, created_by, created_at, updated_at")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return data as Tournament;
  }

  async getTournamentBySlugOrCode(identifier: string): Promise<Tournament | null> {
    const clean = identifier.trim();
    if (!clean) return null;

    const { data, error } = await supabase
      .from("tournaments")
      .select("id, name, slug, room_code, description, currency_symbol, currency_code, banner_url, logo_url, is_locked, is_private, created_by, created_at, updated_at")
      .or(`slug.eq.${clean.toLowerCase()},room_code.eq.${clean.toUpperCase()},room_code.eq.${clean}`)
      .maybeSingle();

    if (error || !data) return null;
    return data as Tournament;
  }

  async verifyRoomPassword(tournamentId: number, passwordInput: string): Promise<boolean> {
    const cleanPass = passwordInput.trim();
    if (!cleanPass) return false;

    try {
      const { data, error } = await supabase
        .from("tournaments")
        .select("id, room_password, admin_password")
        .eq("id", tournamentId)
        .maybeSingle();

      if (error || !data) return false;
      const roomPass = data.room_password?.trim() || "";
      const adminPass = data.admin_password?.trim() || "";

      return (
        (roomPass !== "" && cleanPass === roomPass) ||
        (adminPass !== "" && cleanPass === adminPass) ||
        (tournamentId === 1 && cleanPass === "admin123")
      );
    } catch {
      return false;
    }
  }

  async signUpUser(input: {
    username: string;
    email: string;
    password: string;
  }): Promise<{
    user: { id: string; email: string } | null;
    needsEmailConfirmation: boolean;
  }> {
    const email = (input.email || "").trim().toLowerCase();
    const password = input.password || "";
    const username = (input.username || "").trim();

    if (!email || !password) {
      throw new Error("Email and password are required.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Please enter a valid email address.");
    }
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: username, full_name: username } },
      });

      if (error) throw new Error(error.message);

      const authUser = data.user;
      if (authUser) {
        const { error: metaError } = await supabase.from("users_meta").upsert(
          {
            auth_id: authUser.id,
            email: authUser.email || email,
            username,
            display_name: username,
            role: "organizer",
          },
          { onConflict: "auth_id" },
        );
        if (metaError) throw new Error(metaError.message);
      }

      let needsEmailConfirmation = false;
      if (!data.session && authUser) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) needsEmailConfirmation = true;
      }

      return {
        user: authUser ? { id: authUser.id, email: authUser.email || email } : null,
        needsEmailConfirmation,
      };
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error("Sign up failed. Please try again.");
    }
  }

  async verifyRoomAdminCredentials(identifier: string, passwordInput: string): Promise<{ success: boolean; tournament?: Tournament }> {
    const cleanId = identifier.trim();
    const cleanPass = passwordInput.trim();
    if (!cleanId || !cleanPass) return { success: false };

    try {
      const { data, error } = await supabase
        .from("tournaments")
        .select("id, name, slug, room_code, admin_password, currency_symbol, currency_code, description, is_private")
        .or(`room_code.ilike.${cleanId},slug.ilike.${cleanId}`)
        .maybeSingle();

      if (error || !data) return { success: false };
      const expectedPass = data.admin_password?.trim() || (data.id === 1 ? "admin123" : "");

      if (expectedPass !== "" && cleanPass === expectedPass) {
        return {
          success: true,
          tournament: {
            id: data.id,
            name: data.name,
            slug: data.slug,
            room_code: data.room_code,
            currency_symbol: data.currency_symbol,
            currency_code: data.currency_code,
            description: data.description,
            is_private: data.is_private,
          },
        };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  }

  async getMultiTournamentSummaryStats(): Promise<Record<number, { teamsCount: number; playersCount: number; poolsCount: number }>> {
    try {
      const [teamsRes, playersRes, poolsRes] = await Promise.all([
        supabase.from("teams").select("tournament_id"),
        supabase.from("players").select("tournament_id"),
        supabase.from("pools").select("tournament_id"),
      ]);

      const statsMap: Record<number, { teamsCount: number; playersCount: number; poolsCount: number }> = {};

      const countMap = (list: { tournament_id: number | null }[] | null, key: "teamsCount" | "playersCount" | "poolsCount") => {
        if (!list) return;
        for (const item of list) {
          const tId = item.tournament_id ?? 1;
          if (!statsMap[tId]) {
            statsMap[tId] = { teamsCount: 0, playersCount: 0, poolsCount: 0 };
          }
          statsMap[tId][key] += 1;
        }
      };

      countMap(teamsRes.data, "teamsCount");
      countMap(playersRes.data, "playersCount");
      countMap(poolsRes.data, "poolsCount");

      return statsMap;
    } catch {
      return {};
    }
  }

  async createTournament(tournament: {
    name: string;
    slug?: string;
    room_code?: string;
    description?: string;
    currency_symbol?: string;
    currency_code?: string;
    banner_url?: string;
    logo_url?: string;
    is_private?: boolean;
    room_password?: string;
    admin_password?: string;
    created_by?: string | null;
  }): Promise<Tournament> {
    const name = tournament.name.trim();
    if (!name) {
      throw new Error("Tournament name is required.");
    }

    // 1. Check for duplicate name (case-insensitive)
    const { data: existingByName } = await supabase
      .from("tournaments")
      .select("id, name")
      .ilike("name", name)
      .maybeSingle();

    if (existingByName) {
      throw new Error(`A tournament named "${existingByName.name}" already exists. Please choose a unique tournament name.`);
    }

    // 2. Validate and disambiguate URL Slug
    let slug =
      tournament.slug && tournament.slug.trim()
        ? tournament.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
        : name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    if (!slug) {
      slug = `tournament-${Date.now().toString(36)}`;
    }

    const { data: existingBySlug } = await supabase
      .from("tournaments")
      .select("id, slug")
      .eq("slug", slug)
      .maybeSingle();

    if (existingBySlug) {
      if (tournament.slug && tournament.slug.trim()) {
        throw new Error(`URL slug "${slug}" is already taken. Please specify a different slug.`);
      } else {
        slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
      }
    }

    // 3. Validate and ensure unique Room Code
    let roomCode =
      tournament.room_code && tournament.room_code.trim()
        ? tournament.room_code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "")
        : "";

    if (roomCode) {
      const { data: existingByCode } = await supabase
        .from("tournaments")
        .select("id, room_code")
        .eq("room_code", roomCode)
        .maybeSingle();

      if (existingByCode) {
        throw new Error(`Room code "${roomCode}" is already in use. Please enter a different room code.`);
      }
    } else {
      // Auto-generate a guaranteed unique room code
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        attempts++;
        const candidate = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { data: existing } = await supabase
          .from("tournaments")
          .select("id")
          .eq("room_code", candidate)
          .maybeSingle();
        if (!existing) {
          roomCode = candidate;
          isUnique = true;
        }
      }
      if (!roomCode) {
        roomCode = `R${Date.now().toString(36).toUpperCase().slice(-5)}`;
      }
    }

    const { data: authData } = await supabase.auth.getUser();
    const createdBy = authData?.user?.id ?? null;

    const { data, error } = await supabase
      .from("tournaments")
      .insert({
        name,
        slug,
        room_code: roomCode,
        description: tournament.description?.trim() || "",
        currency_symbol: tournament.currency_symbol?.trim() || "₹",
        currency_code: tournament.currency_code?.trim() || "INR",
        banner_url: tournament.banner_url || null,
        logo_url: tournament.logo_url || null,
        is_private: tournament.is_private || false,
        room_password: tournament.room_password?.trim() || "",
        admin_password: tournament.admin_password?.trim() || "admin123",
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create tournament room: ${error.message}`);

    // Create default auction_settings for the new tournament
    await supabase.from("auction_settings").insert({
      tournament_id: data.id,
      starting_budget: 10000000,
      max_players: 15,
      min_players: 11,
      max_overseas: 7,
      min_indians: 8,
      playing_xi_total: 11,
      playing_xi_max_overseas: 4,
      batsmen_min: 2,
      batsmen_max: 5,
      wk_min: 1,
      wk_max: 3,
      all_rounders_min: 1,
      bowlers_min: 2,
      enable_captain_multiplier: true,
      captain_multiplier: 2.0,
      vice_captain_multiplier: 1.5,
      bid_increment: 100000,
      default_base_price: 400000,
      teams_qualifying: 8,
    });

    return data as Tournament;
  }

  async updateTournament(
    id: number,
    updates: Partial<Tournament>,
  ): Promise<void> {
    const { error } = await supabase
      .from("tournaments")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw new Error(`Failed to update tournament: ${error.message}`);
  }

  async deleteTournament(id: number): Promise<void> {
    if (id === 1) {
      throw new Error("Default IPL 2025 tournament room cannot be deleted.");
    }
    // Cascade delete dependent records to prevent foreign key errors
    await Promise.allSettled([
      supabase.from("playing_xi").delete().eq("tournament_id", id),
      supabase.from("auction_log").delete().eq("tournament_id", id),
      supabase.from("auction_settings").delete().eq("tournament_id", id),
      supabase.from("players").delete().eq("tournament_id", id),
      supabase.from("teams").delete().eq("tournament_id", id),
      supabase.from("pools").delete().eq("tournament_id", id),
    ]);

    const { error } = await supabase.from("tournaments").delete().eq("id", id);
    if (error) throw new Error(`Failed to delete tournament room: ${error.message}`);
    if (this.activeTournamentId === id) {
      this.setActiveTournamentId(1);
    }
  }

  // Convert DB player row to the Player interface used by all UI components
  private toPlayer(row: DBPlayer, index: number): Player {
    const country = row.country || "India";
    const isOverseas = country.toLowerCase() !== "india";
    const isSold =
      row.status === "sold" &&
      (row.sold_price || 0) > 0 &&
      (row.sold_to_team || "").trim() !== "";
    const isUnsold = !isSold && (row.status === "unsold" || row.status === "Unsold");
    const status: "sold" | "unsold" | "available" = isSold
      ? "sold"
      : isUnsold
      ? "unsold"
      : "available";

    return {
      name: row.name,
      team: row.sold_to_team || "",
      role: row.role || "",
      nation: country,
      age: row.age || undefined,
      basePrice: Number(row.base_price) || 0,
      soldPrice: isSold ? Number(row.sold_price) || 0 : 0,
      status,
      overseas: isOverseas,
      points: row.eval_points || 0,
      originalIndex: index,
      images: row.image_url || "",
      t20Matches: row.t20_matches || undefined,
      isUnsold,
      dbId: row.id,
      runs: row.runs || undefined,
      battingSr: row.batting_sr ? Number(row.batting_sr) : undefined,
      wickets: row.wickets || undefined,
      economy: row.economy ? Number(row.economy) : undefined,
      poolId: row.pool_id ?? null,
      auctionOrder: row.auction_order ?? 0,
    };
  }

  private getTeamSlug(teamName: string): string {
    return teamName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  // ─── CLONING & TEMPLATE METHODS ───

  async cloneTournamentStructure(
    sourceTournamentId: number,
    targetTournamentId: number,
    options: {
      copyTeams?: boolean;
      copyPools?: boolean;
      copyPlayers?: boolean;
      copyRules?: boolean;
    } = { copyTeams: true, copyPools: true, copyPlayers: false, copyRules: true },
  ): Promise<void> {
    if (options.copyRules) {
      const { data: sourceRules } = await supabase
        .from("auction_settings")
        .select("*")
        .eq("tournament_id", sourceTournamentId)
        .maybeSingle();

      if (sourceRules) {
        const { id, created_at, updated_at, ...restRules } = sourceRules;
        await supabase
          .from("auction_settings")
          .upsert(
            { ...restRules, tournament_id: targetTournamentId },
            { onConflict: "tournament_id" },
          );
      }
    }

    const poolIdMap = new Map<number, number>();

    if (options.copyPools) {
      const { data: sourcePools } = await supabase
        .from("pools")
        .select("*")
        .eq("tournament_id", sourceTournamentId)
        .order("order_index", { ascending: true });

      if (sourcePools && sourcePools.length > 0) {
        for (const pool of sourcePools) {
          const { data: newPool } = await supabase
            .from("pools")
            .insert({
              tournament_id: targetTournamentId,
              name: pool.name,
              order_index: pool.order_index,
            })
            .select("id")
            .single();

          if (newPool) {
            poolIdMap.set(pool.id, newPool.id);
          }
        }
      }
    }

    if (options.copyTeams) {
      const { data: sourceTeams } = await supabase
        .from("teams")
        .select("*")
        .eq("tournament_id", sourceTournamentId);

      if (sourceTeams && sourceTeams.length > 0) {
        const teamsToInsert = sourceTeams.map((t: DBTeam) => ({
          tournament_id: targetTournamentId,
          name: t.name,
          slug: t.slug,
          logo_url: t.logo_url,
          border_color: t.border_color,
          bg_gradient: t.bg_gradient,
          starting_budget: t.starting_budget,
        }));
        await supabase.from("teams").insert(teamsToInsert);
      }
    }

    if (options.copyPlayers) {
      const { data: sourcePlayers } = await supabase
        .from("players")
        .select("*")
        .eq("tournament_id", sourceTournamentId);

      if (sourcePlayers && sourcePlayers.length > 0) {
        const playersToInsert = sourcePlayers.map((p: DBPlayer) => ({
          tournament_id: targetTournamentId,
          name: p.name,
          age: p.age,
          country: p.country,
          t20_matches: p.t20_matches,
          runs: p.runs,
          batting_sr: p.batting_sr,
          wickets: p.wickets,
          economy: p.economy,
          eval_points: p.eval_points,
          base_price: p.base_price,
          role: p.role,
          image_url: p.image_url,
          status: "pending",
          sold_price: 0,
          sold_to_team: null,
          pool_id: p.pool_id ? poolIdMap.get(p.pool_id) || null : null,
          auction_order: p.auction_order || 0,
        }));
        await supabase.from("players").insert(playersToInsert);
      }
    }
  }

  // ─── READ METHODS ───

  async getPlayers(tournamentId?: number): Promise<Player[]> {
    const tId = tournamentId ?? this.activeTournamentId;
    const [playersRes, poolsRes] = await Promise.all([
      supabase
        .from("players")
        .select("*")
        .eq("tournament_id", tId)
        .order("id", { ascending: true }),
      supabase
        .from("pools")
        .select("id, order_index")
        .eq("tournament_id", tId)
        .order("order_index", { ascending: true }),
    ]);

    if (playersRes.error) {
      console.error("Failed to fetch players:", playersRes.error.message);
      return [];
    }

    const poolOrderMap = new Map<number, number>();
    (poolsRes.data || []).forEach((p: { id: number; order_index: number }, idx: number) => {
      poolOrderMap.set(p.id, p.order_index ?? idx + 1);
    });

    const mapped = (playersRes.data || []).map((row: DBPlayer, index: number) =>
      this.toPlayer(row, index),
    );

    // Sort by pool sequence first, then by auction_order, then by dbId
    return mapped.sort((a, b) => {
      const poolA = a.poolId ? poolOrderMap.get(a.poolId) ?? 9999 : 99999;
      const poolB = b.poolId ? poolOrderMap.get(b.poolId) ?? 9999 : 99999;
      if (poolA !== poolB) {
        return poolA - poolB;
      }
      const orderA = a.auctionOrder ?? 0;
      const orderB = b.auctionOrder ?? 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return (a.dbId ?? 0) - (b.dbId ?? 0);
    });
  }

  async getTeamStats(tournamentId?: number): Promise<TeamStats[]> {
    const tId = tournamentId ?? this.activeTournamentId;
    const { data: teamsData, error: teamsError } = await supabase
      .from("teams")
      .select("*")
      .eq("tournament_id", tId)
      .order("name", { ascending: true });

    if (teamsError || !teamsData) {
      console.error("Failed to fetch teams:", teamsError?.message);
      return [];
    }

    const players = await this.getPlayers(tId);

    return teamsData.map((team: DBTeam) => {
      const teamSlug = team.slug;
      const teamName = team.name;

      // Find sold players for this team
      const teamPlayers = players.filter(
        (p) =>
          p.status === "sold" &&
          (p.team.toLowerCase().includes(teamSlug.toLowerCase()) ||
            p.team.toLowerCase().includes(teamName.toLowerCase())),
      );

      const totalSpent = teamPlayers.reduce(
        (sum, p) => sum + (p.soldPrice || 0),
        0,
      );
      const overseasCount = teamPlayers.filter((p) => p.overseas).length;
      const totalPoints = teamPlayers.reduce(
        (sum, p) => sum + (p.points || 0),
        0,
      );

      return {
        teamId: teamSlug,
        teamName: teamName,
        totalSpent,
        playersCount: teamPlayers.length,
        overseasCount,
        fundsRemaining: Number(team.starting_budget) - totalSpent,
        totalPoints,
        startingBudget: Number(team.starting_budget),
        logoUrl: team.logo_url || this.getTeamLogo(teamName),
        borderColor: team.border_color || this.getTeamBorderColor(teamName),
        bgGradient: team.bg_gradient || this.getTeamGradient(teamName),
      };
    });
  }

  async getLeaderboard(tournamentId?: number): Promise<TeamStats[]> {
    const tId = tournamentId ?? this.activeTournamentId;
    const teamStats = await this.getTeamStats(tId);
    return teamStats.sort((a, b) => {
      if (a.totalPoints !== b.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      if (a.fundsRemaining !== b.fundsRemaining) {
        return b.fundsRemaining - a.fundsRemaining;
      }
      return a.teamName.toLowerCase().localeCompare(b.teamName.toLowerCase());
    });
  }

  async getSoldPlayersByTeam(teamId: string, tournamentId?: number): Promise<Player[]> {
    const tId = tournamentId ?? this.activeTournamentId;
    const players = await this.getPlayers(tId);
    const teamConfigs = await this.getTeamConfigs(tId);
    const team = teamConfigs.find((t: Team) => t.id === teamId);

    if (!team) return [];

    return players.filter(
      (p) =>
        p.status === "sold" &&
        (p.team.toLowerCase().includes(teamId.toLowerCase()) ||
          p.team.toLowerCase().includes(team.name.toLowerCase())),
    );
  }

  async getUnsoldPlayers(tournamentId?: number): Promise<Player[]> {
    const tId = tournamentId ?? this.activeTournamentId;
    const players = await this.getPlayers(tId);
    return players.filter((p) => p.status === "unsold");
  }

  async getTeamConfigs(tournamentId?: number): Promise<Team[]> {
    const tId = tournamentId ?? this.activeTournamentId;
    // Fetch raw teams from DB to get branding columns
    const { data: teamsData } = await supabase
      .from("teams")
      .select("*")
      .eq("tournament_id", tId)
      .order("name", { ascending: true });

    const teamStats = await this.getTeamStats(tId);

    return teamStats.map((stat) => {
      // Find the DB row for this team to get logo/border/gradient
      const dbTeam = (teamsData || []).find(
        (t: DBTeam) => t.slug === stat.teamId,
      );

      return {
        id: stat.teamId,
        name: stat.teamName,
        logo: dbTeam?.logo_url || this.getTeamLogo(stat.teamName),
        fundsRemaining: stat.fundsRemaining,
        overseasPlayers: stat.overseasCount,
        totalPlayers: stat.playersCount,
        borderColor: dbTeam?.border_color || this.getTeamBorderColor(stat.teamName),
        bgGradient: dbTeam?.bg_gradient || this.getTeamGradient(stat.teamName),
        tournamentId: tId,
      };
    });
  }

  // Compatibility method -- no-op since we don't use client-side cache anymore
  clearCache(): void {
    // No-op: Supabase handles caching via React Query
  }

  // ─── WRITE METHODS (for auction + admin) ───

  async markPlayerSold(
    playerName: string,
    teamName: string,
    price: number,
    tournamentId?: number,
  ): Promise<void> {
    const tId = tournamentId ?? this.activeTournamentId;
    const { error } = await supabase
      .from("players")
      .update({
        status: "sold",
        sold_price: price,
        sold_to_team: teamName,
        sold_at: new Date().toISOString(),
      })
      .eq("name", playerName)
      .eq("tournament_id", tId);

    if (error) throw new Error(`Failed to mark player sold: ${error.message}`);

    // Log the action
    const { data: playerRow } = await supabase
      .from("players")
      .select("id")
      .eq("name", playerName)
      .eq("tournament_id", tId)
      .maybeSingle();

    await supabase.from("auction_log").insert({
      tournament_id: tId,
      player_id: playerRow?.id || null,
      player_name: playerName,
      team_name: teamName,
      action: "sold",
      final_price: price,
      performed_by: (await supabase.auth.getUser()).data.user?.email || "unknown",
    });
  }

  async markPlayerUnsold(playerName: string, tournamentId?: number): Promise<void> {
    const tId = tournamentId ?? this.activeTournamentId;
    const { error } = await supabase
      .from("players")
      .update({
        status: "unsold",
        sold_price: 0,
        sold_to_team: null,
        sold_at: null,
      })
      .eq("name", playerName)
      .eq("tournament_id", tId);

    if (error)
      throw new Error(`Failed to mark player unsold: ${error.message}`);

    const { data: playerRow } = await supabase
      .from("players")
      .select("id")
      .eq("name", playerName)
      .eq("tournament_id", tId)
      .maybeSingle();

    await supabase.from("auction_log").insert({
      tournament_id: tId,
      player_id: playerRow?.id || null,
      player_name: playerName,
      team_name: null,
      action: "unsold",
      final_price: 0,
      performed_by: (await supabase.auth.getUser()).data.user?.email || "unknown",
    });
  }

  async returnPlayerToAvailable(
    playerNameOrId: string | number,
    tournamentId?: number,
  ): Promise<void> {
    const tId = tournamentId ?? this.activeTournamentId;
    const isId = typeof playerNameOrId === "number";

    // 1. Update player status in players table to 'pending'
    const query = supabase
      .from("players")
      .update({
        status: "pending",
        sold_price: 0,
        sold_to_team: null,
        sold_at: null,
      })
      .eq("tournament_id", tId);

    const { error } = isId
      ? await query.eq("id", playerNameOrId)
      : await query.eq("name", playerNameOrId);

    // 2. Remove all unsold and sold log entries for this player in this tournament
    if (isId) {
      await supabase
        .from("auction_log")
        .delete()
        .eq("tournament_id", tId)
        .eq("player_id", playerNameOrId);
    } else {
      await supabase
        .from("auction_log")
        .delete()
        .eq("tournament_id", tId)
        .eq("player_name", playerNameOrId);
    }
  }

  async undoLastAction(
    tournamentId?: number,
  ): Promise<{ playerName: string; action: string } | null> {
    const tId = tournamentId ?? this.activeTournamentId;
    // Get the most recent auction log entry for this tournament
    const { data: lastLog } = await supabase
      .from("auction_log")
      .select("*")
      .eq("tournament_id", tId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!lastLog) return null;

    // Reverse the action
    if (lastLog.action === "sold") {
      await supabase
        .from("players")
        .update({
          status: "pending",
          sold_price: 0,
          sold_to_team: null,
          sold_at: null,
        })
        .eq("tournament_id", tId)
        .eq("name", lastLog.player_name);

      // Remove the sold log
      await supabase.from("auction_log").delete().eq("id", lastLog.id);
    } else if (lastLog.action === "unsold") {
      // Return unsold player back to pending status
      await supabase
        .from("players")
        .update({
          status: "pending",
          sold_price: 0,
          sold_to_team: null,
          sold_at: null,
        })
        .eq("tournament_id", tId)
        .eq("name", lastLog.player_name);

      // Remove the unsold log entry so auction log and player status are in sync
      await supabase.from("auction_log").delete().eq("id", lastLog.id);
    }

    return {
      playerName: lastLog.player_name,
      action: lastLog.action,
    };
  }

  // ─── ADMIN METHODS ───

  async addPlayer(player: Partial<DBPlayer>, tournamentId?: number): Promise<void> {
    const tId = tournamentId ?? player.tournament_id ?? this.activeTournamentId;
    const { error } = await supabase.from("players").insert({
      ...player,
      tournament_id: tId,
    });
    if (error) throw new Error(`Failed to add player: ${error.message}`);
  }

  async updatePlayer(
    id: number,
    data: Partial<DBPlayer>,
    tournamentId?: number,
  ): Promise<void> {
    const tId = tournamentId ?? this.activeTournamentId;
    const { error } = await supabase
      .from("players")
      .update(data)
      .eq("id", id)
      .eq("tournament_id", tId);
    if (error) throw new Error(`Failed to update player: ${error.message}`);

    // If status is changed to pending, remove any unsold logs for this player
    if (data.status === "pending") {
      await supabase
        .from("auction_log")
        .delete()
        .eq("tournament_id", tId)
        .eq("player_id", id)
        .eq("action", "unsold");
    }
  }

  async deletePlayer(id: number, tournamentId?: number): Promise<void> {
    const tId = tournamentId ?? this.activeTournamentId;
    // Delete any auction_log entries referencing this player first
    await supabase
      .from("auction_log")
      .delete()
      .eq("tournament_id", tId)
      .eq("player_id", id);
    // Delete the player row from database
    const { error } = await supabase
      .from("players")
      .delete()
      .eq("id", id)
      .eq("tournament_id", tId);
    if (error) throw new Error(`Failed to delete player: ${error.message}`);
  }

  async updateTeamBudget(
    teamSlug: string,
    budget: number,
    tournamentId?: number,
  ): Promise<void> {
    const tId = tournamentId ?? this.activeTournamentId;
    const { error } = await supabase
      .from("teams")
      .update({ starting_budget: budget })
      .eq("slug", teamSlug)
      .eq("tournament_id", tId);
    if (error) throw new Error(`Failed to update budget: ${error.message}`);
  }

  async createTeam(
    team: {
      name: string;
      slug?: string;
      logo_url?: string;
      border_color?: string;
      bg_gradient?: string;
      starting_budget?: number;
    },
    tournamentId?: number,
  ): Promise<void> {
    const tId = tournamentId ?? this.activeTournamentId;
    const slug =
      team.slug && team.slug.trim()
        ? team.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")
        : team.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

    const { error } = await supabase.from("teams").insert({
      tournament_id: tId,
      name: team.name.trim(),
      slug,
      logo_url: team.logo_url || null,
      border_color: team.border_color || "#fe6804",
      bg_gradient:
        team.bg_gradient ||
        "bg-[linear-gradient(135deg,rgba(254,104,4,0.95)_0%,rgba(200,80,0,0.85)_100%)]",
      starting_budget: team.starting_budget || 10000000,
    });

    if (error) throw new Error(`Failed to create team: ${error.message}`);
  }

  async updateTeam(
    slug: string,
    updates: {
      name?: string;
      logo_url?: string;
      border_color?: string;
      bg_gradient?: string;
      starting_budget?: number;
    },
    tournamentId?: number,
  ): Promise<void> {
    const tId = tournamentId ?? this.activeTournamentId;
    const { error } = await supabase
      .from("teams")
      .update(updates)
      .eq("slug", slug)
      .eq("tournament_id", tId);

    if (error) throw new Error(`Failed to update team: ${error.message}`);
  }

  async deleteTeam(slug: string, tournamentId?: number): Promise<void> {
    const tId = tournamentId ?? this.activeTournamentId;
    const { data: teamRow } = await supabase
      .from("teams")
      .select("name, slug")
      .eq("slug", slug)
      .eq("tournament_id", tId)
      .maybeSingle();

    const teamName = teamRow?.name || slug;

    // Reset any players that were assigned or sold to this team back to pending
    await supabase
      .from("players")
      .update({
        sold_to_team: null,
        sold_price: 0,
        status: "pending",
        sold_at: null,
      })
      .eq("tournament_id", tId)
      .or(`sold_to_team.eq.${slug},sold_to_team.eq.${teamName}`);

    // Clean up auction log for this team
    await supabase
      .from("auction_log")
      .delete()
      .eq("tournament_id", tId)
      .eq("team_name", teamName);

    // Clean up playing xi for this team
    await supabase
      .from("playing_xi")
      .delete()
      .eq("tournament_id", tId)
      .eq("team_slug", slug);

    // Delete team from database
    const { error } = await supabase
      .from("teams")
      .delete()
      .eq("slug", slug)
      .eq("tournament_id", tId);
    if (error) throw new Error(`Failed to delete team: ${error.message}`);
  }

  async uploadImage(
    bucket: "player-images" | "team-logos",
    file: File,
  ): Promise<string> {
    const ext = file.name.split(".").pop() || "png";
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = `${filename}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { cacheControl: "3600", upsert: true });

    if (uploadError) {
      throw new Error(`Upload to ${bucket} failed: ${uploadError.message}`);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  }

  async uploadImageFromUrl(
    bucket: "player-images" | "team-logos",
    url: string,
  ): Promise<string> {
    const trimmed = url.trim();
    if (!trimmed) return "";

    // If it's already a local relative path or already in Supabase storage, keep as-is
    if (trimmed.startsWith("/") || trimmed.includes("supabase.co/storage/v1/object/public/")) {
      return trimmed;
    }

    try {
      // Abort the external fetch if it takes too long so a slow/unreachable
      // image host never blocks the import (falls back to the original URL).
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      let response: Response;
      try {
        response = await fetch(trimmed, { signal: controller.signal });
        if (!response.ok) return trimmed;
      } finally {
        clearTimeout(timeout);
      }

      const blob = await response.blob();
      const contentType = blob.type || "image/png";
      const ext = contentType.includes("jpeg") || contentType.includes("jpg")
        ? "jpg"
        : contentType.includes("webp")
        ? "webp"
        : contentType.includes("svg")
        ? "svg"
        : "png";

      const filename = `url-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filename, blob, { contentType, cacheControl: "3600", upsert: true });

      if (uploadError) {
        console.warn(`Failed to store external image in bucket ${bucket}:`, uploadError.message);
        return trimmed;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
      return data.publicUrl || trimmed;
    } catch (err) {
      console.warn(`Could not download external image to bucket:`, err);
      return trimmed;
    }
  }

  // ─── POOLS & SETS MANAGEMENT ───

  async getPools(tournamentId?: number): Promise<Pool[]> {
    const tId = tournamentId ?? this.activeTournamentId;
    const { data: poolsData, error: poolsError } = await supabase
      .from("pools")
      .select("*")
      .eq("tournament_id", tId)
      .order("order_index", { ascending: true });

    if (poolsError) {
      console.error("Failed to fetch pools:", poolsError.message);
      return [];
    }

    // Get player counts per pool for this tournament
    const { data: playersData } = await supabase
      .from("players")
      .select("pool_id")
      .eq("tournament_id", tId);

    const counts: Record<number, number> = {};
    (playersData || []).forEach((p: { pool_id: number | null }) => {
      if (p.pool_id) {
        counts[p.pool_id] = (counts[p.pool_id] || 0) + 1;
      }
    });

    return (poolsData || []).map((row: DBPool) => ({
      id: row.id,
      tournamentId: tId,
      name: row.name,
      orderIndex: row.order_index,
      playerCount: counts[row.id] || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async createPool(name: string, orderIndex?: number, tournamentId?: number): Promise<Pool> {
    const tId = tournamentId ?? this.activeTournamentId;
    let nextOrder = orderIndex;
    if (nextOrder === undefined) {
      const { data } = await supabase
        .from("pools")
        .select("order_index")
        .eq("tournament_id", tId)
        .order("order_index", { ascending: false })
        .limit(1)
        .maybeSingle();
      nextOrder = (data?.order_index || 0) + 1;
    }

    const { data, error } = await supabase
      .from("pools")
      .insert({
        tournament_id: tId,
        name: name.trim(),
        order_index: nextOrder,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create pool: ${error.message}`);
    return {
      id: data.id,
      tournamentId: tId,
      name: data.name,
      orderIndex: data.order_index,
      playerCount: 0,
    };
  }

  async updatePool(
    id: number,
    updates: { name?: string; orderIndex?: number },
    tournamentId?: number,
  ): Promise<void> {
    const tId = tournamentId ?? this.activeTournamentId;
    const payload: { name?: string; order_index?: number; updated_at?: string } = {
      updated_at: new Date().toISOString(),
    };
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.orderIndex !== undefined) payload.order_index = updates.orderIndex;

    const { error } = await supabase
      .from("pools")
      .update(payload)
      .eq("id", id)
      .eq("tournament_id", tId);
    if (error) throw new Error(`Failed to update pool: ${error.message}`);
  }

  async deletePool(id: number, tournamentId?: number): Promise<void> {
    const tId = tournamentId ?? this.activeTournamentId;
    // Unassign players first
    await supabase
      .from("players")
      .update({ pool_id: null, auction_order: 0 })
      .eq("pool_id", id)
      .eq("tournament_id", tId);
    const { error } = await supabase
      .from("pools")
      .delete()
      .eq("id", id)
      .eq("tournament_id", tId);
    if (error) throw new Error(`Failed to delete pool: ${error.message}`);
  }

  async reorderPools(orderedPoolIds: number[], tournamentId?: number): Promise<void> {
    const tId = tournamentId ?? this.activeTournamentId;
    for (let i = 0; i < orderedPoolIds.length; i++) {
      await supabase
        .from("pools")
        .update({ order_index: i + 1, updated_at: new Date().toISOString() })
        .eq("id", orderedPoolIds[i])
        .eq("tournament_id", tId);
    }
  }

  async assignPlayerToPool(
    playerId: number,
    poolId: number | null,
    auctionOrder?: number,
    tournamentId?: number,
  ): Promise<void> {
    const tId = tournamentId ?? this.activeTournamentId;
    let order = auctionOrder;
    if (order === undefined && poolId) {
      const { data } = await supabase
        .from("players")
        .select("auction_order")
        .eq("tournament_id", tId)
        .eq("pool_id", poolId)
        .order("auction_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      order = (data?.auction_order || 0) + 1;
    }

    const { error } = await supabase
      .from("players")
      .update({
        pool_id: poolId,
        auction_order: poolId ? (order ?? 1) : 0,
      })
      .eq("id", playerId)
      .eq("tournament_id", tId);

    if (error) throw new Error(`Failed to assign player: ${error.message}`);
  }

  async reorderPlayersInPool(
    poolId: number | null,
    orderedPlayerIds: number[],
    tournamentId?: number,
  ): Promise<void> {
    const tId = tournamentId ?? this.activeTournamentId;
    for (let i = 0; i < orderedPlayerIds.length; i++) {
      await supabase
        .from("players")
        .update({ auction_order: i + 1 })
        .eq("id", orderedPlayerIds[i])
        .eq("tournament_id", tId);
    }
  }

  async autoGroupByRole(tournamentId?: number): Promise<{ poolsCreated: number; playersAssigned: number }> {
    const tId = tournamentId ?? this.activeTournamentId;
    const rolesConfig = [
      { name: "Set 1: Batsmen", role: "Batsman" },
      { name: "Set 2: Bowlers", role: "Bowler" },
      { name: "Set 3: All Rounders", role: "All Rounder" },
      { name: "Set 4: Wicket Keepers", role: "Wicket Keeper" },
    ];

    let poolsCreated = 0;
    let playersAssigned = 0;

    for (let i = 0; i < rolesConfig.length; i++) {
      const { name, role } = rolesConfig[i];
      let { data: existingPool } = await supabase
        .from("pools")
        .select("id")
        .eq("tournament_id", tId)
        .eq("name", name)
        .maybeSingle();

      let poolId = existingPool?.id;
      if (!poolId) {
        const { data: newPool, error: createError } = await supabase
          .from("pools")
          .insert({ tournament_id: tId, name, order_index: i + 1 })
          .select("id")
          .single();
        if (createError) throw new Error(`Failed to create set: ${createError.message}`);
        poolId = newPool.id;
        poolsCreated++;
      } else {
        await supabase
          .from("pools")
          .update({ order_index: i + 1 })
          .eq("id", poolId)
          .eq("tournament_id", tId);
      }

      const { data: rolePlayers } = await supabase
        .from("players")
        .select("id")
        .eq("tournament_id", tId)
        .eq("role", role)
        .order("eval_points", { ascending: false })
        .order("base_price", { ascending: false });

      if (rolePlayers && rolePlayers.length > 0) {
        for (let j = 0; j < rolePlayers.length; j++) {
          await supabase
            .from("players")
            .update({ pool_id: poolId, auction_order: j + 1 })
            .eq("id", rolePlayers[j].id)
            .eq("tournament_id", tId);
          playersAssigned++;
        }
      }
    }

    return { poolsCreated, playersAssigned };
  }

  async poolUnsoldPlayers(
    poolName = "Accelerated Round - Unsold Players",
    tournamentId?: number,
  ): Promise<{ pool: Pool; count: number }> {
    const tId = tournamentId ?? this.activeTournamentId;
    let { data: existingPool } = await supabase
      .from("pools")
      .select("*")
      .eq("tournament_id", tId)
      .eq("name", poolName)
      .maybeSingle();

    let pool: Pool;
    if (existingPool) {
      pool = {
        id: existingPool.id,
        tournamentId: tId,
        name: existingPool.name,
        orderIndex: existingPool.order_index,
      };
    } else {
      const { data: maxOrder } = await supabase
        .from("pools")
        .select("order_index")
        .eq("tournament_id", tId)
        .order("order_index", { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextOrder = (maxOrder?.order_index || 0) + 1;
      const { data: newPool, error } = await supabase
        .from("pools")
        .insert({ tournament_id: tId, name: poolName, order_index: nextOrder })
        .select()
        .single();
      if (error) throw new Error(`Failed to create unsold pool: ${error.message}`);
      pool = {
        id: newPool.id,
        tournamentId: tId,
        name: newPool.name,
        orderIndex: newPool.order_index,
      };
    }

    // Fetch players marked unsold by status in this tournament
    const { data: unsoldByStatus } = await supabase
      .from("players")
      .select("id")
      .eq("tournament_id", tId)
      .or("status.eq.unsold,status.eq.Unsold")
      .order("eval_points", { ascending: false });

    // Fetch players recorded as unsold in auction logs for this tournament
    const { data: unsoldLogs } = await supabase
      .from("auction_log")
      .select("player_name")
      .eq("tournament_id", tId)
      .eq("action", "unsold");

    const playerIdsSet = new Set<number>();
    (unsoldByStatus || []).forEach((p: { id: number }) => playerIdsSet.add(p.id));

    if (unsoldLogs && unsoldLogs.length > 0) {
      const logNames = unsoldLogs.map((l: { player_name: string }) => l.player_name).filter(Boolean);
      if (logNames.length > 0) {
        const { data: playersFromLogs } = await supabase
          .from("players")
          .select("id")
          .eq("tournament_id", tId)
          .in("name", logNames);
        (playersFromLogs || []).forEach((p: { id: number }) => playerIdsSet.add(p.id));
      }
    }

    const playerIds = Array.from(playerIdsSet);
    if (playerIds.length > 0) {
      await Promise.all([
        ...playerIds.map((id, idx) =>
          supabase
            .from("players")
            .update({
              pool_id: pool.id,
              auction_order: idx + 1,
              status: "pending",
              sold_price: 0,
              sold_to_team: null,
              sold_at: null,
            })
            .eq("id", id)
            .eq("tournament_id", tId)
        ),
        supabase
          .from("auction_log")
          .delete()
          .eq("tournament_id", tId)
          .eq("action", "unsold"),
      ]);
    }

    return { pool, count: playerIds.length };
  }

  async seedOfficialTeams(tournamentId?: number): Promise<void> {
    const tId = tournamentId ?? this.activeTournamentId;
    const officialTeams = [
      {
        tournament_id: tId,
        name: "Chennai Super Kings",
        slug: "chennai-super-kings",
        logo_url: "/images/teams/csk.jpg",
        border_color: "#F9CD00",
        bg_gradient:
          "bg-[linear-gradient(135deg,rgba(180,140,0,0.95)_0%,rgba(140,110,0,0.85)_45%,rgba(100,80,0,0.9)_100%)]",
        starting_budget: 10000000,
      },
      {
        tournament_id: tId,
        name: "Mumbai Indians",
        slug: "mumbai-indians",
        logo_url: "/images/teams/mi.jpg",
        border_color: "#045093",
        bg_gradient:
          "bg-[linear-gradient(135deg,rgba(4,80,147,0.95)_0%,rgba(2,50,93,0.85)_45%,rgba(1,30,70,0.9)_100%)]",
        starting_budget: 10000000,
      },
      {
        tournament_id: tId,
        name: "Royal Challengers Bengaluru",
        slug: "royal-challengers-bengaluru",
        logo_url: "/images/teams/rcb.jpg",
        border_color: "#DA1212",
        bg_gradient:
          "bg-[linear-gradient(135deg,rgba(218,18,18,0.95)_0%,rgba(180,15,15,0.85)_45%,rgba(140,10,10,0.9)_100%)]",
        starting_budget: 10000000,
      },
      {
        tournament_id: tId,
        name: "Kolkata Knight Riders",
        slug: "kolkata-knight-riders",
        logo_url: "/images/teams/kkr.jpeg",
        border_color: "#3E1F47",
        bg_gradient:
          "bg-[linear-gradient(135deg,rgba(62,31,71,0.95)_0%,rgba(45,20,55,0.85)_45%,rgba(30,15,40,0.9)_100%)]",
        starting_budget: 10000000,
      },
      {
        tournament_id: tId,
        name: "Delhi Capitals",
        slug: "delhi-capitals",
        logo_url: "/images/teams/dc.jpg",
        border_color: "#004C97",
        bg_gradient:
          "bg-[linear-gradient(135deg,rgba(0,76,151,0.95)_0%,rgba(0,60,120,0.85)_45%,rgba(0,45,95,0.9)_100%)]",
        starting_budget: 10000000,
      },
      {
        tournament_id: tId,
        name: "Sunrisers Hyderabad",
        slug: "sunrisers-hyderabad",
        logo_url: "/images/teams/srh.webp",
        border_color: "#F26522",
        bg_gradient:
          "bg-[linear-gradient(135deg,rgba(242,101,34,0.95)_0%,rgba(200,80,25,0.85)_45%,rgba(160,65,20,0.9)_100%)]",
        starting_budget: 10000000,
      },
      {
        tournament_id: tId,
        name: "Rajasthan Royals",
        slug: "rajasthan-royals",
        logo_url: "/images/teams/rr.png",
        border_color: "#EA1A8C",
        bg_gradient:
          "bg-[linear-gradient(135deg,rgba(234,26,140,0.95)_0%,rgba(190,20,115,0.85)_45%,rgba(150,15,90,0.9)_100%)]",
        starting_budget: 10000000,
      },
      {
        tournament_id: tId,
        name: "Punjab Kings",
        slug: "punjab-kings",
        logo_url: "/images/teams/pbks.png",
        border_color: "#C8102E",
        bg_gradient:
          "bg-[linear-gradient(135deg,rgba(200,16,46,0.95)_0%,rgba(160,10,35,0.85)_45%,rgba(120,8,25,0.9)_100%)]",
        starting_budget: 10000000,
      },
      {
        tournament_id: tId,
        name: "Gujarat Titans",
        slug: "gujarat-titans",
        logo_url: "/images/teams/gt.png",
        border_color: "#0A1931",
        bg_gradient:
          "bg-[linear-gradient(135deg,rgba(10,25,49,0.95)_0%,rgba(7,20,40,0.85)_45%,rgba(5,15,30,0.9)_100%)]",
        starting_budget: 10000000,
      },
      {
        tournament_id: tId,
        name: "Lucknow Super Giants",
        slug: "lucknow-super-giants",
        logo_url: "/images/teams/lsg.png",
        border_color: "#0097A7",
        bg_gradient:
          "bg-[linear-gradient(135deg,rgba(0,151,167,0.95)_0%,rgba(0,120,135,0.85)_45%,rgba(0,90,110,0.9)_100%)]",
        starting_budget: 10000000,
      },
    ];

    for (const t of officialTeams) {
      await supabase.from("teams").upsert(t, { onConflict: "tournament_id,slug" });
    }
  }

  async resetAuction(tournamentId?: number): Promise<void> {
    const tId = tournamentId ?? this.activeTournamentId;
    await supabase
      .from("players")
      .update({
        status: "pending",
        sold_price: 0,
        sold_to_team: null,
        sold_at: null,
      })
      .eq("tournament_id", tId);

    await supabase.from("auction_log").delete().eq("tournament_id", tId);
  }

  async getUnsoldPlayerNames(tournamentId?: number): Promise<Set<string>> {
    const tId = tournamentId ?? this.activeTournamentId;
    try {
      const { data, error } = await supabase
        .from("auction_log")
        .select("player_name")
        .eq("tournament_id", tId)
        .eq("action", "unsold");
      if (error || !data) return new Set();
      return new Set(data.map((r: { player_name: string }) => r.player_name));
    } catch {
      return new Set();
    }
  }

  async clearAllUnsold(tournamentId?: number): Promise<number> {
    const tId = tournamentId ?? this.activeTournamentId;
    try {
      // 1. Update players with status 'pending' (matching DB check constraint)
      const { data, error } = await supabase
        .from("players")
        .update({
          status: "pending",
          sold_price: 0,
          sold_to_team: null,
          sold_at: null,
        })
        .eq("tournament_id", tId)
        .or("status.eq.unsold,status.eq.Unsold")
        .select("id");

      let updatedCount = data ? data.length : 0;
      if (error) {
        console.error("clearAllUnsold update error:", error.message);
        return 0;
      }

      await supabase
        .from("auction_log")
        .delete()
        .eq("tournament_id", tId)
        .eq("action", "unsold");
      return updatedCount;
    } catch (e) {
      console.error("clearAllUnsold error:", e);
      return 0;
    }
  }

  async bulkImportPlayers(
    players: Array<{
      name: string;
      age?: number;
      country?: string;
      t20_matches?: number;
      runs?: number;
      batting_sr?: number;
      wickets?: number;
      economy?: number;
      eval_points?: number;
      base_price?: number;
      role: string;
      image_url?: string;
    }>,
    tournamentId?: number,
  ): Promise<{ inserted: number; errors: string[] }> {
    const tId = tournamentId ?? this.activeTournamentId;
    const errors: string[] = [];
    let inserted = 0;

    const normalizeRole = (r?: string): string => {
      const lower = (r || "").toLowerCase().replace(/[-_\s]+/g, "");
      if (lower.includes("all") || lower.includes("ar") || lower.includes("round"))
        return "All Rounder";
      if (lower.includes("keep") || lower.includes("wk") || lower.includes("wicket"))
        return "Wicket Keeper";
      if (lower.includes("bowl")) return "Bowler";
      return "Batsman";
    };

    // Only re-host external images when a real Supabase session exists. Room-
    // admin sessions (room code + admin password) have no JWT, so storage
    // uploads would fail anyway — re-hosting them would just stall the import.
    let resolvedImages: (string | null | undefined)[] = players.map((p) => p.image_url?.trim() || null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        resolvedImages = await mapLimit(players, 6, async (p) => {
          const raw = p.image_url?.trim() || null;
          if (
            raw &&
            (raw.startsWith("http://") || raw.startsWith("https://")) &&
            !raw.includes("supabase.co/storage/v1/object/public/")
          ) {
            return this.uploadImageFromUrl("player-images", raw);
          }
          return raw;
        });
      }
    } catch {
      // No session / unreadable — keep original URLs, import must not stall.
    }

    // Build clean rows first, then insert in chunks (much faster than one-by-
    // one round trips for large rosters).
    const rows: Array<Record<string, unknown>> = [];
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (!p.name || !p.name.trim()) {
        errors.push(`Row ${i + 2}: Player name is missing`);
        continue;
      }

      rows.push({
        tournament_id: tId,
        name: p.name.trim(),
        age: p.age && !isNaN(Number(p.age)) ? Number(p.age) : null,
        country: p.country?.trim() || "India",
        t20_matches: p.t20_matches && !isNaN(Number(p.t20_matches)) ? Number(p.t20_matches) : 0,
        runs: p.runs && !isNaN(Number(p.runs)) ? Number(p.runs) : null,
        batting_sr: p.batting_sr && !isNaN(Number(p.batting_sr)) ? Number(p.batting_sr) : null,
        wickets: p.wickets && !isNaN(Number(p.wickets)) ? Number(p.wickets) : null,
        economy: p.economy && !isNaN(Number(p.economy)) ? Number(p.economy) : null,
        eval_points: p.eval_points && !isNaN(Number(p.eval_points)) ? Number(p.eval_points) : 0,
        base_price: p.base_price && !isNaN(Number(p.base_price)) ? Number(p.base_price) : 400000,
        role: normalizeRole(p.role),
        image_url: resolvedImages[i],
        status: "pending",
        sold_price: 0,
      });
    }

    const CHUNK = 100;
    for (let start = 0; start < rows.length; start += CHUNK) {
      const chunk = rows.slice(start, start + CHUNK);
      const { error } = await supabase.from("players").insert(chunk);
      if (error) {
        errors.push(`Rows ${start + 2}-${start + 2 + chunk.length - 1}: ${error.message}`);
      } else {
        inserted += chunk.length;
      }
    }

    return { inserted, errors };
  }

  // ─── DEFAULT PLAYER TEMPLATE (SEED FROM players_rows.sql) ───

  /**
   * Seeds the default 166-player IPL template (from players_rows.sql) into the
   * given tournament. Each player's external headshot image is re-hosted into
   * the Supabase `player-images` bucket first so the dataset never depends on
   * external URLs that could vanish and take the whole roster with them.
   *
   * This is the canonical "default player list" template shared with every
   * tournament room: any admin can load it into their own room with one click.
   */
  async seedDefaultPlayers(
    tournamentId?: number,
  ): Promise<{ inserted: number; skipped: number; errors: string[] }> {
    const tId = tournamentId ?? this.activeTournamentId;
    const errors: string[] = [];
    let inserted = 0;
    let skipped = 0;

    // Find which default players already exist in this tournament to avoid dupes
    const { data: existing } = await supabase
      .from("players")
      .select("id, name")
      .eq("tournament_id", tId)
      .in("name", DEFAULT_PLAYERS.map((p) => p.name));

    const existingNames = new Set<string>(
      (existing || []).map((p: { name: string }) => p.name),
    );

    // Candidates that need to be inserted (skip names already present).
    const candidates = DEFAULT_PLAYERS.filter((p) => !existingNames.has(p.name));
    skipped = DEFAULT_PLAYERS.length - candidates.length;

    // Re-host external headshots into Supabase Storage in parallel (bounded
    // concurrency + per-fetch timeout) so the roster is self-contained without
    // a slow/hanging image host stalling the whole import.
    const resolvedImages = await mapLimit(candidates, 6, async (p) => {
      const raw = p.image_url || null;
      if (
        raw &&
        (raw.startsWith("http://") || raw.startsWith("https://")) &&
        !raw.includes("supabase.co/storage/v1/object/public/")
      ) {
        return this.uploadImageFromUrl("player-images", raw);
      }
      return raw;
    });

    for (let i = 0; i < candidates.length; i++) {
      const p = candidates[i];
      const finalImageUrl = resolvedImages[i];

      const { error } = await supabase.from("players").insert({
        tournament_id: tId,
        name: p.name,
        age: p.age ?? null,
        country: p.country || "India",
        t20_matches: p.t20_matches ?? 0,
        runs: p.runs ?? null,
        batting_sr: p.batting_sr ?? null,
        wickets: p.wickets ?? null,
        economy: p.economy ?? null,
        eval_points: p.eval_points ?? 0,
        base_price: p.base_price ?? 400000,
        role: p.role,
        image_url: finalImageUrl,
        status: "pending",
        sold_price: 0,
      });

      if (error) {
        errors.push(`${p.name}: ${error.message}`);
      } else {
        inserted++;
      }
    }

    return { inserted, skipped, errors };
  }

  /** Count of default template players available to load. */
  getDefaultPlayerCount(): number {
    return DEFAULT_PLAYERS.length;
  }

  // ─── EXPORT METHODS ───

  async exportAllPlayersCSV(tournamentId?: number): Promise<string> {
    const tId = tournamentId ?? this.activeTournamentId;
    const players = await this.getPlayers(tId);
    return this.toCSV(players, [
      "name",
      "role",
      "nation",
      "age",
      "basePrice",
      "soldPrice",
      "team",
      "status",
      "overseas",
      "points",
      "t20Matches",
    ]);
  }

  async exportSoldPlayersCSV(tournamentId?: number): Promise<string> {
    const tId = tournamentId ?? this.activeTournamentId;
    const players = await this.getPlayers(tId);
    const sold = players.filter((p) => p.status === "sold");
    return this.toCSV(sold, [
      "name",
      "role",
      "nation",
      "team",
      "soldPrice",
      "points",
      "overseas",
    ]);
  }

  async exportTeamSummaryCSV(tournamentId?: number): Promise<string> {
    const tId = tournamentId ?? this.activeTournamentId;
    const stats = await this.getTeamStats(tId);
    const rows = stats.map((s) => ({
      teamName: s.teamName,
      startingBudget: s.startingBudget,
      totalSpent: s.totalSpent,
      fundsRemaining: s.fundsRemaining,
      playersCount: s.playersCount,
      overseasCount: s.overseasCount,
      totalPoints: s.totalPoints,
    }));

    return this.toCSV(rows, [
      "teamName",
      "startingBudget",
      "totalSpent",
      "fundsRemaining",
      "playersCount",
      "overseasCount",
      "totalPoints",
    ]);
  }

  // ─── PLAYING XI METHODS ───

  async getPlayingXI(teamSlug: string, tournamentId?: number): Promise<string[]> {
    const tId = tournamentId ?? this.activeTournamentId;
    const { data, error } = await supabase
      .from("playing_xi")
      .select("players(name)")
      .eq("tournament_id", tId)
      .eq("team_slug", teamSlug);

    if (error || !data) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((d: any) => d.players?.name).filter(Boolean);
  }

  async savePlayingXI(
    teamSlug: string,
    playerNames: string[],
    tournamentId?: number,
  ): Promise<void> {
    const tId = tournamentId ?? this.activeTournamentId;
    if (playerNames.length === 0) {
      await supabase
        .from("playing_xi")
        .delete()
        .eq("tournament_id", tId)
        .eq("team_slug", teamSlug);
      return;
    }
    const { data: players } = await supabase
      .from("players")
      .select("id, name")
      .eq("tournament_id", tId)
      .in("name", playerNames);

    if (!players || players.length === 0) return;

    await supabase
      .from("playing_xi")
      .delete()
      .eq("tournament_id", tId)
      .eq("team_slug", teamSlug);
    const rows = players.map((p) => ({
      tournament_id: tId,
      team_slug: teamSlug,
      player_id: p.id,
    }));
    await supabase.from("playing_xi").insert(rows);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toCSV(data: any[], columns: string[]): string {
    const header = columns.join(",");
    const rows = data.map((row) =>
      columns
        .map((col) => {
          const val = row[col];
          if (val === null || val === undefined) return "";
          const str = String(val);
          return str.includes(",") ? `"${str}"` : str;
        })
        .join(","),
    );
    return [header, ...rows].join("\n");
  }

  // ─── BRANDING HELPERS ───

  getTeamLogo(teamName: string): string {
    const logo = getTeamLogo(teamName);
    if (logo === "??") {
      return teamName
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase();
    }
    return logo;
  }

  getTeamBorderColor(teamName: string): string {
    return getTeamBorderColor(teamName);
  }

  getTeamGradient(teamName: string): string {
    return getTeamGradient(teamName);
  }

  getTeamInitials(teamName: string): string {
    if (!teamName) return "??";
    const words = teamName.trim().split(/\s+/);
    const initials = words
      .slice(0, 3)
      .map((word) => word[0]?.toUpperCase() || "")
      .filter(Boolean)
      .join("");
    return initials || "??";
  }
}

export const supabaseService = new SupabaseService();
