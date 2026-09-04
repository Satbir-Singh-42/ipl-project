import React, { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayerCards } from "@/components/PlayerCards";
import { useIPLData } from "@/hooks/useIPLData";
import { LoadingPage } from "@/components/LoadingPage";
import NotFound from "@/pages/not-found";
import { supabaseService, type Team } from "@/services/supabaseService";
import {
  ArrowLeft,
  RefreshCw,
  Swords,
  Trophy,
  Coins,
  TrendingUp,
  Users,
  Globe,
  ShieldCheck,
  AlertCircle,
  PieChart,
  Shield,
  Sparkles,
} from "lucide-react";
import { AUCTION_CONFIG, getConfigText } from "@shared/config";
import { formatIndianNumber } from "@/lib/utils";

// Team Logo component with hover animation
const TeamLogo = ({
  logo,
  name,
  className = "",
}: {
  logo: string;
  name: string;
  className?: string;
}) => {
  const isImageLogo = logo.startsWith("/") || logo.startsWith("http");

  if (isImageLogo) {
    return (
      <motion.div
        className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 aspect-square bg-cover bg-center rounded-2xl flex-shrink-0 shadow-xl border-2 border-white/25 bg-black/40 p-1 ${className}`}
        style={{ backgroundImage: `url(${logo})` }}
        whileHover={{
          scale: 1.05,
          rotate: 2,
          transition: { duration: 0.2 },
        }}
        whileTap={{ scale: 0.95 }}
      />
    );
  } else {
    // Display team initials instead of ?? if logo is missing
    const displayText =
      logo === "??" ? supabaseService.getTeamInitials(name) : logo;
    const teamGradient = supabaseService.getTeamGradient(name);
    return (
      <motion.div
        className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 aspect-square flex items-center justify-center rounded-2xl flex-shrink-0 ${teamGradient} text-white text-xl sm:text-2xl font-bold shadow-xl border-2 border-white/25 ${className}`}
        whileHover={{
          scale: 1.05,
          rotate: 2,
          transition: { duration: 0.2 },
        }}
        whileTap={{ scale: 0.95 }}>
        {displayText}
      </motion.div>
    );
  }
};

// Animation variants for staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

