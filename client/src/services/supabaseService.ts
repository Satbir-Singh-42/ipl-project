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
  status: "sold" | "unsold";
  overseas: boolean;
  points?: number;
  originalIndex?: number;
  images?: string;
  t20Matches?: number;
  isUnsold?: boolean;
  dbId?: number;
}

export interface Team {
  id: string;
  name: string;
  logo: string;
  fundsRemaining: number;
  overseasPlayers: number;
  totalPlayers: number;
  borderColor: string;
  bgGradient: string;
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
}

// Raw DB row types
interface DBPlayer {
  id: number;
  sr_no: number | null;
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

    return {
      name: row.name,
      team: row.sold_to_team || "",
      role: row.role || "",
      nation: country,
      age: row.age || undefined,
      basePrice: Number(row.base_price) || 0,
      soldPrice: isSold ? Number(row.sold_price) || 0 : 0,
      status: isSold ? "sold" : "unsold",
      overseas: isOverseas,
      points: row.eval_points || 0,
      originalIndex: index,
      images: row.image_url || "",
      t20Matches: row.t20_matches || undefined,
      isUnsold: row.status === "unsold",
      dbId: row.id,
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
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .order("sr_no", { ascending: true });

    if (error) {
      console.error("Failed to fetch players:", error.message);
      return [];
    }

    return (data || []).map((row: DBPlayer, index: number) =>
      this.toPlayer(row, index),
    );
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

    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      const { error } = await supabase.from("players").insert({
        sr_no: i + 1,
        name: p.name,
        age: p.age || null,
        country: p.country || "India",
        t20_matches: p.t20_matches || 0,
        runs: p.runs || null,
        batting_sr: p.batting_sr || null,
        wickets: p.wickets || null,
        economy: p.economy || null,
        eval_points: p.eval_points || 0,
        base_price: p.base_price || 400000,
        role: p.role || "Batsman",
        image_url: p.image_url || null,
        status: "unsold",
        sold_price: 0,
      });

      if (error) {
        errors.push(`Row ${i + 1} (${p.name}): ${error.message}`);
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
