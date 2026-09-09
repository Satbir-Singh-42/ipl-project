/**
 * IPL Player Auction Dashboard - Configuration
 *
 * Centralized settings for auction rules, playing XI validation,
 * data sync, and UI styling. Values here are consumed by
 * auctionRules.ts, useIPLData.ts, PlayerDetailsSection.tsx, and PlayingXI.tsx.
 */

// ═══════════════════════════════════════════════════════════════════════════
// AUCTION CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const AUCTION_CONFIG = {
  /** Maximum players per team roster */
  maxPlayers: 15,

  /** Minimum players required per team */
  minPlayers: 11,

  /** Maximum overseas (foreign) players in a full squad */
  maxOverseasPlayers: 7,

  /** Number of teams qualifying for playoffs */
  teamsQualifying: 8,

  /** Bid increment amount (₹) added per tap/keypress */
  bidIncrement: 100000,

  /** Default team starting budget (INR) */
  defaultTeamBudget: 10000000,

  /** Default player base price (INR) */
  defaultBasePrice: 400000,
};

// ═══════════════════════════════════════════════════════════════════════════
// PLAYING XI VALIDATION RULES
// ═══════════════════════════════════════════════════════════════════════════

export const PLAYING_XI_CONFIG = {
  /** Total players in Playing XI (exact) */
  totalPlayers: 11,

  /** Batsmen requirements */
  batsmen: {
    min: 2,
    max: 5,
  },

  /** Wicket-keeper requirements (at least one mandatory) */
  wicketKeepers: {
    min: 1,
    max: 3,
  },

  /** All-rounder requirements */
  allRounders: {
    min: 1,
  },

  /** Bowler requirements */
  bowlers: {
    min: 2,
  },

  /** Foreign players permitted in Playing XI */
  foreignPlayers: {
    max: 4,
  },

  /** Captain / vice-captain points multipliers */
  multipliers: {
    enabled: true,
    captainMultiplier: 2.0,
    viceCaptainMultiplier: 1.5,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// DATA SYNCHRONIZATION CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const DATA_SYNC_CONFIG = {
  /** Homepage data refresh / stale-time interval (milliseconds) */
  homeRefreshInterval: 5000,

  /** TanStack Query stale time (milliseconds) */
  cacheTime: 5000,
};

// ═══════════════════════════════════════════════════════════════════════════
// UI STYLING CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Team card styling (Tailwind utility classes) used on the
 * public room dashboard.
 */
export const TEAM_CARD_CONFIG = {
  container: {
    base: "h-full min-w-0 flex flex-col items-center gap-6 p-3 rounded-3xl overflow-hidden border-2 border-solid cursor-pointer transition-all duration-200",
    hover: "hover:ring-2 hover:ring-white/20",
  },
  logo: {
    container: "flex w-20 h-20 items-center justify-center rounded-full overflow-hidden border-2 border-white/20",
  },
  teamName: {
    container: "text-center",
    text: "[font-family:'Work_Sans',Helvetica] font-semibold text-white text-sm tracking-[0] leading-5",
  },
  content: {
    background: "bg-wwwiplt20comblack-3",
    padding: "p-0",
  },
  stats: {
    divider: "border-[#ffffff1a]",
    label: "[font-family:'Work_Sans',Helvetica] font-normal text-wwwiplt-2-0comwhite text-sm text-center tracking-[0] leading-6",
    value: "[font-family:'Work_Sans',Helvetica] font-bold text-wwwiplt-2-0comwhite text-lg text-center tracking-[0] leading-7",
  },
};

/**
 * Dashboard color scheme (Tailwind utility classes) used by
 * the Playing XI pages.
 */
export const DASHBOARD_COLORS = {
  card: {
    background: "bg-[#0f1629]",
    border: "border-[#1a2332]",
  },
};