export const TeamDashboard = () => {
  const [, params] = useRoute("/team/:teamId");
  const teamId = params?.teamId;

  const [teamConfig, setTeamConfig] = useState<Team | null>(null);
  const [teamRank, setTeamRank] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [teamNotFound, setTeamNotFound] = useState(false);
  const { teamStats, isLoading, error, getSoldPlayersByTeam, refreshAllData } =
    useIPLData();
  const { data: soldPlayers, isLoading: loadingPlayers } = getSoldPlayersByTeam(
    teamConfig?.id || ""
  );

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
    }
  }, [teamId]);

  useEffect(() => {
    // Calculate team rank when teamStats and teamConfig are available
    if (teamStats && teamConfig) {
      supabaseService.getLeaderboard().then((leaderboard) => {
        const teamIndex = leaderboard.findIndex(
          (team) => team.teamId === teamConfig.id
        );
        setTeamRank(teamIndex !== -1 ? teamIndex + 1 : null);
      });
    }
  }, [teamStats, teamConfig]);

  if (teamNotFound) {
    return <NotFound />;
  }

  if (isLoading || !teamConfig) {
    return <LoadingPage />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f1629] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center p-8 rounded-2xl bg-[#18184a] border border-red-500/30">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <div className="text-red-400 text-lg font-bold">
            Error loading team data: {error.message}
          </div>
        </div>
      </div>
    );
  }

  const teamStat = teamStats?.find((stat) => stat.teamId === teamConfig.id);
  const teamPlayers = soldPlayers || [];
  const teamGradient = supabaseService.getTeamGradient(teamConfig.name);
  const teamBorderColor = supabaseService.getTeamBorderColor(teamConfig.name);
  const startingBudget = teamStat?.startingBudget || 10000000;
  const fundsRemaining = teamStat ? teamStat.fundsRemaining : startingBudget;
  const totalSpent = teamStat ? teamStat.totalSpent : 0;

  // Player limits from config
  const MAX_PLAYERS = AUCTION_CONFIG.maxPlayers;
  const MAX_OVERSEAS = AUCTION_CONFIG.maxOverseasPlayers;
  const MIN_PLAYERS = AUCTION_CONFIG.minPlayers;

  // Calculate current counts
  const currentPlayers = teamStat?.playersCount || 0;
  const currentOverseas = teamStat?.overseasCount || 0;

  // Check if limits are exceeded
  const playersExceeded = currentPlayers > MAX_PLAYERS;
  const overseasExceeded = currentOverseas > MAX_OVERSEAS;
  const isSquadEligible = currentPlayers >= MIN_PLAYERS && !playersExceeded && !overseasExceeded;

  // Spending percentage
  const spentPercent = startingBudget > 0 ? Math.min(100, Math.round((totalSpent / startingBudget) * 100)) : 0;
  const remainingPercent = 100 - spentPercent;

  return (
    <motion.div
      className="min-h-screen bg-[#0f1629] p-3 sm:p-5 md:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}>
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-5">
        
        {/* Top Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/">
            <Button
              data-testid="button-back-overview"
              variant="outline"
              size="sm"
              className="bg-[#18184a]/80 border-white/15 text-slate-200 hover:bg-white/10 hover:text-white text-xs sm:text-sm font-semibold rounded-xl px-4 py-2 shadow-sm transition-all flex items-center gap-2">
              <ArrowLeft className="w-4 h-4 text-[#00bcd4]" />
              <span>Back to Overview</span>
            </Button>
          </Link>

          <div className="flex items-center gap-2.5">
            <Link href={`/team/${teamId}/playing-xi`}>
              <Button
                data-testid="button-playing-xi"
                variant="outline"
                size="sm"
                className="bg-gradient-to-r from-emerald-600 to-green-600 border-none text-white hover:from-emerald-500 hover:to-green-500 text-xs sm:text-sm font-bold rounded-xl px-4 py-2 shadow-lg shadow-green-500/20 transition-all flex items-center gap-2">
                <Swords className="w-4 h-4" />
                <span>Playing XI</span>
              </Button>
            </Link>

            <Button
              data-testid="button-refresh-data"
              variant="outline"
              size="sm"
              className="bg-[#18184a]/80 border-white/15 text-slate-200 hover:bg-white/10 hover:text-white text-xs sm:text-sm font-semibold rounded-xl px-3.5 py-2 shadow-sm transition-all flex items-center gap-2"
              disabled={isRefreshing}
              aria-label="Refresh Data"
              onClick={async () => {
                setIsRefreshing(true);
                try {
                  supabaseService.clearCache();
                  refreshAllData();
                  if (teamConfig?.id) {
                    queryClient.invalidateQueries({
                      queryKey: ["soldPlayers", teamConfig.id],
                    });
                  }
                  queryClient.invalidateQueries({
                    queryKey: ["unsoldPlayers"],
                  });
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                } finally {
                  setIsRefreshing(false);
                }
              }}>
              <RefreshCw
                className={`w-4 h-4 text-cyan-400 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Team Hero Header */}
        <Card className="bg-gradient-to-r from-[#18184a]/95 via-[#0f1629]/95 to-[#18184a]/95 border border-white/15 rounded-2xl shadow-xl backdrop-blur-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#00bcd4]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#fe6804]/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />
          
          <CardContent className="p-4 sm:p-6 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
              <TeamLogo logo={teamConfig.logo} name={teamConfig.name} />
              <div className="text-center sm:text-left flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-2">
                  <h1
                    data-testid="text-team-name"
                    className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white font-['Work_Sans',sans-serif] tracking-tight drop-shadow-md">
                    {teamConfig.name}
                  </h1>
                  {teamRank && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-xs shadow-sm">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Rank #{teamRank}</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/15 text-xs font-semibold text-slate-200">
                    Squad: <span className="text-white font-bold">{currentPlayers}/{MAX_PLAYERS}</span>
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-blue-500/15 border border-blue-400/30 text-xs font-semibold text-blue-300">
                    Overseas: <span className="text-white font-bold">{currentOverseas}/{MAX_OVERSEAS}</span>
                  </span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                    isSquadEligible
                      ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-300"
                      : "bg-orange-500/15 border-orange-400/30 text-orange-300"
                  }`}>
                    {isSquadEligible ? "Squad Eligible" : `Need ${Math.max(0, MIN_PLAYERS - currentPlayers)} More`}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hero Budget Card with Visualizer */}
        <Card className="bg-gradient-to-br from-[#18184a]/90 via-[#0f1629]/95 to-[#18184a]/90 border border-white/15 rounded-2xl shadow-xl backdrop-blur-xl overflow-hidden relative">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-center">
              
              {/* Left: Big Remaining Budget */}
              <div className="lg:col-span-2 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
                    <Coins className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-['Work_Sans',sans-serif]">
                    Remaining Auction Purse
                  </span>
                </div>

                <div className="flex flex-wrap items-baseline gap-3">
                  <p
                    data-testid="text-remaining-budget"
                    className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-200 to-white font-['Work_Sans',sans-serif] tracking-tight">
                    ₹{formatIndianNumber(fundsRemaining)}
                  </p>
                  <span className="text-xs sm:text-sm font-medium text-slate-400">
                    of ₹{formatIndianNumber(startingBudget)} total
                  </span>
                </div>

                {/* Spending Progress Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs text-slate-300 font-semibold">
                    <span>Spent: <span className="text-emerald-400 font-bold">₹{formatIndianNumber(totalSpent)}</span> ({spentPercent}%)</span>
                    <span>Purse Left: <span className="text-cyan-300 font-bold">{remainingPercent}%</span></span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-black/50 border border-white/10 overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-[#00bcd4] to-cyan-400 transition-all duration-500"
                      style={{ width: `${Math.max(4, spentPercent)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Right: Quick Budget Breakdown Box */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-2.5 shadow-inner">
                <div className="flex justify-between items-center text-xs sm:text-sm border-b border-white/5 pb-1.5">
                  <span className="text-slate-400 font-medium">Starting Purse</span>
                  <span className="text-white font-bold">₹{formatIndianNumber(startingBudget)}</span>
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm border-b border-white/5 pb-1.5">
                  <span className="text-slate-400 font-medium">Total Spent</span>
                  <span className="text-emerald-400 font-bold">₹{formatIndianNumber(totalSpent)}</span>
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-slate-400 font-medium">Available</span>
                  <span className="text-cyan-300 font-extrabold">₹{formatIndianNumber(fundsRemaining)}</span>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* 6 Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          
          {/* Card 1: Current Rank */}
          <Card className="bg-gradient-to-br from-[#18184a]/90 to-[#0f1629]/95 border border-white/10 hover:border-amber-400/40 rounded-2xl shadow-lg transition-all duration-300 backdrop-blur-xl h-full">
            <CardContent className="p-3.5 sm:p-4">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Standing</p>
                  <p className="text-xs font-semibold text-slate-200">Current Rank</p>
                </div>
              </div>
              <p
                data-testid="text-current-rank"
                className="text-xl sm:text-2xl font-extrabold text-amber-300 font-['Work_Sans',sans-serif] mt-1">
                {teamRank ? `#${teamRank}` : "--"}
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Starting Budget */}
          <Card className="bg-gradient-to-br from-[#18184a]/90 to-[#0f1629]/95 border border-white/10 hover:border-blue-400/40 rounded-2xl shadow-lg transition-all duration-300 backdrop-blur-xl h-full">
            <CardContent className="p-3.5 sm:p-4">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center shrink-0">
                  <Coins className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Initial Purse</p>
                  <p className="text-xs font-semibold text-slate-200">Starting Budget</p>
                </div>
              </div>
              <p
                data-testid="text-starting-budget"
                className="text-lg sm:text-xl font-extrabold text-white font-['Work_Sans',sans-serif] mt-1 truncate">
                ₹{formatIndianNumber(startingBudget)}
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Total Spent */}
          <Card className="bg-gradient-to-br from-[#18184a]/90 to-[#0f1629]/95 border border-white/10 hover:border-emerald-400/40 rounded-2xl shadow-lg transition-all duration-300 backdrop-blur-xl h-full">
            <CardContent className="p-3.5 sm:p-4">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Expenditure</p>
                  <p className="text-xs font-semibold text-slate-200">Total Spent</p>
                </div>
              </div>
              <p
                data-testid="text-total-spent"
                className="text-lg sm:text-xl font-extrabold text-emerald-400 font-['Work_Sans',sans-serif] mt-1 truncate">
                ₹{formatIndianNumber(totalSpent)}
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Total Players */}
          <Card className={`bg-gradient-to-br from-[#18184a]/90 to-[#0f1629]/95 border rounded-2xl shadow-lg transition-all duration-300 backdrop-blur-xl h-full ${
            playersExceeded ? "border-red-500/50" : "border-white/10 hover:border-purple-400/40"
          }`}>
            <CardContent className="p-3.5 sm:p-4">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/40 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Roster Size</p>
                  <p className="text-xs font-semibold text-slate-200">Total Players</p>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <p
                  data-testid="text-total-players"
                  className="text-xl sm:text-2xl font-extrabold text-white font-['Work_Sans',sans-serif]">
                  {currentPlayers}
                </p>
                <span className="text-xs font-semibold text-slate-400">/ {MAX_PLAYERS} Max</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                {currentPlayers < MIN_PLAYERS
                  ? `Need ${MIN_PLAYERS - currentPlayers} more for minimum`
                  : `Can add ${MAX_PLAYERS - currentPlayers} more`}
              </p>
            </CardContent>
          </Card>

          {/* Card 5: Foreign Players */}
          <Card className={`bg-gradient-to-br from-[#18184a]/90 to-[#0f1629]/95 border rounded-2xl shadow-lg transition-all duration-300 backdrop-blur-xl h-full ${
            overseasExceeded ? "border-red-500/50" : "border-white/10 hover:border-cyan-400/40"
          }`}>
            <CardContent className="p-3.5 sm:p-4">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Overseas</p>
                  <p className="text-xs font-semibold text-slate-200">Foreign Quota</p>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <p
                  data-testid="text-foreign-players"
                  className="text-xl sm:text-2xl font-extrabold text-cyan-300 font-['Work_Sans',sans-serif]">
                  {currentOverseas}
                </p>
                <span className="text-xs font-semibold text-slate-400">/ {MAX_OVERSEAS} Max</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                {currentOverseas >= MAX_OVERSEAS
                  ? "Foreign quota full"
                  : `Can add ${MAX_OVERSEAS - currentOverseas} more`}
              </p>
            </CardContent>
          </Card>

          {/* Card 6: Squad Status */}
          <Card className={`bg-gradient-to-br from-[#18184a]/90 to-[#0f1629]/95 border rounded-2xl shadow-lg transition-all duration-300 backdrop-blur-xl h-full ${
            isSquadEligible
              ? "border-emerald-500/40 hover:border-emerald-400"
              : "border-orange-500/40 hover:border-orange-400"
          }`}>
            <CardContent className="p-3.5 sm:p-4">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isSquadEligible ? "bg-emerald-500/20 border border-emerald-400/40 text-emerald-400" : "bg-orange-500/20 border border-orange-400/40 text-orange-400"
                }`}>
                  {isSquadEligible ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Validation</p>
                  <p className="text-xs font-semibold text-slate-200">Squad Status</p>
                </div>
              </div>
              <p
                data-testid="text-squad-status"
                className={`text-lg sm:text-xl font-extrabold font-['Work_Sans',sans-serif] mt-1 ${
                  isSquadEligible ? "text-emerald-400" : "text-orange-400"
                }`}>
                {isSquadEligible ? "Eligible" : "Incomplete"}
              </p>
              <p className="text-[11px] text-slate-300 mt-1">
                {isSquadEligible ? "Squad meets criteria" : `Min: ${MIN_PLAYERS} players required`}
              </p>
            </CardContent>
          </Card>

        </div>

        {/* Squad Player Cards */}
        <div className="space-y-4 pt-1">
          {loadingPlayers ? (
            <Card className="bg-[#18184a]/70 border border-white/10 rounded-2xl p-6 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
              <p className="text-sm">Loading squad players...</p>
            </Card>
          ) : (
            <PlayerCards
              players={teamPlayers}
              title={`${teamConfig.name} Squad (${teamPlayers.length} players)`}
            />
          )}
        </div>

      </div>
    </motion.div>
  );
};
