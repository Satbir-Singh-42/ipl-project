import { supabase } from "@/lib/supabase";
import { AUCTION_CONFIG, PLAYING_XI_CONFIG } from "@shared/config";

export interface AuctionSquadRules {
  // Squad Size Limits
  startingBudget: number;
  maxPlayers: number;
  minPlayers: number;
  maxOverseas: number;
  minIndians: number;

  // Playing XI Rules
  playingXITotal: number;
  playingXIOverseasLimit: number;
  batsmenMin: number;
  batsmenMax: number;
  wkMin: number;
  wkMax: number;
  allRoundersMin: number;
  bowlersMin: number;

  // Captain & Vice-Captain Multipliers
  enableCaptainMultiplier: boolean;
  captainMultiplier: number;
  viceCaptainMultiplier: number;

  // Financial & Bidding Mechanics
  bidIncrement: number;
  defaultBasePrice: number;

  // Qualification & Automation
  teamsQualifying: number;
  autoAdvanceDelayMs: number;
}

export interface DBAuctionSettings {
  id: number;
  max_players: number;
  min_players: number;
  max_overseas: number;
  min_indians: number;
  playing_xi_total: number;
  playing_xi_max_overseas: number;
  batsmen_min: number;
  batsmen_max: number;
  wk_min: number;
  wk_max: number;
  all_rounders_min: number;
  bowlers_min: number;
  starting_budget: number;
  default_base_price: number;
  bid_increment: number;
  teams_qualifying: number;
  auto_advance_delay_ms: number;
  enable_captain_multiplier?: boolean;
  captain_multiplier?: number;
  vice_captain_multiplier?: number;
  updated_at?: string;
}

const STORAGE_KEY = "ipl_auction_rules_v1";

export const DEFAULT_AUCTION_RULES: AuctionSquadRules = {
  startingBudget: AUCTION_CONFIG.defaultTeamBudget || 10000000,
  maxPlayers: AUCTION_CONFIG.maxPlayers || 15,
  minPlayers: AUCTION_CONFIG.minPlayers || 11,
  maxOverseas: AUCTION_CONFIG.maxOverseasPlayers || 7,
  minIndians: Math.max(
    0,
    (AUCTION_CONFIG.maxPlayers || 15) - (AUCTION_CONFIG.maxOverseasPlayers || 7),
  ),
  playingXITotal: PLAYING_XI_CONFIG.totalPlayers || 11,
  playingXIOverseasLimit: PLAYING_XI_CONFIG.foreignPlayers?.max || 4,
  batsmenMin: PLAYING_XI_CONFIG.batsmen?.min || 2,
  batsmenMax: PLAYING_XI_CONFIG.batsmen?.max || 5,
  wkMin: PLAYING_XI_CONFIG.wicketKeepers?.min || 1,
  wkMax: PLAYING_XI_CONFIG.wicketKeepers?.max || 3,
  allRoundersMin: PLAYING_XI_CONFIG.allRounders?.min || 1,
  bowlersMin: PLAYING_XI_CONFIG.bowlers?.min || 2,
  enableCaptainMultiplier: PLAYING_XI_CONFIG.multipliers?.enabled ?? true,
  captainMultiplier: PLAYING_XI_CONFIG.multipliers?.captainMultiplier ?? 2.0,
  viceCaptainMultiplier: PLAYING_XI_CONFIG.multipliers?.viceCaptainMultiplier ?? 1.5,
  bidIncrement: AUCTION_CONFIG.bidIncrement || 100000,
  defaultBasePrice: AUCTION_CONFIG.defaultBasePrice || 400000,
  teamsQualifying: AUCTION_CONFIG.teamsQualifying || 8,
  autoAdvanceDelayMs: 1000,
};

// In-memory cache for synchronous reads
let cachedRules: AuctionSquadRules = (() => {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return DEFAULT_AUCTION_RULES;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_AUCTION_RULES,
      ...parsed,
    };
  } catch {
    return DEFAULT_AUCTION_RULES;
  }
})();

