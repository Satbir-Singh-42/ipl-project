import { AUCTION_CONFIG, PLAYING_XI_CONFIG } from "@shared/config";

export interface AuctionSquadRules {
  startingBudget: number;
  maxPlayers: number;
  minPlayers: number;
  maxOverseas: number;
  minIndians: number;
  playingXIOverseasLimit: number;
  bidIncrement: number;
  defaultBasePrice: number;
}

const STORAGE_KEY = "ipl_auction_rules_v1";

export const DEFAULT_AUCTION_RULES: AuctionSquadRules = {
  startingBudget: AUCTION_CONFIG.defaultTeamBudget || 10000000,
  maxPlayers: AUCTION_CONFIG.maxPlayers || 15,
  minPlayers: AUCTION_CONFIG.minPlayers || 11,
  maxOverseas: AUCTION_CONFIG.maxOverseasPlayers || 7,
  minIndians: Math.max(0, (AUCTION_CONFIG.maxPlayers || 15) - (AUCTION_CONFIG.maxOverseasPlayers || 7)),
  playingXIOverseasLimit: PLAYING_XI_CONFIG.foreignPlayers?.max || 4,
  bidIncrement: AUCTION_CONFIG.bidIncrement || 100000,
  defaultBasePrice: AUCTION_CONFIG.defaultBasePrice || 400000,
};

export function getAuctionRules(): AuctionSquadRules {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AUCTION_RULES;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_AUCTION_RULES,
      ...parsed,
    };
  } catch {
    return DEFAULT_AUCTION_RULES;
  }
}

export function saveAuctionRules(rules: AuctionSquadRules): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
    window.dispatchEvent(new CustomEvent("ipl_rules_updated", { detail: rules }));
  } catch (err) {
    console.error("Failed to save auction rules to storage:", err);
  }
}

export function resetAuctionRules(): AuctionSquadRules {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("ipl_rules_updated", { detail: DEFAULT_AUCTION_RULES }));
  } catch (err) {
    console.error("Failed to reset auction rules:", err);
  }
  return DEFAULT_AUCTION_RULES;
}
