import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useIPLData } from "@/hooks/useIPLData";
import { LoadingPage } from "@/components/LoadingPage";
import NotFound from "@/pages/not-found";
import {
  supabaseService,
  type Team,
  type Player,
} from "@/services/supabaseService";
import {
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Users,
  Trophy,
  Target,
  Download,
  Info,
  Globe,
  Crown,
  Medal,
  RotateCcw,
  LayoutGrid,
  List,
} from "lucide-react";
import { DASHBOARD_COLORS } from "@shared/config";
import { useAuctionRules } from "@/hooks/useAuctionRules";
import { CricketFieldFormation } from "@/components/CricketFieldFormation";

// Enhanced Team Logo with animations
const TeamLogo = ({
  logo,
  name,
  className = "",
  size = "md",
}: {
  logo: string;
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) => {
  const isImageLogo = logo.startsWith("/") || logo.startsWith("http");
  const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-12 h-12 md:w-16 md:h-16 text-base md:text-lg",
    lg: "w-16 h-16 md:w-20 md:h-20 text-lg md:text-xl",
  };

  if (isImageLogo) {
    return (
      <motion.div
        className={`aspect-square bg-cover bg-center rounded-full flex-shrink-0 ${sizeClasses[size]} ${className}`}
        style={{ backgroundImage: `url(${logo})` }}
        whileHover={{ scale: 1.05, rotate: 2 }}
        transition={{ duration: 0.2 }}
      />
    );
  } else {
    const displayText =
      logo === "??" ? supabaseService.getTeamInitials(name) : logo;
    const teamGradient = supabaseService.getTeamGradient(name);
    return (
      <motion.div
        className={`aspect-square flex items-center justify-center rounded-full flex-shrink-0 ${teamGradient} text-white font-bold ${sizeClasses[size]} ${className}`}
        whileHover={{ scale: 1.05, rotate: 2 }}
        transition={{ duration: 0.2 }}>
        {displayText}
      </motion.div>
    );
  }
};

interface PlayingXIComposition {
  batsmen: number;
  wicketKeepers: number;
  allRounders: number;
  bowlers: number;
  foreignPlayers: number;
}

const getRoleCategory = (
  role: string,
): keyof Omit<PlayingXIComposition, "foreignPlayers"> => {
  const lowerRole = role.toLowerCase();
  if (
    lowerRole.includes("wicket") ||
    lowerRole.includes("keeper") ||
    lowerRole.includes("wk")
  ) {
    return "wicketKeepers";
  } else if (lowerRole.includes("all") || lowerRole.includes("rounder")) {
    return "allRounders";
  } else if (lowerRole.includes("bowl")) {
    return "bowlers";
  } else {
    return "batsmen";
  }
};

