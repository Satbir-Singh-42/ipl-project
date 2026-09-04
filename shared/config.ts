/**
 * ═══════════════════════════════════════════════════════════════════════════
 * IPL 2025 PLAYER AUCTION DASHBOARD - COMPLETE CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This file contains ALL configurable settings for the auction dashboard.
 * Modify values here to customize the application behavior.
 * 
 * FEATURES OVERVIEW:
 * - Real-time auction data via Supabase Realtime
 * - Interactive auction page with player viewer
 * - Mobile-only tap to increment (<=768px)
 * - Keyboard shortcuts and touch gestures
 * - Automatic data sync via Supabase subscriptions
 * - Team rankings and leaderboards
 * - Playing XI selection with validation
 * - Celebration animations (confetti on sold)
 * - Undo functionality
 * - Database persistence via Supabase
 * - Fully responsive design
 * - Admin panel for player/team management
 * - Role-based access (admin, public)
 */

// ═══════════════════════════════════════════════════════════════════════════
// AUCTION CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Core Auction Rules & Limits
 * 
 * These values control the fundamental auction mechanics and team constraints.
 * All monetary values are in INR (Indian Rupees).
 */
export const AUCTION_CONFIG = {
  /**
   * Maximum players per team
   * Default: 15
   * 
   * Controls:
   * - Team roster size limit
   * - Qualification eligibility check
   * - Dashboard "Squad Size" display
   */
  maxPlayers: 15,

  /**
   * Minimum players required per team
   * Default: 11
   * 
   * Controls:
   * - Minimum roster requirement
   * - Qualification eligibility
   * - Team completion status
   */
  minPlayers: 11,

  /**
   * Maximum overseas (foreign) players per team
   * Default: 7
   * 
   * Controls:
   * - Foreign player quota in full squad
   * - Separate from Playing XI foreign limit (max 4)
   * - Team composition validation
   */
  maxOverseasPlayers: 7,

  /**
   * Number of teams qualifying for playoffs
   * Default: 8
   * 
   * Controls:
   * - Qualification threshold display
   * - "Top {count} teams advance" label
   * - Leaderboard qualification indicators
   */
  teamsQualifying: 8,

  /**
   * Bid increment amount (₹)
   * Default: 100,000 (1 Lakh)
   * 
   * Controls:
   * - Amount added per tap/keypress in auction page
   * - Mobile tap to increment (≤768px only)
   * - Keyboard shortcuts (Space/Enter/Any Key)
   * - Display: "+₹{amount} per tap"
   * 
   * FEATURE: Mobile-Only Tap to Increment
   * - Enabled: Screens ≤768px (mobile/tablet)
   * - Disabled: Desktop screens
   * - Responsive detection with window resize listener
   * - Visual feedback with Framer Motion animations
   * - Alternative: Keyboard shortcuts work on all devices
   */
  bidIncrement: 100000,

  /**
   * Default team starting budget (INR)
   * Default: 10,000,000 (1 Crore)
   * 
   * Used when:
   * - Seeding new teams in the database
   * - Resetting all team budgets in admin panel
   * - Displaying budget defaults in the UI
   */
  defaultTeamBudget: 10000000,

  /**
   * Default player base price (INR)
   * Default: 400,000 (4 Lakh)
   * 
   * Used when:
   * - Adding new players without a specified base price
   * - Bulk importing players with missing price data
   * - Database default column value
   */
  defaultBasePrice: 400000,

  /**
   * UI Labels (Template Strings)
   * Use {max}, {count}, {min} as placeholders
   */
  squadSizeLabel: "Squad Size: Max {max} players",
  qualificationLabel: "Qualification: Top {count} teams advance",
  minPlayersLabel: "Min: {min} players required",
};