function convertFromDBRow(row: DBAuctionSettings): AuctionSquadRules {
  return {
    startingBudget: Number(row.starting_budget) || DEFAULT_AUCTION_RULES.startingBudget,
    maxPlayers: Number(row.max_players) || DEFAULT_AUCTION_RULES.maxPlayers,
    minPlayers: Number(row.min_players) || DEFAULT_AUCTION_RULES.minPlayers,
    maxOverseas: Number(row.max_overseas) || DEFAULT_AUCTION_RULES.maxOverseas,
    minIndians:
      row.min_indians !== undefined
        ? Number(row.min_indians)
        : DEFAULT_AUCTION_RULES.minIndians,
    playingXITotal: Number(row.playing_xi_total) || DEFAULT_AUCTION_RULES.playingXITotal,
    playingXIOverseasLimit:
      Number(row.playing_xi_max_overseas) || DEFAULT_AUCTION_RULES.playingXIOverseasLimit,
    batsmenMin: Number(row.batsmen_min) || DEFAULT_AUCTION_RULES.batsmenMin,
    batsmenMax: Number(row.batsmen_max) || DEFAULT_AUCTION_RULES.batsmenMax,
    wkMin: Number(row.wk_min) || DEFAULT_AUCTION_RULES.wkMin,
    wkMax: Number(row.wk_max) || DEFAULT_AUCTION_RULES.wkMax,
    allRoundersMin:
      Number(row.all_rounders_min) || DEFAULT_AUCTION_RULES.allRoundersMin,
    bowlersMin: Number(row.bowlers_min) || DEFAULT_AUCTION_RULES.bowlersMin,
    enableCaptainMultiplier:
      row.enable_captain_multiplier !== undefined
        ? Boolean(row.enable_captain_multiplier)
        : DEFAULT_AUCTION_RULES.enableCaptainMultiplier,
    captainMultiplier:
      row.captain_multiplier !== undefined
        ? Number(row.captain_multiplier)
        : DEFAULT_AUCTION_RULES.captainMultiplier,
    viceCaptainMultiplier:
      row.vice_captain_multiplier !== undefined
        ? Number(row.vice_captain_multiplier)
        : DEFAULT_AUCTION_RULES.viceCaptainMultiplier,
    bidIncrement: Number(row.bid_increment) || DEFAULT_AUCTION_RULES.bidIncrement,
    defaultBasePrice:
      Number(row.default_base_price) || DEFAULT_AUCTION_RULES.defaultBasePrice,
    teamsQualifying:
      Number(row.teams_qualifying) || DEFAULT_AUCTION_RULES.teamsQualifying,
    autoAdvanceDelayMs:
      Number(row.auto_advance_delay_ms) || DEFAULT_AUCTION_RULES.autoAdvanceDelayMs,
  };
}

/**
 * Returns current rules synchronously from memory/localStorage cache.
 */
export function getAuctionRules(): AuctionSquadRules {
  return cachedRules;
}

/**
 * Asynchronously fetches rules from Supabase `auction_settings` table for a specific tournament.
 * Updates local cache and notifies all listeners if changed.
 */
export async function fetchAuctionRules(tournamentId = 1): Promise<AuctionSquadRules> {
  try {
    const { data, error } = await supabase
      .from("auction_settings")
      .select("*")
      .eq("tournament_id", tournamentId)
      .maybeSingle();

    if (!error && data) {
      const dbRules = convertFromDBRow(data as DBAuctionSettings);
      cachedRules = dbRules;
      try {
        localStorage.setItem(`${STORAGE_KEY}_${tournamentId}`, JSON.stringify(dbRules));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dbRules));
      } catch {
        // Ignore localStorage quota errors
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("ipl_rules_updated", { detail: { rules: dbRules, tournamentId } }),
        );
      }
      return dbRules;
    }
  } catch (err) {
    console.warn("Failed to fetch auction_settings from Supabase:", err);
  }
  return cachedRules;
}

/**
 * Saves auction rules both to Supabase and to local storage for a specific tournament.
 * Automatically broadcasts update event to all subscribers.
 */