const getRoleOrder = (role: string): number => {
  const category = getRoleCategory(role);
  const order = {
    batsmen: 1,
    wicketKeepers: 2,
    allRounders: 3,
    bowlers: 4,
  };
  return order[category] || 5;
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

const slideInVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

export const PlayingXI = () => {
  const [, params] = useRoute("/team/:teamId/playing-xi");
  const teamId = params?.teamId;

  const [teamConfig, setTeamConfig] = useState<Team | null>(null);
  const [teamNotFound, setTeamNotFound] = useState(false);
  const { getSoldPlayersByTeam, isLoading } = useIPLData();
  const { data: soldPlayers, isLoading: loadingPlayers } = getSoldPlayersByTeam(
    teamConfig?.id || "",
  );
  const { rules } = useAuctionRules();

  // Playing XI state with instant localStorage hydration
  const [playingXI, setPlayingXI] = useState<string[]>(() => {
    if (!teamId) return [];
    try {
      const cached = localStorage.getItem(`playingXI_${teamId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  // View mode state
  const [viewMode, setViewMode] = useState<"field" | "list">(() => {
    if (!teamId) return "field";
    try {
      const cached = localStorage.getItem(`viewMode_${teamId}`);
      if (cached === "field" || cached === "list") return cached;
    } catch {}
    return "field";
  });

  // Captain & Vice-Captain
  const [captainName, setCaptainName] = useState<string | null>(() => {
    if (!teamId) return null;
    try {
      return localStorage.getItem(`captain_${teamId}`) || null;
    } catch {
      return null;
    }
  });

  const [viceCaptainName, setViceCaptainName] = useState<string | null>(() => {
    if (!teamId) return null;
    try {
      return localStorage.getItem(`vc_${teamId}`) || null;
    } catch {
      return null;
    }
  });

  // Filter and sort states
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("none");

  // Load Team configs and sync Playing XI, Captain, and VC on mount
  useEffect(() => {
    if (teamId) {
      supabaseService.getTeamConfigs().then((configs) => {
        const team = configs.find((config) => config.id === teamId);
        if (team) {
          setTeamConfig(team);
          setTeamNotFound(false);
        } else {
          setTeamNotFound(true);
        }
      });

      // If localStorage didn't have Playing XI, load from Supabase database
      try {
        const cached = localStorage.getItem(`playingXI_${teamId}`);
        if (!cached) {
          supabaseService.getPlayingXI(teamId).then((savedXI) => {
            if (savedXI && savedXI.length > 0) {
              setPlayingXI(savedXI);
              localStorage.setItem(`playingXI_${teamId}`, JSON.stringify(savedXI));
            }
          });
        }
      } catch {}
    }
  }, [teamId]);

  // Automatically save Playing XI to localStorage and Supabase database on every change
  useEffect(() => {
    if (teamId) {
      if (playingXI.length > 0 && playingXI.some(Boolean)) {
        try {
          localStorage.setItem(`playingXI_${teamId}`, JSON.stringify(playingXI));
        } catch {}
        supabaseService.savePlayingXI(teamId, playingXI.filter(Boolean));
      } else {
        try {
          localStorage.removeItem(`playingXI_${teamId}`);
        } catch {}
        supabaseService.savePlayingXI(teamId, []);
      }
    }
  }, [playingXI, teamId]);

  const handleSetCaptain = (playerName: string) => {
    const nextVal = playerName === captainName ? null : playerName;
    setCaptainName(nextVal);
    if (playerName === viceCaptainName) setViceCaptainName(null);
    if (teamId) {
      if (!nextVal) localStorage.removeItem(`captain_${teamId}`);
      else localStorage.setItem(`captain_${teamId}`, nextVal);
    }
  };

  const handleSetViceCaptain = (playerName: string) => {
    const nextVal = playerName === viceCaptainName ? null : playerName;
    setViceCaptainName(nextVal);
    if (playerName === captainName) setCaptainName(null);
    if (teamId) {
      if (!nextVal) localStorage.removeItem(`vc_${teamId}`);
      else localStorage.setItem(`vc_${teamId}`, nextVal);
    }
  };

  // Check if a player can be added to Playing XI
  const canAddPlayer = (playerName: string): boolean => {
    if (playingXI.length >= (rules.playingXITotal || 11)) return false;
    if (playingXI.includes(playerName)) return true; // Already in XI

    const player = (soldPlayers || []).find((p) => p.name === playerName);
    if (!player) return false;

    const xiPlayers = (soldPlayers || []).filter((p) =>
      playingXI.includes(p.name),
    );
    const roleCategory = getRoleCategory(player.role);

    // Check foreign player limit
    if (player.overseas) {
      const foreignCount = xiPlayers.filter((p) => p.overseas).length;
      if (foreignCount >= (rules.playingXIOverseasLimit || 4)) return false;
    }

    // Check role limits
    if (roleCategory === "batsmen") {
      const batsmenCount = xiPlayers.filter(
        (p) => getRoleCategory(p.role) === "batsmen",
      ).length;
      if (batsmenCount >= (rules.batsmenMax || 5)) return false;
    }

    if (roleCategory === "wicketKeepers") {
      const wkCount = xiPlayers.filter(
        (p) => getRoleCategory(p.role) === "wicketKeepers",
      ).length;
      if (wkCount >= (rules.wkMax || 3)) return false;
    }

    return true;
  };

  const togglePlayerInXI = (playerName: string) => {
    setPlayingXI((prev) => {
      if (prev.includes(playerName)) {
        return prev.filter((p) => p !== playerName);
      } else {
        if (canAddPlayer(playerName)) {
          return [...prev, playerName];
        }
        return prev;
      }
    });
  };

  const moveToXI = (playerName: string) => {
    if (!playingXI.includes(playerName) && canAddPlayer(playerName)) {
      setPlayingXI((prev) => {
        const next = [...prev];
        const emptyIdx = next.findIndex((p) => !p);
        if (emptyIdx !== -1 && emptyIdx < (rules.playingXITotal || 11)) {
          next[emptyIdx] = playerName;
          return next;
        }
        return [...next, playerName];
      });
    }
  };

  const handleSwapSlots = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setPlayingXI((prev) => {
      const next = [...prev];
      const maxIdx = Math.max(fromIndex, toIndex);
      while (next.length <= maxIdx) {
        next.push("");
      }
      const temp = next[fromIndex] || "";
      next[fromIndex] = next[toIndex] || "";
      next[toIndex] = temp;
      return next;
    });
  };

  const handleAddPlayerToSlot = (playerName: string, slotIndex: number) => {
    setPlayingXI((prev) => {
      const next = [...prev];
      while (next.length <= slotIndex) {
        next.push("");
      }
      const existingIdx = next.indexOf(playerName);
      if (existingIdx !== -1) {
        next[existingIdx] = "";
      }
      next[slotIndex] = playerName;
      return next;
    });
  };

  const removeFromXI = (playerName: string) => {
    setPlayingXI((prev) => prev.map((p) => (p === playerName ? "" : p)));
    if (playerName === captainName) setCaptainName(null);
    if (playerName === viceCaptainName) setViceCaptainName(null);
  };

  const clearAllFromXI = () => {
    setPlayingXI([]);
    setCaptainName(null);
    setViceCaptainName(null);
  };

  const downloadPlayingXICSV = async () => {
    if (!teamConfig || !validation.isValid) return;

    // Get team stats for complete data
    const teamStats = await supabaseService.getTeamStats();
    const currentTeamStats = teamStats.find(
      (stat) =>
        stat.teamId === teamConfig.id || stat.teamName === teamConfig.name,
    );

    const totalSpent = currentTeamStats?.totalSpent || 0;
    const startingBudget = currentTeamStats?.startingBudget || 100000;

    // Build CSV content with proper formatting
    let csvContent = "";

    // Team Header Information
    csvContent += `Team Name,${teamConfig.name}\n`;
    csvContent += `Starting Budget,${startingBudget}\n`;
    csvContent += `Total Spent,${totalSpent}\n`;
    csvContent += `Remaining Budget,${teamConfig.fundsRemaining}\n`;
    csvContent += `Total Player,${teamConfig.totalPlayers}\n`;
    csvContent += `Foreign Players,${teamConfig.overseasPlayers}\n`;
    csvContent += `Total Team Points,${currentTeamStats?.totalPoints || 0}\n`;
    csvContent += `Playing XI,${playingXI.length}\n`;
    csvContent += `Playing XI Points,${totalPlayingXIPoints}\n`;
    csvContent += `\n`; // Empty line

    // Player Table Headers
    csvContent += `Player Name,Role,Nation,Age,Base Price,Final Bid Price,Points\n`;

    // Player Data
    playingXIPlayers.forEach((player) => {
      csvContent += `${player.name},`;
      csvContent += `${player.role},`;
      csvContent += `${player.nation},`;
      csvContent += `${player.age || ""},`;
      csvContent += `${player.basePrice},`;
      csvContent += `${player.soldPrice},`;
      csvContent += `${player.points || 0}\n`;
    });

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${teamConfig.name.replace(/\s+/g, "_")}_Playing_XI.csv`,
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Calculate composition
  const getComposition = (): PlayingXIComposition => {
    const xiPlayers = (soldPlayers || []).filter((p) =>
      playingXI.includes(p.name),
    );

    return {
      batsmen: xiPlayers.filter((p) => getRoleCategory(p.role) === "batsmen")
        .length,
      wicketKeepers: xiPlayers.filter(
        (p) => getRoleCategory(p.role) === "wicketKeepers",
      ).length,
      allRounders: xiPlayers.filter(
        (p) => getRoleCategory(p.role) === "allRounders",
      ).length,
      bowlers: xiPlayers.filter((p) => getRoleCategory(p.role) === "bowlers")
        .length,
      foreignPlayers: xiPlayers.filter((p) => p.overseas).length,
    };
  };

  // Validate composition
  const validateComposition = () => {
    const comp = getComposition();
    const totalXI = rules.playingXITotal || 11;
    const maxForeign = rules.playingXIOverseasLimit || 4;
    const minBat = rules.batsmenMin || 2;
    const maxBat = rules.batsmenMax || 5;
    const minWk = rules.wkMin || 1;
    const maxWk = rules.wkMax || 3;
    const minAr = rules.allRoundersMin || 1;
    const minBowl = rules.bowlersMin || 2;

    const requirements = [
      {
        met: playingXI.length === totalXI,
        text:
          playingXI.length < totalXI
            ? `Need ${totalXI - playingXI.length} more player(s) to complete Playing XI`
            : `Playing XI complete (${totalXI}/${totalXI})`,
      },
      {
        met: comp.batsmen >= minBat && comp.batsmen <= maxBat,
        text: `Batsmen must be ${minBat}-${maxBat} (current: ${comp.batsmen})`,
      },
      {
        met: comp.wicketKeepers >= minWk && comp.wicketKeepers <= maxWk,
        text: `Wicket-Keepers must be ${minWk}-${maxWk} (current: ${comp.wicketKeepers})`,
      },
      {
        met: comp.allRounders >= minAr,
        text: `Must have at least ${minAr} All-Rounder (current: ${comp.allRounders})`,
      },
      {
        met: comp.bowlers >= minBowl,
        text: `Must have at least ${minBowl} Bowlers (current: ${comp.bowlers})`,
      },
      {
        met: comp.foreignPlayers <= maxForeign,
        text: `Foreign players cannot exceed ${maxForeign} (current: ${comp.foreignPlayers})`,
      },
    ];

    const isValid = requirements.every((req) => req.met);
    return { isValid, requirements };
  };

  if (teamNotFound) {
    return <NotFound />;
  }

  if (isLoading || loadingPlayers || !teamConfig) {
    return <LoadingPage />;
  }

  const teamPlayers = soldPlayers || [];

  // Sort Playing XI players by role order: Batsmen -> WK -> AR -> Bowlers
  const playingXIPlayers = teamPlayers
    .filter((p) => playingXI.includes(p.name))
    .sort((a, b) => getRoleOrder(a.role) - getRoleOrder(b.role));

  // Apply filters and sorting to rest players
  let restPlayers = teamPlayers.filter((p) => !playingXI.includes(p.name));

  // Filter by role
  if (roleFilter !== "all") {
    restPlayers = restPlayers.filter(
      (p) => getRoleCategory(p.role) === roleFilter,
    );
  }

  // Sort by points
  if (sortBy === "highest") {
    restPlayers = [...restPlayers].sort(
      (a, b) => (b.points || 0) - (a.points || 0),
    );
  } else if (sortBy === "lowest") {
    restPlayers = [...restPlayers].sort(
      (a, b) => (a.points || 0) - (b.points || 0),
    );
  }

  const composition = getComposition();
  const validation = validateComposition();
  const teamGradient = supabaseService.getTeamGradient(teamConfig.name);
  const teamBorderColor = supabaseService.getTeamBorderColor(
    teamConfig.name,
  );

  // Captain & Vice-Captain multiplier settings from admin rules
  const isCaptainMultiplierEnabled = rules.enableCaptainMultiplier !== false;
  const cMultiplier = isCaptainMultiplierEnabled ? (rules.captainMultiplier || 2.0) : 1;
  const vcMultiplier = isCaptainMultiplierEnabled ? (rules.viceCaptainMultiplier || 1.5) : 1;

  // Calculate total points for Playing XI
  const totalPlayingXIPoints = playingXIPlayers.reduce((sum, player) => {
    let multiplier = 1;
    if (isCaptainMultiplierEnabled) {
      if (player.name === captainName) multiplier = cMultiplier;
      else if (player.name === viceCaptainName) multiplier = vcMultiplier;
    }
    return sum + Math.round((player.points || 0) * multiplier);
  }, 0);

  const PlayerCard = ({ player, inXI }: { player: Player; inXI: boolean }) => {
    const canAdd = !inXI && canAddPlayer(player.name);
    const isDisabled = !inXI && !canAdd;
    const isCaptain = isCaptainMultiplierEnabled && inXI && captainName === player.name;
    const isViceCaptain = isCaptainMultiplierEnabled && inXI && viceCaptainName === player.name;
    const multiplier = isCaptain ? cMultiplier : isViceCaptain ? vcMultiplier : 1;
    const displayPoints = Math.round((player.points || 0) * multiplier);

    const getPlayerInitials = (name: string) => {
      const parts = name.split(" ");
      if (parts.length >= 2) {
        return parts[0][0] + parts[parts.length - 1][0];
      }
      return name.substring(0, 2).toUpperCase();
    };

    return (
      <motion.div
        className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg border-2 transition-all duration-300 ${
          isDisabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:border-blue-500 hover:shadow-lg"
        } ${
          inXI
            ? isCaptain
              ? "border-amber-400 bg-amber-950/20 shadow-amber-500/20 shadow-md"
              : isViceCaptain
              ? "border-slate-300 bg-slate-900/40 shadow-slate-400/20 shadow-md"
              : `${teamBorderColor} bg-gradient-to-r ${teamGradient} bg-opacity-10 hover:shadow-blue-500/20`
            : isDisabled
              ? "border-[#2a3441] bg-[#1a2332]"
              : "border-[#2a3441] bg-[#1a2332] hover:bg-[#1f2937] hover:shadow-blue-500/10"
        }`}
        onClick={() => !isDisabled && togglePlayerInXI(player.name)}
        data-testid={`player-${inXI ? "xi" : "bench"}-${player.name
          .replace(/\s+/g, "-")
          .toLowerCase()}`}
        whileHover={!isDisabled ? { y: -1 } : {}}
        layout
        transition={{ duration: 0.2 }}>
        {/* Player Image */}
        <div className="w-8 h-8 md:w-12 md:h-12 lg:w-10 lg:h-10 flex-shrink-0 relative">
          {player.images ? (
            <img
              src={player.images}
              alt={player.name}
              className="w-full h-full object-cover rounded-md border border-white/10"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                if (e.currentTarget.nextSibling) {
                  (e.currentTarget.nextSibling as HTMLElement).style.display =
                    "flex";
                }
              }}
            />
          ) : null}
          <div
            className={`w-full h-full ${player.images ? "hidden" : "flex"} items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-[10px] md:text-sm lg:text-xs`}
            style={player.images ? { display: "none" } : {}}>
            {getPlayerInitials(player.name)}
          </div>
          {isCaptainMultiplierEnabled && isCaptain && (
            <div className="absolute -top-1.5 -left-1.5 bg-amber-400 text-black p-0.5 rounded-full shadow-md font-bold text-[8px] flex items-center justify-center w-4 h-4">
              C
            </div>
          )}
          {isCaptainMultiplierEnabled && isViceCaptain && (
            <div className="absolute -top-1.5 -left-1.5 bg-slate-300 text-black p-0.5 rounded-full shadow-md font-bold text-[8px] flex items-center justify-center w-4 h-4">
              VC
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 md:gap-2 mb-0.5 md:mb-1">
            <p
              className="text-white font-medium text-xs md:text-base lg:text-sm truncate"
              data-testid={`text-player-name-${player.name
                .replace(/\s+/g, "-")
                .toLowerCase()}`}>
              {player.name}
            </p>
            {player.overseas && (
              <motion.span
                className="text-yellow-400 bg-yellow-400/10 p-0.5 rounded-full flex-shrink-0"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                title="Foreign Player">
                <Globe className="w-2.5 h-2.5 md:w-3 md:h-3" />
              </motion.span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1 md:gap-2 lg:gap-3">
            <p
              className="text-gray-400 text-[10px] md:text-sm lg:text-xs"
              data-testid={`text-player-role-${player.name
                .replace(/\s+/g, "-")
                .toLowerCase()}`}>
              {player.role}
            </p>
            <p
              className="text-blue-400 text-[10px] md:text-sm lg:text-xs font-semibold flex items-center gap-1"
              data-testid={`text-player-points-${player.name
                .replace(/\s+/g, "-")
                .toLowerCase()}`}>
              <span>{displayPoints} pts</span>
              {isCaptainMultiplierEnabled && multiplier > 1 && (
                <span className="text-[10px] text-amber-300 font-bold">
                  ({multiplier}x)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {isCaptainMultiplierEnabled && inXI && (
            <div className="flex items-center gap-1 mr-1">
              <button
                type="button"
                onClick={() => handleSetCaptain(player.name)}
                className={`px-1.5 py-1 rounded text-[10px] font-bold border flex items-center gap-0.5 transition-all ${
                  isCaptain
                    ? "bg-amber-400 text-black border-amber-300 shadow-md shadow-amber-500/30"
                    : "bg-[#0f1629] border-amber-400/30 text-amber-300/80 hover:bg-amber-400/20 hover:text-amber-200"
                }`}
                title={isCaptain ? "Team Captain (Click to unset)" : `Make Captain (${cMultiplier}x Points)`}>
                <Crown className="w-2.5 h-2.5" />
                <span>C</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetViceCaptain(player.name)}
                className={`px-1.5 py-1 rounded text-[10px] font-bold border flex items-center gap-0.5 transition-all ${
                  isViceCaptain
                    ? "bg-slate-300 text-black border-slate-200 shadow-md shadow-slate-400/30"
                    : "bg-[#0f1629] border-slate-400/30 text-slate-300/80 hover:bg-slate-400/20 hover:text-slate-100"
                }`}
                title={isViceCaptain ? "Vice-Captain (Click to unset)" : `Make Vice-Captain (${vcMultiplier}x Points)`}>
                <Medal className="w-2.5 h-2.5" />
                <span>VC</span>
              </button>
            </div>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (inXI) {
                removeFromXI(player.name);
              } else if (!isDisabled) {
                moveToXI(player.name);
              }
            }}
            disabled={isDisabled}
            className={`text-white hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed p-1 md:p-2 h-auto ${
              inXI ? "hover:bg-red-500/20" : "hover:bg-green-500/20"
            }`}
            data-testid={`button-${inXI ? "remove" : "add"}-${player.name
              .replace(/\s+/g, "-")
              .toLowerCase()}`}>
            {inXI ? (
              <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
            ) : (
              <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
            )}
          </Button>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      className="min-h-screen bg-[#0f1629] p-3 md:p-6 overflow-x-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}>
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6 w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-4 md:mb-6">
          <Link href={`/team/${teamId}`}>
            <motion.div>
              <Button
                data-testid="button-back-team"
                variant="outline"
                size="sm"
                className="bg-[#1a2332] border-[#2a3441] text-gray-300 hover:bg-[#1a2332] hover:text-gray-300 hover:border-[#2a3441] text-xs md:text-sm transition-all duration-200">
                <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                Back to Team
              </Button>
            </motion.div>
          </Link>
        </motion.div>

        {/* Team Header */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible">
          <Card
            className={`bg-[#0f1629] border-2 ${teamBorderColor} ${teamGradient} bg-opacity-95 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10`}>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
                <TeamLogo
                  logo={teamConfig.logo}
                  name={teamConfig.name}
                  size="lg"
                />
                <div className="text-center sm:text-left flex-1">
                  <h1
                    data-testid="text-page-title"
                    className="text-xl md:text-3xl font-bold text-white mb-2">
                    {teamConfig.name} - Playing XI
                  </h1>
                  <p className="text-white/90 text-sm md:text-base">
                    Select your best 11 players for the match
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span className="text-white font-semibold">
                    {totalPlayingXIPoints} pts
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Composition Validation */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible">
          <Card
            className={`${
              DASHBOARD_COLORS.card.background
            } border-2 transition-all duration-300 hover:shadow-lg ${
              validation.isValid
                ? "border-green-500 hover:shadow-green-500/20"
                : "border-yellow-500 hover:shadow-yellow-500/20"
            }`}>
            <CardContent className="p-3 md:p-4 lg:p-6">
              <div className="flex items-start gap-2 md:gap-4">
                <motion.div
                  animate={{
                    scale: validation.isValid ? [1, 1.1, 1] : 1,
                    rotate: validation.isValid ? [0, 5, -5, 0] : 0,
                  }}
                  transition={{ duration: 0.5 }}>
                  {validation.isValid ? (
                    <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                  )}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <div className="space-y-2 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4 mb-3 md:mb-4">
                    <div className="min-w-0">
                      <h3
                        className={`font-semibold text-base md:text-lg mb-0.5 md:mb-1 ${
                          validation.isValid
                            ? "text-green-400"
                            : "text-yellow-400"
                        }`}
                        data-testid="text-validation-status">
                        {validation.isValid
                          ? "Playing XI is Valid!"
                          : "Playing XI Requirements"}
                      </h3>
                      <p className="text-gray-400 text-xs md:text-sm">
                        {validation.isValid
                          ? "Your team meets all IPL requirements"
                          : "Complete the following requirements to make your team valid"}
                      </p>
                    </div>

                    {/* Mobile Points Display and Download Button Row */}
                    <div className="flex items-center gap-2 justify-between md:justify-end">
                      <div className="md:hidden flex items-center gap-2 bg-blue-500/10 px-2 py-1.5 rounded-lg">
                        <span className="text-blue-400 font-semibold text-xs">
                          Playing 11 Points: {totalPlayingXIPoints} pts
                        </span>
                      </div>

                      {/* Download CSV Button */}
                      {validation.isValid && (
                        <div className="flex-shrink-0">
                          <Button
                            onClick={downloadPlayingXICSV}
                            className="bg-green-600 hover:bg-green-700 border-green-600 text-white text-xs md:text-sm px-2 md:px-3 lg:px-4 py-1.5 md:py-2 h-auto transition-all duration-200 shadow-lg hover:shadow-green-500/25 flex items-center gap-1.5 md:gap-2"
                            data-testid="button-download-csv">
                            <Download className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="hidden sm:inline">
                              Download Playing XI CSV
                            </span>
                            <span className="sm:hidden">Download CSV</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                    {validation.requirements.map((req, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg border ${
                          req.met
                            ? "border-green-500/30 bg-green-500/10"
                            : "border-red-500/30 bg-red-500/10"
                        }`}
                        data-testid={`text-validation-error-${i}`}>
                        {req.met ? (
                          <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-3 h-3 md:w-4 md:h-4 text-red-400 flex-shrink-0" />
                        )}
                        <span
                          className={`text-xs md:text-sm ${
                            req.met ? "text-green-300" : "text-red-300"
                          }`}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* View Mode Switcher and Quick Actions */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#131b2e] border border-[#2a3441] p-2.5 rounded-xl">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-[#0a0f1d] p-1 rounded-lg border border-[#1f293d] w-full sm:w-auto">
            <button
              onClick={() => {
                setViewMode("field");
                if (teamId) localStorage.setItem(`viewMode_${teamId}`, "field");
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                viewMode === "field"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}>
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>2D Pitch Formation</span>
            </button>
            <button
              onClick={() => {
                setViewMode("list");
                if (teamId) localStorage.setItem(`viewMode_${teamId}`, "list");
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                viewMode === "list"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}>
              <List className="w-3.5 h-3.5" />
              <span>Roster & Bench</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {playingXI.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={clearAllFromXI}
                className="bg-[#1a2332] border-[#2a3441] text-gray-300 hover:text-red-400 hover:border-red-500/40 text-xs px-2.5 py-1.5 h-auto flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            )}
          </div>
        </motion.div>

        {viewMode === "field" ? (
          <CricketFieldFormation
            teamConfig={teamConfig}
            soldPlayers={soldPlayers || []}
            playingXI={playingXI}
            captainName={captainName}
            viceCaptainName={viceCaptainName}
            rules={rules}
            onAddPlayer={moveToXI}
            onAddPlayerToSlot={handleAddPlayerToSlot}
            onSwapSlots={handleSwapSlots}
            onRemovePlayer={removeFromXI}
            onSetCaptain={handleSetCaptain}
            onSetViceCaptain={handleSetViceCaptain}
            onClearXI={clearAllFromXI}
          />
        ) : (
          /* Two Column Layout */
          <motion.div
            className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 w-full"
            variants={containerVariants}
            initial="hidden"
            animate="visible">
            {/* Rest of Squad */}
            <motion.div variants={slideInVariants}>
              <Card
                className={`${DASHBOARD_COLORS.card.background} ${DASHBOARD_COLORS.card.border} transition-all duration-300 hover:shadow-lg`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle
                      className="text-white flex items-center gap-2"
                      data-testid="text-bench-title">
                      <Users className="w-5 h-5 text-gray-400" />
                      Rest of Squad ({restPlayers.length})
                    </CardTitle>
                  </div>

                  {/* Enhanced Filters */}
                  <div className="mt-4 space-y-3">
                    {/* Role Filters */}
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-gray-400 font-medium w-full mb-2">
                        Filter by Role:
                      </span>
                      {[
                        { key: "all", label: "All", short: "All" },
                        { key: "batsmen", label: "Batsmen", short: "Bat" },
                        { key: "bowlers", label: "Bowlers", short: "Bowl" },
                        {
                          key: "allRounders",
                          label: "All-Rounders",
                          short: "AR",
                        },
                        {
                          key: "wicketKeepers",
                          label: "Wicket-Keepers",
                          short: "WK",
                        },
                      ].map(({ key, label, short }) => (
                        <div key={key}>
                          <Button
                            size="sm"
                            variant={roleFilter === key ? "default" : "outline"}
                            onClick={() => setRoleFilter(key)}
                            className={`text-[10px] md:text-xs px-2 md:px-3 py-1 h-auto transition-all duration-200 ${
                              roleFilter === key
                                ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25"
                                : "bg-[#1a2332] border-[#2a3441] text-gray-300 hover:bg-[#1f2937] hover:border-blue-500/50 hover:text-white"
                            }`}
                            data-testid={`filter-role-${key}`}>
                            <span className="hidden sm:inline">{label}</span>
                            <span className="sm:hidden">{short}</span>
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Sort Options */}
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-gray-400 font-medium w-full mb-2">
                        Sort by Points:
                      </span>
                      {[
                        { key: "none", label: "Default", icon: ArrowUpDown },
                        {
                          key: "highest",
                          label: "Highest First",
                          icon: ArrowDown,
                          short: "High",
                        },
                        {
                          key: "lowest",
                          label: "Lowest First",
                          icon: ArrowUp,
                          short: "Low",
                        },
                      ].map(({ key, label, icon: Icon, short }) => (
                        <div key={key}>
                          <Button
                            size="sm"
                            variant={sortBy === key ? "default" : "outline"}
                            onClick={() => setSortBy(key)}
                            className={`text-[10px] md:text-xs px-2 md:px-3 py-1 h-auto transition-all duration-200 ${
                              sortBy === key
                                ? "bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/25"
                                : "bg-[#1a2332] border-[#2a3441] text-gray-300 hover:bg-[#1f2937] hover:border-purple-500/50 hover:text-white"
                            }`}
                            data-testid={`sort-${key}`}>
                            <Icon className="w-3 h-3 mr-1" />
                            <span className="hidden sm:inline">{label}</span>
                            <span className="sm:hidden">
                              {short || label.split(" ")[0]}
                            </span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="popLayout">
                    <div className="max-h-[50vh] overflow-y-auto">
                      {restPlayers.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="text-center py-12">
                          <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                          <p
                            className="text-gray-400 text-sm"
                            data-testid="text-bench-empty">
                            {roleFilter !== "all"
                              ? "No players found with selected filter"
                              : "All players are in Playing XI"}
                          </p>
                        </motion.div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 md:gap-3">
                          {restPlayers.map((player) => (
                            <PlayerCard
                              key={player.name}
                              player={player}
                              inXI={false}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>

            {/* Playing XI */}
            <motion.div variants={slideInVariants}>
              <Card
                className={`${DASHBOARD_COLORS.card.background} ${DASHBOARD_COLORS.card.border} transition-all duration-300 hover:shadow-lg`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle
                      className="text-white flex items-center gap-2"
                      data-testid="text-xi-title">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                      Playing XI ({playingXI.length}/11)
                      <div className="relative group">
                        <button className="text-gray-400 hover:text-blue-400 focus:text-blue-400 transition-colors">
                          <Info className="w-4 h-4" />
                        </button>
                        <div className="absolute left-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] p-3 bg-[#1a2332] border border-[#2a3441] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 z-50">
                          <p className="font-semibold text-sm mb-2 text-white">
                            Playing XI Requirements:
                          </p>
                          <ul className="text-xs space-y-1 list-disc list-inside text-gray-300">
                            <li>Must have exactly 11 players</li>
                            <li>Batsmen: 2-5 players</li>
                            <li>Wicket-Keepers: at least 1</li>
                            <li>All-Rounders: at least 1</li>
                            <li>Bowlers: at least 2</li>
                            <li>Foreign players: max 4</li>
                          </ul>
                        </div>
                      </div>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {playingXI.length > 0 && (
                        <div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={clearAllFromXI}
                            className="bg-red-600 hover:bg-red-700 border-red-600 text-white text-xs px-3 py-1 h-auto transition-all duration-200 shadow-lg hover:shadow-red-500/25"
                            data-testid="button-clear-all-xi">
                            Clear All
                          </Button>
                        </div>
                      )}
                      <ArrowLeftRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  {/* Composition Progress */}
                  {playingXI.length > 0 && (
                    <motion.div
                      className="mt-3 p-3 bg-white/5 rounded-lg"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.3 }}>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                        {[
                          {
                            key: "batsmen",
                            label: "Bat",
                            color: "text-green-400",
                          },
                          {
                            key: "wicketKeepers",
                            label: "WK",
                            color: "text-blue-400",
                          },
                          {
                            key: "allRounders",
                            label: "AR",
                            color: "text-purple-400",
                          },
                          {
                            key: "bowlers",
                            label: "Bowl",
                            color: "text-orange-400",
                          },
                        ].map(({ key, label, color }) => (
                          <div key={key} className="text-center">
                            <div className={`text-sm font-semibold ${color}`}>
                              {
                                composition[
                                  key as keyof Omit<
                                    PlayingXIComposition,
                                    "foreignPlayers"
                                  >
                                ]
                              }
                            </div>
                            <div className="text-xs text-gray-400">{label}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="popLayout">
                    <div className="max-h-[50vh] overflow-y-auto">
                      {playingXIPlayers.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="text-center py-12">
                          <p
                            className="text-gray-400 text-sm"
                            data-testid="text-xi-empty">
                            Select players from the squad to add to Playing XI
                          </p>
                        </motion.div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {playingXIPlayers.map((player) => (
                            <PlayerCard
                              key={player.name}
                              player={player}
                              inXI={true}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