// ═══════════════════════════════════════════════════════════════════════════
// PLAYING XI VALIDATION RULES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Playing XI Team Composition Requirements
 * 
 * These rules validate the playing eleven selection for each team.
 * Ensures balanced team composition following IPL standards.
 * 
 * FEATURE: Interactive Playing XI Selection
 * - Drag-and-drop style interface
 * - Real-time validation against these rules
 * - Visual error messages for violations
 * - Filter and sort by role/points
 * - CSV export of validated XI
 * - Local storage auto-save
 * - Points tracking display
 */
export const PLAYING_XI_CONFIG = {
  /**
   * Total players in Playing XI
   * Default: 11
   * 
   * Standard cricket team size
   * Must be exactly this number (not min/max)
   */
  totalPlayers: 11,

  /**
   * Batsmen Requirements
   * Default: Min 2, Max 5
   * 
   * Pure batsmen only (not all-rounders or wicket-keepers)
   * Ensures balanced batting lineup
   */
  batsmen: {
    min: 2,
    max: 5,
  },

  /**
   * Wicket-Keeper Requirements
   * Default: Min 1, Max 3
   * 
   * At least one keeper is mandatory
   * Can have multiple keepers who bat
   * Increase max if you want more keeper options
   */
  wicketKeepers: {
    min: 1,
    max: 3,
  },

  /**
   * All-Rounder Requirements
   * Default: Min 1
   * 
   * At least one all-rounder required
   * Provides batting + bowling balance
   * No maximum limit set
   */
  allRounders: {
    min: 1,
  },

  /**
   * Bowler Requirements
   * Default: Min 2
   * 
   * Minimum specialist bowlers required
   * Ensures adequate bowling attack
   * Can include more than minimum
   */
  bowlers: {
    min: 2,
  },

  /**
   * Foreign Players in Playing XI
   * Default: Max 4
   * 
   * IPL rule: Maximum 4 overseas players in playing XI
   * Separate from squad foreign limit (7 in full roster)
   * Critical validation for match eligibility
   */
  foreignPlayers: {
    max: 4,
  },

  /**
   * Captain and Vice-Captain Multipliers Configuration
   * Default: Enabled, Captain 2.0x, Vice-Captain 1.5x
   */
  multipliers: {
    enabled: true,
    captainMultiplier: 2.0,
    viceCaptainMultiplier: 1.5,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// DATA SYNCHRONIZATION CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Data Sync Configuration
 * 
 * FEATURE: Real-time Data Synchronization
 * - Supabase Realtime subscriptions for instant updates
 * - React Query for client-side caching
 * - Fallback polling intervals if Realtime unavailable
 * - Manual sync with 'Z' key
 */
export const DATA_SYNC_CONFIG = {
  /**
   * Homepage data refresh interval (milliseconds)
   * Default: 5000 (5 seconds)
   * 
   * Used as fallback polling when Supabase Realtime is active.
   * With Realtime enabled, updates are pushed instantly.
   */
  homeRefreshInterval: 5000,

  /**
   * Auction page refresh interval (milliseconds)
   * Default: 60000 (60 seconds)
   * 
   * Slower fallback polling for auction page.
   * Actual updates arrive instantly via Supabase Realtime.
   */
  auctionRefreshInterval: 60000,

  /**
   * TanStack Query stale time (milliseconds)
   * Default: 5000 (5 seconds)
   * 
   * How long data is considered "fresh" before refetch.
   */
  cacheTime: 5000,

  /**
   * Enable/disable auto-sync
   * Default: true
   */
  autoSync: true,
};

// ═══════════════════════════════════════════════════════════════════════════
// MOBILE & RESPONSIVE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Mobile Detection & Responsive Settings
 * 
 * FEATURE: Mobile-Only Tap to Increment
 * - Responsive detection with matchMedia API
 * - Window resize listener for dynamic adjustment
 * - Mobile: ≤768px (tap enabled with visual feedback)
 * - Desktop: >768px (tap disabled, keyboard shortcuts available)
 * - Conditional UI elements (increment hints shown only on mobile)
 */
export const MOBILE_CONFIG = {
  /**
   * Mobile breakpoint (pixels)
   * Default: 768
   * 
   * Screens ≤ this width are considered mobile
   * Controls:
   * - Tap to increment feature (mobile only)
   * - Touch gesture enabling
   * - Abbreviated stat labels (A/S/U)
   * - Vertical button stacking
   * - Compact typography
   */
  mobileBreakpoint: 768,

  /**
   * Touch gestures configuration
   * 
   * FEATURE: Swipe Navigation (Auction Page)
   * - Swipe Left: Next player
   * - Swipe Right: Previous player
   * - Minimum swipe distance for accuracy
   * - Works on mobile/tablet devices
   */
  touchGestures: {
    /**
     * Minimum swipe distance (pixels)
     * Default: 50
     * 
     * Prevents accidental swipes
     * Balance between sensitivity and accuracy
     */
    minSwipeDistance: 50,

    /**
     * Enable swipe gestures
     * Default: true
     */
    enabled: true,
  },

  /**
   * Tap to increment settings
   * 
   * Controls the mobile-only bid increment feature
   */
  tapToIncrement: {
    /**
     * Enable tap to increment on mobile
     * Default: true
     * 
     * Set to false to disable tap feature entirely
     * Keyboard shortcuts remain available
     */
    enabled: true,

    /**
     * Show increment hints on mobile
     * Default: true
     * 
     * Display "TAP TO INCREMENT" badge
     * Display "+₹{amount} per tap" text
     */
    showHints: true,

    /**
     * Animation settings for tap feedback
     */
    animations: {
      /**
       * Enable Framer Motion animations
       * Default: true
       * 
       * Controls:
       * - Hover scale effect (1.02)
       * - Tap scale effect (0.98)
       * - Border color transitions
       * - Background color transitions
       */
      enabled: true,

      /**
       * Scale on hover (mobile only)
       * Default: 1.02
       */
      hoverScale: 1.02,

      /**
       * Scale on tap (mobile only)
       * Default: 0.98
       */
      tapScale: 0.98,
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Keyboard Shortcuts for Auction Page
 * 
 * FEATURE: Comprehensive Keyboard Control
 * - Fast navigation between players
 * - Quick actions (Sold/Unsold/Undo)
 * - Bid increment with any key
 * - Manual sync trigger
 * - Disabled when typing in search box
 * 
 * Note: These are for documentation only
 * Actual implementation is in AuctionPage.tsx
 */
export const KEYBOARD_SHORTCUTS = {
  /**
   * Global shortcuts (work anytime on auction page)
   */
  global: {
    /**
     * Quick Undo - 'R' key
     * Reverts the last sold/unsold action
     * Restores player to active list
     */
    undo: 'R',

    /**
     * Manual Sync - 'Z' key
     * Forces immediate Google Sheets data refresh
     * Shows sync progress toast
     */
    manualSync: 'Z',
  },

  /**
   * Player viewer shortcuts (when modal is open)
   */
  viewer: {
    /**
     * Previous Player - Left Arrow (←)
     * Instant navigation (no animation delay)
     */
    previousPlayer: 'ArrowLeft',

    /**
     * Next Player - Right Arrow (→)
     * Instant navigation (no animation delay)
     */
    nextPlayer: 'ArrowRight',

    /**
     * Close Viewer - Escape
     * Closes player detail modal
     */
    closeViewer: 'Escape',

    /**
     * Mark as Sold - 'S' key
     * Shows confetti animation
     * 1-second delay before next player
     */
    markSold: 'S',

    /**
     * Mark as Unsold - 'U' key
     * Shows UNSOLD stamp animation
     * 1-second delay before next player
     */
    markUnsold: 'U',

    /**
     * Increment Bid - Space / Enter / Any Key
     * Increases current bid by bidIncrement amount
     * Works on all devices (desktop alternative to mobile tap)
     */
    incrementBid: ['Space', 'Enter', 'Any Key'],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION & VISUAL EFFECTS CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Animations & Visual Effects Settings
 * 
 * FEATURE: Smooth Animations with Framer Motion
 * - Page transitions
 * - Modal entrance/exit
 * - Confetti celebrations
 * - UNSOLD stamp overlay
 * - Scale effects on interactions
 * - Fade effects after actions
 */
export const ANIMATION_CONFIG = {
  /**
   * Confetti celebration settings
   * 
   * FEATURE: Multi-burst Confetti on Sold
   * Triggered when marking player as sold
   */
  confetti: {
    /**
     * Enable confetti
     * Default: true
     */
    enabled: true,

    /**
     * Number of confetti bursts
     * Default: 3
     * 
     * Multiple bursts create spectacular effect
     */
    burstCount: 3,

    /**
     * Delay between bursts (milliseconds)
     * Default: 150
     */
    burstDelay: 150,

    /**
     * Confetti particle count per burst
     * Default: 100
     */
    particleCount: 100,

    /**
     * Spread angle (degrees)
     * Default: 70
     */
    spread: 70,

    /**
     * Origin point (x, y as fraction 0-1)
     */
    origin: {
      x: 0.5,  // Center horizontally
      y: 0.5,  // Center vertically
    },
  },

  /**
   * Transition delays (milliseconds)
   */
  transitions: {
    /**
     * Delay after marking sold/unsold before next player
     * Default: 1000 (1 second)
     * 
     * Allows animation to complete
     * Time to appreciate the visual feedback
     */
    afterActionDelay: 1000,

    /**
     * Fade out duration for sold/unsold cards
     * Default: 300
     */
    fadeOutDuration: 300,

    /**
     * Fade in duration for new player
     * Default: 400
     */
    fadeInDuration: 400,

    /**
     * Modal entrance animation duration
     * Default: 300
     */
    modalEntranceDuration: 300,

    /**
     * Modal exit animation duration
     * Default: 200
     */
    modalExitDuration: 200,
  },

  /**
   * UNSOLD stamp settings
   */
  unsoldStamp: {
    /**
     * Show UNSOLD stamp overlay
     * Default: true
     */
    enabled: true,

    /**
     * Display duration (milliseconds)
     * Default: 1000 (matches afterActionDelay)
     */
    displayDuration: 1000,

    /**
     * Image path
     * Located in: /client/public/images/auction/unsold.png
     */
    imagePath: '/images/auction/unsold.png',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// LOCAL STORAGE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Local Storage Persistence Settings
 * 
 * FEATURE: Session Persistence
 * - Auction state saved to browser
 * - Survives page refreshes
 * - Syncs with Google Sheets data
 * - Can be reset to sheet state
 * - Playing XI selections saved per team
 */
export const STORAGE_CONFIG = {
  /**
   * Local storage keys
   */
  keys: {
    /**
     * Auction page state
     * Stores: active players, sold players, unsold count
     */
    auctionState: 'auctionPageState',

    /**
     * Playing XI selections
     * Stores: selected players per team
     * Format: playingXI_{teamName}
     */
    playingXIPrefix: 'playingXI_',

    /**
     * Last sync timestamp
     * Tracks when data was last refreshed
     */
    lastSync: 'lastSyncTimestamp',
  },

  /**
   * Enable local storage
   * Default: true
   * 
   * Set to false to disable persistence
   * Not recommended - user will lose progress on refresh
   */
  enabled: true,

  /**
   * Auto-save interval (milliseconds)
   * Default: 1000 (1 second)
   * 
   * How often to save state to local storage
   * Debounced to prevent excessive writes
   */
  autoSaveInterval: 1000,
};

// ═══════════════════════════════════════════════════════════════════════════
// UI STYLING CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Team Card Styling Configuration
 * 
 * Controls the appearance of team cards on homepage and team pages.
 * Uses Tailwind CSS utility classes.
 */
export const TEAM_CARD_CONFIG = {
  container: {
    base: "h-full min-w-0 flex flex-col items-center gap-6 p-3 rounded-3xl overflow-hidden border-2 border-solid cursor-pointer transition-all duration-200",
    hover: "hover:ring-2 hover:ring-white/20",
  },
  logo: {
    container: "flex w-20 h-20 items-center justify-center rounded-full overflow-hidden border-2 border-white/20",
    size: "w-20 h-20",
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
 * Dashboard Color Scheme
 * 
 * Consistent color palette for team dashboards and statistics.
 * Supports dark mode with proper contrast ratios.
 */
export const DASHBOARD_COLORS = {
  card: {
    background: "bg-[#0f1629]",
    border: "border-[#1a2332]",
    borderHover: "hover:border-[#2a3441]",
  },
  stats: {
    startingBudget: {
      border: "border-[#1a2332]",
      borderHover: "hover:border-[#2a3441]",
      text: "text-white",
    },
    currentRank: {
      border: "border-[#1a2332]",
      borderHover: "hover:border-orange-400/70 hover:shadow-lg hover:shadow-orange-400/30",
      text: "text-white",
    },
    totalSpent: {
      border: "border-[#1a2332]",
      borderHover: "hover:border-green-400/70 hover:shadow-lg hover:shadow-green-400/30",
      text: "text-green-400",
    },
    remainingBudget: {
      border: "border-[#1a2332]",
      borderHover: "hover:border-blue-400/70 hover:shadow-lg hover:shadow-blue-400/30",
      text: "text-blue-400",
    },
    teamPoints: {
      border: "border-[#1a2332]",
      borderHover: "hover:border-yellow-400/70 hover:shadow-lg hover:shadow-yellow-400/30",
      text: "text-yellow-400",
    },
  },
  text: {
    label: "text-gray-300",
    primary: "text-white",
    warning: "text-yellow-400",
    error: "text-red-400",
    success: "text-green-400",
    info: "text-gray-400",
  },
  status: {
    exceeded: "ring-2 ring-red-500",
    eligible: "ring-2 ring-green-400/30",
    notEligible: "ring-2 ring-red-400/30",
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// LEADERBOARD CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Leaderboard Ranking System
 * 
 * FEATURE: Multi-level Team Rankings
 * - Primary: Total points (descending)
 * - Secondary: Remaining budget (ascending)
 * - Tertiary: Team name (alphabetical)
 * - Circular rank indicators with gradient styling
 * - Color-coded data for easy reading
 * - Top 3 teams with medal indicators on homepage
 */
export const LEADERBOARD_CONFIG = {
  /**
   * Ranking criteria (in order of priority)
   */
  rankingCriteria: [
    {
      field: 'totalPoints',
      order: 'desc',
      label: 'Total Points',
    },
    {
      field: 'remainingBudget',
      order: 'asc',
      label: 'Remaining Budget',
    },
    {
      field: 'teamName',
      order: 'asc',
      label: 'Team Name',
    },
  ],

  /**
   * Display settings
   */
  display: {
    /**
     * Show circular rank indicators
     * Default: true
     */
    showCircularRanks: true,

    /**
     * Show medal indicators for top 3
     * Default: true
     * 🥇 🥈 🥉
     */
    showMedals: true,

    /**
     * Highlight top N teams
     * Default: 8 (matches teamsQualifying)
     */
    highlightTopTeams: 8,

    /**
     * Enable sortable columns
     * Default: true
     */
    enableSorting: true,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Helper functions to get formatted configuration text
 * 
 * Usage:
 * - getConfigText.squadSize() → "Squad Size: Max 15 players"
 * - getConfigText.qualification() → "🏆 Qualification: Top 8 teams advance"
 * - getConfigText.minPlayers() → "Min: 11 players required"
 */
export const getConfigText = {
  squadSize: () => AUCTION_CONFIG.squadSizeLabel.replace('{max}', String(AUCTION_CONFIG.maxPlayers)),
  qualification: () => AUCTION_CONFIG.qualificationLabel.replace('{count}', String(AUCTION_CONFIG.teamsQualifying)),
  minPlayers: () => AUCTION_CONFIG.minPlayersLabel.replace('{min}', String(AUCTION_CONFIG.minPlayers)),
};

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE SUMMARY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Complete Feature List (All Configurable)
 * 
 * 🎯 CORE FEATURES:
 * ✓ Real-time Google Sheets integration
 * ✓ Interactive auction management
 * ✓ Team overview cards with rankings
 * ✓ Player management (sold/unsold)
 * ✓ Live leaderboard with circular ranks
 * ✓ Playing XI selection with validation
 * ✓ Foreign players tracking
 * ✓ Fully responsive design
 * 
 * 🎪 AUCTION PAGE:
 * ✓ Real-time player cards grid
 * ✓ Search & filter (names, roles, nations, teams)
 * ✓ Player viewer modal with full details
 * ✓ Current bid tracker
 * ✓ Mobile-only tap to increment (≤768px)
 * ✓ Dynamic bid increment
 * ✓ Sold/Unsold quick actions
 * ✓ Confetti celebration animation
 * ✓ UNSOLD stamp overlay
 * ✓ Automatic navigation (1s delay)
 * ✓ Undo functionality ('R' key)
 * 
 * ⌨️ KEYBOARD SHORTCUTS:
 * ✓ R - Quick undo
 * ✓ Z - Manual sync
 * ✓ ← → - Navigate players (instant)
 * ✓ S - Mark sold (with animation)
 * ✓ U - Mark unsold (with animation)
 * ✓ Space/Enter/Any Key - Increment bid
 * ✓ Escape - Close viewer
 * 
 * 👆 TOUCH GESTURES (Mobile):
 * ✓ Swipe left - Next player
 * ✓ Swipe right - Previous player
 * ✓ Tap bid area - Increment (mobile only)
 * ✓ Tap outside - Close modal
 * 
 * 🎨 ANIMATIONS:
 * ✓ Framer Motion transitions
 * ✓ Multi-burst confetti (3 bursts)
 * ✓ Fade effects
 * ✓ Scale animations
 * ✓ Modal entrance/exit
 * ✓ Background blur effects
 * 
 * 💾 DATA MANAGEMENT:
 * ✓ Local storage persistence
 * ✓ Auto-save every 1 second
 * ✓ Google Sheets sync (5s home / 60s auction)
 * ✓ Manual refresh
 * ✓ Reset to sheet state
 * ✓ Smart caching (TanStack Query)
 * 
 * 📱 MOBILE OPTIMIZATION:
 * ✓ Responsive layout (mobile-first)
 * ✓ Touch-friendly targets (48px min)
 * ✓ Mobile-only tap to increment
 * ✓ Swipe gestures (50px min)
 * ✓ Compact stat labels (A/S/U)
 * ✓ Vertical button stacking
 * ✓ Optimized typography
 * 
 * 🏆 LEADERBOARD:
 * ✓ Multi-level ranking system
 * ✓ Circular rank indicators
 * ✓ Top 3 medals (🥇🥈🥉)
 * ✓ Sortable columns
 * ✓ Color-coded data
 * ✓ Qualification highlighting
 * 
 * 🎮 PLAYING XI:
 * ✓ Interactive selection
 * ✓ Real-time validation
 * ✓ Role-based filtering
 * ✓ Points tracking
 * ✓ CSV export
 * ✓ Local storage save
 * ✓ Foreign player limit (max 4)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * END OF CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * For more details, see README.md
 * 
 * Support: Check documentation or create an issue
 * License: MIT
 */
