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
import { ArrowLeft, RefreshCw } from "lucide-react";
import {
  AUCTION_CONFIG,
  getConfigText,
  DASHBOARD_COLORS,
} from "@shared/config";
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
        className={`w-16 h-16 md:w-20 md:h-20 aspect-square bg-cover bg-center rounded-full flex-shrink-0 ${className}`}
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
        className={`w-16 h-16 md:w-20 md:h-20 aspect-square flex items-center justify-center rounded-full flex-shrink-0 ${teamGradient} text-white text-lg md:text-xl font-bold ${className}`}
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
      duration: 0.5,
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
      <div className="min-h-screen bg-[#0f1629] p-4 md:p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-red-400 text-lg">
            Error loading team data: {error.message}
          </div>
        </div>
      </div>
    );
  }

  const teamStat = teamStats?.find((stat) => stat.teamId === teamConfig.id);
  const teamPlayers = soldPlayers || [];
  const teamGradient = supabaseService.getTeamGradient(teamConfig.name);
  const teamBorderColor = supabaseService.getTeamBorderColor(
    teamConfig.name
  );
  const startingBudget = teamStat?.startingBudget || 100000;

  // Player limits from config (easily editable in shared/config.ts)
  const MAX_PLAYERS = AUCTION_CONFIG.maxPlayers;
  const MAX_OVERSEAS = AUCTION_CONFIG.maxOverseasPlayers;
  const MIN_PLAYERS = AUCTION_CONFIG.minPlayers;

  // Calculate current counts
  const currentPlayers = teamStat?.playersCount || 0;
  const currentOverseas = teamStat?.overseasCount || 0;

  // Check if limits are exceeded
  const playersExceeded = currentPlayers > MAX_PLAYERS;
  const overseasExceeded = currentOverseas > MAX_OVERSEAS;

  return (
    <motion.div
      className="min-h-screen bg-[#0f1629] p-3 md:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}>
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header with Back Button and Refresh Button */}
        <motion.div
          className="flex items-center justify-between mb-4 md:mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}>
          <Link href="/">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                data-testid="button-back-overview"
                variant="outline"
                size="sm"
                className="bg-[#1a2332] border-[#2a3441] text-gray-300 hover:bg-[#1a2332] hover:text-gray-300 hover:border-[#2a3441] text-xs md:text-sm transition-all duration-200">
                <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                Back to Overview
              </Button>
            </motion.div>
          </Link>
          <div className="flex gap-2">
            <Link href={`/team/${teamId}/playing-xi`}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}>
                <Button
                  data-testid="button-playing-xi"
                  variant="outline"
                  size="sm"
                  className="bg-green-600 border-green-500 text-white hover:bg-green-700 hover:text-white hover:border-green-600 text-xs md:text-sm transition-all duration-200 shadow-lg hover:shadow-green-500/25 min-h-[44px] flex items-center justify-center">
                  Playing XI
                </Button>
              </motion.div>
            </Link>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                data-testid="button-refresh-data"
                variant="outline"
                size="sm"
                className="bg-[#1a2332] border-[#2a3441] text-gray-300 hover:bg-[#1a2332] hover:text-gray-300 hover:border-[#2a3441] text-xs md:text-sm transition-all duration-200 px-2 md:px-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
                disabled={isRefreshing}
                aria-label="Refresh Data"
                onClick={async () => {
                  setIsRefreshing(true);
                  try {
                    supabaseService.clearCache();
                    refreshAllData();
                    // Also refresh the team-specific sold players data
                    if (teamConfig?.id) {
                      queryClient.invalidateQueries({
                        queryKey: ["soldPlayers", teamConfig.id],
                      });
                    }
                    queryClient.invalidateQueries({
                      queryKey: ["unsoldPlayers"],
                    });
                    // Wait a moment for the refresh to complete
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                  } finally {
                    setIsRefreshing(false);
                  }
                }}>
                <RefreshCw
                  className={`w-4 h-4 md:mr-2 transition-all duration-500 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
                <span className="hidden md:inline">Refresh Data</span>
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Team Header */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}>
          <Card
            className={`bg-[#0f1629] border-2 ${teamBorderColor} ${teamGradient} bg-opacity-95 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10`}>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
                <TeamLogo logo={teamConfig.logo} name={teamConfig.name} />
                <div className="text-center sm:text-left flex-1">
                  <motion.h1
                    data-testid="text-team-name"
                    className="text-xl md:text-3xl font-bold text-white mb-2"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}>
                    {teamConfig.name}
                  </motion.h1>
                  <div className="text-white/90 space-y-1">
                    <p className="text-sm md:text-base font-medium">
                      {getConfigText.squadSize()}
                    </p>
                    {/* <p className="text-xs md:text-sm text-yellow-300 font-medium">
                      {getConfigText.qualification()}
                    </p> */}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Team Statistics */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4 md:space-y-6">
          {/* Remaining Budget - Full Width */}
          <motion.div variants={itemVariants}>
            <Card
              className={`${DASHBOARD_COLORS.card.background} ${DASHBOARD_COLORS.stats.remainingBudget.border} ${DASHBOARD_COLORS.stats.remainingBudget.borderHover} transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}>
              <CardContent className="p-4 md:p-6">
                <div className="text-center space-y-2">
                  <p
                    className={`${DASHBOARD_COLORS.text.label} text-sm md:text-base`}>
                    Remaining Budget
                  </p>
                  <motion.p
                    data-testid="text-remaining-budget"
                    className={`text-2xl md:text-4xl font-bold ${DASHBOARD_COLORS.stats.remainingBudget.text}`}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}>
                    {teamStat
                      ? `₹${formatIndianNumber(teamStat.fundsRemaining)}`
                      : `₹${formatIndianNumber(startingBudget)}`}
                  </motion.p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* All Stats - Combined Grid: 2 columns on mobile, 3 on desktop */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
            variants={containerVariants}>
            {/* Current Rank */}
            <motion.div variants={itemVariants}>
              <Card
                className={`${DASHBOARD_COLORS.card.background} ${DASHBOARD_COLORS.stats.currentRank.border} ${DASHBOARD_COLORS.stats.currentRank.borderHover} transition-all duration-300 hover:scale-[1.02] hover:shadow-md`}>
                <CardContent className="p-3 md:p-4">
                  <div className="text-center space-y-2">
                    <p
                      className={`${DASHBOARD_COLORS.text.label} text-xs md:text-sm`}>
                      Current Rank
                    </p>
                    <motion.p
                      data-testid="text-current-rank"
                      className={`text-lg md:text-2xl font-bold ${DASHBOARD_COLORS.stats.currentRank.text}`}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}>
                      {teamRank ? `#${teamRank}` : "--"}
                    </motion.p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Starting Budget */}
            <motion.div variants={itemVariants}>
              <Card
                className={`${DASHBOARD_COLORS.card.background} ${DASHBOARD_COLORS.stats.startingBudget.border} ${DASHBOARD_COLORS.stats.startingBudget.borderHover} transition-all duration-300 hover:scale-[1.02] hover:shadow-md`}>
                <CardContent className="p-3 md:p-4">
                  <div className="text-center space-y-2">
                    <p
                      className={`${DASHBOARD_COLORS.text.label} text-xs md:text-sm`}>
                      Starting Budget
                    </p>
                    <motion.p
                      data-testid="text-starting-budget"
                      className={`text-lg md:text-2xl font-bold ${DASHBOARD_COLORS.stats.startingBudget.text}`}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}>
                      ₹{formatIndianNumber(startingBudget)}
                    </motion.p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Total Spent */}
            <motion.div variants={itemVariants}>
              <Card
                className={`${DASHBOARD_COLORS.card.background} ${DASHBOARD_COLORS.stats.totalSpent.border} ${DASHBOARD_COLORS.stats.totalSpent.borderHover} transition-all duration-300 hover:scale-[1.02] hover:shadow-md`}>
                <CardContent className="p-3 md:p-4">
                  <div className="text-center space-y-2">
                    <p
                      className={`${DASHBOARD_COLORS.text.label} text-xs md:text-sm`}>
                      Total Spent
                    </p>
                    <motion.p
                      data-testid="text-total-spent"
                      className={`text-lg md:text-2xl font-bold ${DASHBOARD_COLORS.stats.totalSpent.text}`}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}>
                      {teamStat
                        ? `₹${formatIndianNumber(teamStat.totalSpent)}`
                        : "₹0"}
                    </motion.p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card
                className={`${DASHBOARD_COLORS.card.background} ${
                  DASHBOARD_COLORS.card.border
                } ${
                  DASHBOARD_COLORS.card.borderHover
                } transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${
                  playersExceeded ? DASHBOARD_COLORS.status.exceeded : ""
                }`}>
                <CardContent className="p-3 md:p-4">
                  <div className="text-center space-y-2">
                    <p
                      className={`${DASHBOARD_COLORS.text.label} text-xs md:text-sm`}>
                      Total Players
                    </p>
                    <motion.p
                      data-testid="text-total-players"
                      className={`text-xl md:text-2xl font-bold ${
                        playersExceeded
                          ? DASHBOARD_COLORS.text.error
                          : DASHBOARD_COLORS.text.primary
                      }`}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}>
                      {currentPlayers}/{MAX_PLAYERS}
                    </motion.p>
                    {playersExceeded ? (
                      <motion.p
                        className={`text-xs ${DASHBOARD_COLORS.text.error} font-semibold`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}>
                        Limit exceeded!
                      </motion.p>
                    ) : currentPlayers === MAX_PLAYERS ? (
                      <p className={`text-xs ${DASHBOARD_COLORS.text.success}`}>
                        Squad full
                      </p>
                    ) : (
                      <p className={`text-xs ${DASHBOARD_COLORS.text.info}`}>
                        {currentPlayers < MIN_PLAYERS
                          ? `Need ${
                              MIN_PLAYERS - currentPlayers
                            } more for eligibility`
                          : `Can add ${MAX_PLAYERS - currentPlayers} more`}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card
                className={`${DASHBOARD_COLORS.card.background} ${
                  DASHBOARD_COLORS.card.border
                } ${
                  DASHBOARD_COLORS.card.borderHover
                } transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${
                  overseasExceeded ? DASHBOARD_COLORS.status.exceeded : ""
                }`}>
                <CardContent className="p-3 md:p-4">
                  <div className="text-center space-y-2">
                    <p
                      className={`${DASHBOARD_COLORS.text.label} text-xs md:text-sm`}>
                      Foreign Players
                    </p>
                    <motion.p
                      data-testid="text-foreign-players"
                      className={`text-xl md:text-2xl font-bold ${
                        overseasExceeded
                          ? DASHBOARD_COLORS.text.error
                          : DASHBOARD_COLORS.text.primary
                      }`}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}>
                      {currentOverseas}/{MAX_OVERSEAS}
                    </motion.p>
                    {overseasExceeded ? (
                      <motion.p
                        className={`text-xs ${DASHBOARD_COLORS.text.error} font-semibold`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}>
                        Limit exceeded!
                      </motion.p>
                    ) : currentOverseas >= MAX_OVERSEAS ||
                      currentPlayers >= MAX_PLAYERS ? (
                      <p className={`text-xs ${DASHBOARD_COLORS.text.success}`}>
                        {currentOverseas >= MAX_OVERSEAS
                          ? "Foreign quota full"
                          : "Squad full"}
                      </p>
                    ) : (
                      <p className={`text-xs ${DASHBOARD_COLORS.text.info}`}>
                        Can add{" "}
                        {Math.min(
                          MAX_OVERSEAS - currentOverseas,
                          MAX_PLAYERS - currentPlayers
                        )}{" "}
                        more
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card
                className={`${DASHBOARD_COLORS.card.background} ${
                  DASHBOARD_COLORS.card.border
                } ${
                  DASHBOARD_COLORS.card.borderHover
                } transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${
                  currentPlayers >= MIN_PLAYERS
                    ? DASHBOARD_COLORS.status.eligible
                    : DASHBOARD_COLORS.status.notEligible
                }`}>
                <CardContent className="p-3 md:p-4">
                  <div className="text-center space-y-2">
                    <p
                      className={`${DASHBOARD_COLORS.text.label} text-xs md:text-sm`}>
                      Squad Status
                    </p>
                    <motion.p
                      data-testid="text-squad-status"
                      className={`text-lg md:text-xl font-bold ${
                        currentPlayers >= MIN_PLAYERS
                          ? DASHBOARD_COLORS.text.success
                          : DASHBOARD_COLORS.text.error
                      }`}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}>
                      {currentPlayers >= MIN_PLAYERS
                        ? "Eligible"
                        : "Not Eligible"}
                    </motion.p>
                    <p className={`text-xs ${DASHBOARD_COLORS.text.info}`}>
                      {getConfigText.minPlayers()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Players Table */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}>
          {loadingPlayers ? (
            <Card
              className={`${DASHBOARD_COLORS.card.background} ${DASHBOARD_COLORS.card.border}`}>
              <CardContent className="p-6">
                <div className={`text-center ${DASHBOARD_COLORS.text.label}`}>
                  Loading team players...
                </div>
              </CardContent>
            </Card>
          ) : (
            <PlayerCards
              players={teamPlayers}
              title={`${teamConfig.name} Squad (${teamPlayers.length} players)`}
            />
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};
