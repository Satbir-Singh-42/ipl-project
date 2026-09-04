import { supabase } from "@/lib/supabase";
import {
  getTeamLogo,
  getTeamBorderColor,
  getTeamGradient,
} from "@/config/teamBranding";

// Re-export the same interfaces used by all consumers
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
}

export interface Pool {
  id: number;
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
  name: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface DBPlayer {
  id: number;
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
  name: string;
  slug: string;
  logo_url: string | null;
  border_color: string | null;
  bg_gradient: string | null;
  starting_budget: number;
}

class SupabaseService {
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

  // ─── READ METHODS ───

  async getPlayers(): Promise<Player[]> {
    const [playersRes, poolsRes] = await Promise.all([
      supabase.from("players").select("*").order("id", { ascending: true }),
      supabase.from("pools").select("id, order_index").order("order_index", { ascending: true }),
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

  async getTeamStats(): Promise<TeamStats[]> {
    const { data: teamsData, error: teamsError } = await supabase
      .from("teams")
      .select("*")
      .order("name", { ascending: true });

    if (teamsError || !teamsData) {
      console.error("Failed to fetch teams:", teamsError?.message);
      return [];
    }

    const players = await this.getPlayers();

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

  async getLeaderboard(): Promise<TeamStats[]> {
    const teamStats = await this.getTeamStats();
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

  async getSoldPlayersByTeam(teamId: string): Promise<Player[]> {
    const players = await this.getPlayers();
    const teamConfigs = await this.getTeamConfigs();
    const team = teamConfigs.find((t: Team) => t.id === teamId);

    if (!team) return [];

    return players.filter(
      (p) =>
        p.status === "sold" &&
        (p.team.toLowerCase().includes(teamId.toLowerCase()) ||
          p.team.toLowerCase().includes(team.name.toLowerCase())),
    );
  }

  async getUnsoldPlayers(): Promise<Player[]> {
    const players = await this.getPlayers();
    return players.filter((p) => p.status === "unsold");
  }

  async getTeamConfigs(): Promise<Team[]> {
    // Fetch raw teams from DB to get branding columns
    const { data: teamsData } = await supabase
      .from("teams")
      .select("*")
      .order("name", { ascending: true });

    const teamStats = await this.getTeamStats();

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
      };
    });
  }

  // Compatibility method -- no-op since we don't use client-side cache anymore
  clearCache(): void {
    // No-op: Supabase handles caching via React Query
  }

  // ─── WRITE METHODS (new -- for auction + admin) ───

  async markPlayerSold(
    playerName: string,
    teamName: string,
    price: number,
  ): Promise<void> {
    const { error } = await supabase
      .from("players")
      .update({
        status: "sold",
        sold_price: price,
        sold_to_team: teamName,
        sold_at: new Date().toISOString(),
      })
      .eq("name", playerName);

    if (error) throw new Error(`Failed to mark player sold: ${error.message}`);

    // Log the action
    const { data: playerRow } = await supabase
      .from("players")
      .select("id")
      .eq("name", playerName)
      .single();

    await supabase.from("auction_log").insert({
      player_id: playerRow?.id || null,
      player_name: playerName,
      team_name: teamName,
      action: "sold",
      final_price: price,
      performed_by: (await supabase.auth.getUser()).data.user?.email || "unknown",
    });
  }

  async markPlayerUnsold(playerName: string): Promise<void> {
    const { error } = await supabase
      .from("players")
      .update({
        status: "unsold",
        sold_price: 0,
        sold_to_team: null,
        sold_at: null,
      })
      .eq("name", playerName);

    if (error)
      throw new Error(`Failed to mark player unsold: ${error.message}`);

    const { data: playerRow } = await supabase
      .from("players")
      .select("id")
      .eq("name", playerName)
      .single();

    await supabase.from("auction_log").insert({
      player_id: playerRow?.id || null,
      player_name: playerName,
      team_name: null,
      action: "unsold",
      final_price: 0,
      performed_by: (await supabase.auth.getUser()).data.user?.email || "unknown",
    });
  }

  async undoLastAction(): Promise<{ playerName: string; action: string } | null> {
    // Get the most recent auction log entry
    const { data: lastLog } = await supabase
      .from("auction_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!lastLog) return null;

    // Reverse the action
    if (lastLog.action === "sold") {
      await supabase
        .from("players")
        .update({
          status: "unsold",
          sold_price: 0,
          sold_to_team: null,
          sold_at: null,
        })
        .eq("name", lastLog.player_name);
    } else if (lastLog.action === "unsold") {
      // Cannot meaningfully undo an unsold -- just log it
    }

    // Log the undo
    await supabase.from("auction_log").insert({
      player_id: lastLog.player_id,
      player_name: lastLog.player_name,
      team_name: lastLog.team_name,
      action: "undo",
      final_price: 0,
      performed_by: (await supabase.auth.getUser()).data.user?.email || "unknown",
    });

    return {
      playerName: lastLog.player_name,
      action: lastLog.action,
    };
  }

  // ─── ADMIN METHODS ───

  async addPlayer(player: Partial<DBPlayer>): Promise<void> {
    const { error } = await supabase.from("players").insert(player);
    if (error) throw new Error(`Failed to add player: ${error.message}`);
  }

  async updatePlayer(
    id: number,
    data: Partial<DBPlayer>,
  ): Promise<void> {
    const { error } = await supabase
      .from("players")
      .update(data)
      .eq("id", id);
    if (error) throw new Error(`Failed to update player: ${error.message}`);
  }

  async deletePlayer(id: number): Promise<void> {
    // Delete any auction_log entries referencing this player first
    await supabase.from("auction_log").delete().eq("player_id", id);
    // Delete the player row from database
    const { error } = await supabase.from("players").delete().eq("id", id);
    if (error) throw new Error(`Failed to delete player: ${error.message}`);
  }

  async updateTeamBudget(teamSlug: string, budget: number): Promise<void> {
    const { error } = await supabase
      .from("teams")
      .update({ starting_budget: budget })
      .eq("slug", teamSlug);
    if (error) throw new Error(`Failed to update budget: ${error.message}`);
  }

  async createTeam(team: {
    name: string;
    slug?: string;
    logo_url?: string;
    border_color?: string;
    bg_gradient?: string;
    starting_budget?: number;
  }): Promise<void> {
    const slug =
      team.slug && team.slug.trim()
        ? team.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")
        : team.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

    const { error } = await supabase.from("teams").insert({
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
  ): Promise<void> {
    const { error } = await supabase
      .from("teams")
      .update(updates)
      .eq("slug", slug);

    if (error) throw new Error(`Failed to update team: ${error.message}`);
  }

  async deleteTeam(slug: string): Promise<void> {
    const { data: teamRow } = await supabase
      .from("teams")
      .select("name, slug")
      .eq("slug", slug)
      .maybeSingle();

    const teamName = teamRow?.name || slug;

    // Reset any players that were assigned or sold to this team back to available
    await supabase
      .from("players")
      .update({
        sold_to_team: null,
        sold_price: 0,
        status: "available",
        sold_at: null,
      })
      .or(`sold_to_team.eq.${slug},sold_to_team.eq.${teamName}`);

    // Clean up auction log for this team
    await supabase.from("auction_log").delete().eq("team_name", teamName);

    // Delete team from database
    const { error } = await supabase.from("teams").delete().eq("slug", slug);
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
      const response = await fetch(trimmed);
      if (!response.ok) return trimmed;

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

  async getPools(): Promise<Pool[]> {
    const { data: poolsData, error: poolsError } = await supabase
      .from("pools")
      .select("*")
      .order("order_index", { ascending: true });

    if (poolsError) {
      console.error("Failed to fetch pools:", poolsError.message);
      return [];
    }

    // Get player counts per pool
    const { data: playersData } = await supabase
      .from("players")
      .select("pool_id");

    const counts: Record<number, number> = {};
    (playersData || []).forEach((p: { pool_id: number | null }) => {
      if (p.pool_id) {
        counts[p.pool_id] = (counts[p.pool_id] || 0) + 1;
      }
    });

    return (poolsData || []).map((row: DBPool) => ({
      id: row.id,
      name: row.name,
      orderIndex: row.order_index,
      playerCount: counts[row.id] || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async createPool(name: string, orderIndex?: number): Promise<Pool> {
    let nextOrder = orderIndex;
    if (nextOrder === undefined) {
      const { data } = await supabase
        .from("pools")
        .select("order_index")
        .order("order_index", { ascending: false })
        .limit(1)
        .maybeSingle();
      nextOrder = (data?.order_index || 0) + 1;
    }

    const { data, error } = await supabase
      .from("pools")
      .insert({ name: name.trim(), order_index: nextOrder })
      .select()
      .single();

    if (error) throw new Error(`Failed to create pool: ${error.message}`);
    return {
      id: data.id,
      name: data.name,
      orderIndex: data.order_index,
      playerCount: 0,
    };
  }

  async updatePool(
    id: number,
    updates: { name?: string; orderIndex?: number },
  ): Promise<void> {
    const payload: { name?: string; order_index?: number; updated_at?: string } = {
      updated_at: new Date().toISOString(),
    };
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.orderIndex !== undefined) payload.order_index = updates.orderIndex;

    const { error } = await supabase.from("pools").update(payload).eq("id", id);
    if (error) throw new Error(`Failed to update pool: ${error.message}`);
  }

  async deletePool(id: number): Promise<void> {
    // Unassign players first
    await supabase.from("players").update({ pool_id: null, auction_order: 0 }).eq("pool_id", id);
    const { error } = await supabase.from("pools").delete().eq("id", id);
    if (error) throw new Error(`Failed to delete pool: ${error.message}`);
  }

  async reorderPools(orderedPoolIds: number[]): Promise<void> {
    for (let i = 0; i < orderedPoolIds.length; i++) {
      await supabase
        .from("pools")
        .update({ order_index: i + 1, updated_at: new Date().toISOString() })
        .eq("id", orderedPoolIds[i]);
    }
  }

  async assignPlayerToPool(
    playerId: number,
    poolId: number | null,
    auctionOrder?: number,
  ): Promise<void> {
    let order = auctionOrder;
    if (order === undefined && poolId) {
      const { data } = await supabase
        .from("players")
        .select("auction_order")
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
      .eq("id", playerId);

    if (error) throw new Error(`Failed to assign player: ${error.message}`);
  }

  async reorderPlayersInPool(
    poolId: number | null,
    orderedPlayerIds: number[],
  ): Promise<void> {
    for (let i = 0; i < orderedPlayerIds.length; i++) {
      await supabase
        .from("players")
        .update({ auction_order: i + 1 })
        .eq("id", orderedPlayerIds[i]);
    }
  }

  async autoGroupByRole(): Promise<{ poolsCreated: number; playersAssigned: number }> {
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
        .eq("name", name)
        .maybeSingle();

      let poolId = existingPool?.id;
      if (!poolId) {
        const { data: newPool, error: createError } = await supabase
          .from("pools")
          .insert({ name, order_index: i + 1 })
          .select("id")
          .single();
        if (createError) throw new Error(`Failed to create set: ${createError.message}`);
        poolId = newPool.id;
        poolsCreated++;
      } else {
        await supabase.from("pools").update({ order_index: i + 1 }).eq("id", poolId);
      }

      const { data: rolePlayers } = await supabase
        .from("players")
        .select("id")
        .eq("role", role)
        .order("eval_points", { ascending: false })
        .order("base_price", { ascending: false });

      if (rolePlayers && rolePlayers.length > 0) {
        for (let j = 0; j < rolePlayers.length; j++) {
          await supabase
            .from("players")
            .update({ pool_id: poolId, auction_order: j + 1 })
            .eq("id", rolePlayers[j].id);
          playersAssigned++;
        }
      }
    }

    return { poolsCreated, playersAssigned };
  }

  async poolUnsoldPlayers(poolName = "Accelerated Round - Unsold Players"): Promise<{ pool: Pool; count: number }> {
    let { data: existingPool } = await supabase
      .from("pools")
      .select("*")
      .eq("name", poolName)
      .maybeSingle();

    let pool: Pool;
    if (existingPool) {
      pool = {
        id: existingPool.id,
        name: existingPool.name,
        orderIndex: existingPool.order_index,
      };
    } else {
      const { data: maxOrder } = await supabase
        .from("pools")
        .select("order_index")
        .order("order_index", { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextOrder = (maxOrder?.order_index || 0) + 1;
      const { data: newPool, error } = await supabase
        .from("pools")
        .insert({ name: poolName, order_index: nextOrder })
        .select()
        .single();
      if (error) throw new Error(`Failed to create unsold pool: ${error.message}`);
      pool = {
        id: newPool.id,
        name: newPool.name,
        orderIndex: newPool.order_index,
      };
    }

    // Fetch players marked unsold by status
    const { data: unsoldByStatus } = await supabase
      .from("players")
      .select("id")
      .or("status.eq.unsold,status.eq.Unsold")
      .order("eval_points", { ascending: false });

    // Fetch players recorded as unsold in auction logs
    const { data: unsoldLogs } = await supabase
      .from("auction_log")
      .select("player_name")
      .eq("action", "unsold");

    const playerIdsSet = new Set<number>();
    (unsoldByStatus || []).forEach((p: { id: number }) => playerIdsSet.add(p.id));

    if (unsoldLogs && unsoldLogs.length > 0) {
      const logNames = unsoldLogs.map((l: { player_name: string }) => l.player_name).filter(Boolean);
      if (logNames.length > 0) {
        const { data: playersFromLogs } = await supabase
          .from("players")
          .select("id")
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
              status: "available",
              sold_price: 0,
              sold_to_team: null,
              sold_at: null,
            })
            .eq("id", id)
        ),
        supabase.from("auction_log").delete().eq("action", "unsold"),
      ]);
    }

    return { pool, count: playerIds.length };
  }

  async seedOfficialTeams(): Promise<void> {
    const officialTeams = [
      {
        name: "Chennai Super Kings",
        slug: "chennai-super-kings",
        logo_url: "/images/teams/csk.jpg",
        border_color: "#F9CD00",
        bg_gradient:
          "bg-[linear-gradient(135deg,rgba(180,140,0,0.95)_0%,rgba(140,110,0,0.85)_45%,rgba(100,80,0,0.9)_100%)]",
        starting_budget: 10000000,
      },
      {
        name: "Mumbai Indians",
        slug: "mumbai-indians",
        logo_url: "/images/teams/mi.jpg",
        border_color: "#045093",
        bg_gradient:
          "bg-[linear-gradient(135deg,rgba(4,80,147,0.95)_0%,rgba(2,50,93,0.85)_45%,rgba(1,30,70,0.9)_100%)]",
        starting_budget: 10000000,
      },
      {
        name: "Royal Challengers Bengaluru",
        slug: "royal-challengers-bengaluru",
        logo_url: "/images/teams/rcb.jpg",
        border_color: "#DA1212",
        bg_gradient:
          "bg-[linear-gradient(135deg,rgba(218,18,18,0.95)_0%,rgba(180,15,15,0.85)_45%,rgba(140,10,10,0.9)_100%)]",
        starting_budget: 10000000,
      },
      {
        name: "Kolkata Knight Riders",
        slug: "kolkata-knight-riders",
        logo_url: "/images/teams/kkr.jpeg",
        border_color: "#3E1F47",
        bg_gradient:
          "bg-[linear-gradient(135deg,rgba(62,31,71,0.95)_0%,rgba(45,20,55,0.85)_45%,rgba(30,15,40,0.9)_100%)]",
        starting_budget: 10000000,
      },
      {
        name: "Delhi Capitals",
        slug: "delhi-capitals",
        logo_url: "/images/teams/dc.jpg",
        border_color: "#004C97",
        bg_gradient:
          "bg-[linear-gradient(135deg,rgba(0,76,151,0.95)_0%,rgba(0,60,120,0.85)_45%,rgba(0,45,95,0.9)_100%)]",
        starting_budget: 10000000,
      },
      {
        name: "Sunrisers Hyderabad",
        slug: "sunrisers-hyderabad",
        logo_url: "/images/teams/srh.webp",
        border_color: "#F26522",
        bg_gradient:
          "bg-[linear-gradient(135deg,rgba(242,101,34,0.95)_0%,rgba(200,80,25,0.85)_45%,rgba(160,65,20,0.9)_100%)]",
        starting_budget: 10000000,
      },
      {
        name: "Rajasthan Royals",
        slug: "rajasthan-royals",
        logo_url: "/images/teams/rr.png",
        border_color: "#EA1A8C",
        bg_gradient:
          "bg-[linear-gradient(135deg,rgba(234,26,140,0.95)_0%,rgba(190,20,115,0.85)_45%,rgba(150,15,90,0.9)_100%)]",
        starting_budget: 10000000,
      },
      {
        name: "Punjab Kings",
        slug: "punjab-kings",
        logo_url: "/images/teams/pbks.png",
        border_color: "#C8102E",
        bg_gradient:
          "bg-[linear-gradient(135deg,rgba(200,16,46,0.95)_0%,rgba(160,10,35,0.85)_45%,rgba(120,8,25,0.9)_100%)]",
        starting_budget: 10000000,
      },
      {
        name: "Gujarat Titans",
        slug: "gujarat-titans",
        logo_url: "/images/teams/gt.png",
        border_color: "#0A1931",
        bg_gradient:
          "bg-[linear-gradient(135deg,rgba(10,25,49,0.95)_0%,rgba(7,20,40,0.85)_45%,rgba(5,15,30,0.9)_100%)]",
        starting_budget: 10000000,
      },
      {
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
      await supabase.from("teams").upsert(t, { onConflict: "name" });
    }
  }

  async resetAuction(): Promise<void> {
    const { error } = await supabase
      .from("players")
      .update({
        status: "unsold",
        sold_price: 0,
        sold_to_team: null,
        sold_at: null,
      })
      .neq("id", 0); // Update all rows

    if (error) throw new Error(`Failed to reset auction: ${error.message}`);

    await supabase.from("auction_log").delete().neq("id", 0);
  }

  async getUnsoldPlayerNames(): Promise<Set<string>> {
    try {
      const { data, error } = await supabase
        .from("auction_log")
        .select("player_name")
        .eq("action", "unsold");
      if (error || !data) return new Set();
      return new Set(data.map((r: { player_name: string }) => r.player_name));
    } catch {
      return new Set();
    }
  }

  async clearAllUnsold(): Promise<number> {
    try {
      const { data } = await supabase
        .from("players")
        .update({
          status: "available",
          sold_price: 0,
          sold_to_team: null,
          sold_at: null,
        })
        .or("status.eq.unsold,status.eq.Unsold")
        .select("id");

      await supabase.from("auction_log").delete().eq("action", "unsold");
      return data ? data.length : 0;
    } catch {
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
  ): Promise<{ inserted: number; errors: string[] }> {
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

    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (!p.name || !p.name.trim()) {
        errors.push(`Row ${i + 2}: Player name is missing`);
        continue;
      }

      const validRole = normalizeRole(p.role);

      const { error } = await supabase.from("players").insert({
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
        role: validRole,
        image_url: p.image_url?.trim() || null,
        status: "unsold",
        sold_price: 0,
      });

      if (error) {
        errors.push(`Row ${i + 2} (${p.name}): ${error.message}`);
      } else {
        inserted++;
      }
    }

    return { inserted, errors };
  }

  // ─── EXPORT METHODS ───

  async exportAllPlayersCSV(): Promise<string> {
    const players = await this.getPlayers();
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

  async exportSoldPlayersCSV(): Promise<string> {
    const players = await this.getPlayers();
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

  async exportTeamSummaryCSV(): Promise<string> {
    const stats = await this.getTeamStats();
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

  async getPlayingXI(teamSlug: string): Promise<string[]> {
    const { data, error } = await supabase
      .from("playing_xi")
      .select("players(name)")
      .eq("team_slug", teamSlug);

    if (error || !data) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((d: any) => d.players?.name).filter(Boolean);
  }

  async savePlayingXI(teamSlug: string, playerNames: string[]): Promise<void> {
    if (playerNames.length === 0) {
      await supabase.from("playing_xi").delete().eq("team_slug", teamSlug);
      return;
    }
    const { data: players } = await supabase
      .from("players")
      .select("id, name")
      .in("name", playerNames);

    if (!players || players.length === 0) return;

    await supabase.from("playing_xi").delete().eq("team_slug", teamSlug);
    const rows = players.map((p) => ({
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