export async function saveAuctionRules(
  rules: AuctionSquadRules,
  tournamentId = 1,
): Promise<{ success: boolean; error?: string }> {
  cachedRules = rules;
  try {
    localStorage.setItem(`${STORAGE_KEY}_${tournamentId}`, JSON.stringify(rules));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  } catch (err) {
    console.error("Failed to save rules to localStorage:", err);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("ipl_rules_updated", { detail: { rules, tournamentId } }),
    );
  }

  try {
    const dbPayload = {
      tournament_id: tournamentId,
      max_players: rules.maxPlayers,
      min_players: rules.minPlayers,
      max_overseas: rules.maxOverseas,
      min_indians: rules.minIndians,
      playing_xi_total: rules.playingXITotal,
      playing_xi_max_overseas: rules.playingXIOverseasLimit,
      batsmen_min: rules.batsmenMin,
      batsmen_max: rules.batsmenMax,
      wk_min: rules.wkMin,
      wk_max: rules.wkMax,
      all_rounders_min: rules.allRoundersMin,
      bowlers_min: rules.bowlersMin,
      enable_captain_multiplier: rules.enableCaptainMultiplier,
      captain_multiplier: rules.captainMultiplier,
      vice_captain_multiplier: rules.viceCaptainMultiplier,
      starting_budget: rules.startingBudget,
      default_base_price: rules.defaultBasePrice,
      bid_increment: rules.bidIncrement,
      teams_qualifying: rules.teamsQualifying,
      auto_advance_delay_ms: rules.autoAdvanceDelayMs,
      updated_at: new Date().toISOString(),
    };

    // Check if row exists for this tournament
    const { data: existing } = await supabase
      .from("auction_settings")
      .select("id")
      .eq("tournament_id", tournamentId)
      .maybeSingle();

    let error;
    if (existing) {
      const res = await supabase
        .from("auction_settings")
        .update(dbPayload)
        .eq("tournament_id", tournamentId);
      error = res.error;
    } else {
      const res = await supabase
        .from("auction_settings")
        .insert(dbPayload);
      error = res.error;
    }

    if (error) {
      console.warn("Supabase save auction_settings error:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("Failed to save auction_settings to Supabase:", message);
    return { success: false, error: message };
  }
}

/**
 * Resets auction rules to standard system defaults.
 */
export async function resetAuctionRules(tournamentId = 1): Promise<AuctionSquadRules> {
  await saveAuctionRules(DEFAULT_AUCTION_RULES, tournamentId);
  return DEFAULT_AUCTION_RULES;
}

/**
 * Subscribes to rules updates (both local CustomEvents and Supabase Realtime).
 */
export function subscribeToRulesUpdate(
  callback: (rules: AuctionSquadRules) => void,
  tournamentId = 1,
): () => void {
  const handleLocalEvent = (e: Event) => {
    const customEvent = e as CustomEvent<{ rules: AuctionSquadRules; tournamentId: number } | AuctionSquadRules>;
    if (customEvent.detail) {
      if ("rules" in customEvent.detail) {
        if (!customEvent.detail.tournamentId || customEvent.detail.tournamentId === tournamentId) {
          callback(customEvent.detail.rules);
        }
      } else {
        callback(customEvent.detail as AuctionSquadRules);
      }
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("ipl_rules_updated", handleLocalEvent);
  }

  // Supabase Realtime channel
  const channel = supabase
    .channel(`realtime_auction_settings_${tournamentId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "auction_settings",
        filter: `tournament_id=eq.${tournamentId}`,
      },
      (payload) => {
        if (payload.new) {
          const updated = convertFromDBRow(payload.new as DBAuctionSettings);
          cachedRules = updated;
          try {
            localStorage.setItem(`${STORAGE_KEY}_${tournamentId}`, JSON.stringify(updated));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch {
            // ignore
          }
          callback(updated);
        }
      },
    )
    .subscribe();

  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("ipl_rules_updated", handleLocalEvent);
    }
    supabase.removeChannel(channel);
  };
}

// Initial eager fetch on load
if (typeof window !== "undefined") {
  fetchAuctionRules().catch(() => {});
}
