import React, { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useIPLData } from "@/hooks/useIPLData";
import { useAuth } from "@/contexts/AuthContext";
import { PlayerTable } from "@/components/PlayerTable";
import { LeaderboardView } from "@/components/LeaderboardView";
import { GuidelinesView } from "@/components/GuidelinesView";
import { LoadingPage } from "@/components/LoadingPage";
import { supabaseService, type Team } from "@/services/supabaseService";
import { TEAM_CARD_CONFIG } from "@shared/config";

const navigationTabs = [
  { id: "overview", label: "OVERVIEW", isExternal: false },
  { id: "sold", label: "SOLD PLAYERS", isExternal: false },
  { id: "unsold", label: "UNSOLD PLAYERS", isExternal: false },
  { id: "leaderboard", label: "LEADERBOARD", isExternal: false },
  { id: "guidelines", label: "GUIDELINES", isExternal: false },
  { id: "auction", label: "AUCTION", isExternal: true },
];

// Create a component to display team logo or abbreviation
const TeamLogo = ({
  logo,
  name,
  className = "",
}: {
  logo: string;
  name: string;
  className?: string;
}) => {
  // Import helper to get team initials
  const { getTeamInitials } = supabaseService;

  // Check if logo is a file path or abbreviation
  const isImageLogo = logo.startsWith("/") || logo.startsWith("http");

  if (isImageLogo) {
    return (
      <div
        className={`w-full h-full aspect-square bg-cover bg-center ${className}`}
        style={{ backgroundImage: `url(${logo})` }}
      />
    );
  } else {
    // Display team initials instead of ?? if logo is missing
    const displayText = logo === '??' ? getTeamInitials(name) : logo;
    const teamGradient = supabaseService.getTeamGradient(name);
    return (
      <div
        className={`w-full h-full aspect-square flex items-center justify-center text-2xl font-bold text-white ${teamGradient} ${className}`}>
        {displayText}
      </div>
    );
  }
};

export const PlayerDetailsSection = (): JSX.Element => {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      if (window.location.pathname === "/leaderboard") return "leaderboard";
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab) return tab;
    }
    return "overview";
  });
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const { isAuthenticated, role, logout } = useAuth();
  const {
    teamStats,
    players,
    leaderboard,
    isLoading,
    error,
    getUnsoldPlayers,
    getSoldPlayersByTeam,
  } = useIPLData();

  const navigationTabsList = React.useMemo(() => {
    const list = [
      { id: "overview", label: "OVERVIEW", shortLabel: "OVERVIEW", isExternal: false, href: "" },
      { id: "sold", label: "SOLD PLAYERS", shortLabel: "SOLD", isExternal: false, href: "" },
      { id: "unsold", label: "UNSOLD PLAYERS", shortLabel: "UNSOLD", isExternal: false, href: "" },
      { id: "leaderboard", label: "LEADERBOARD", shortLabel: "LEADERBOARD", isExternal: false, href: "" },
      { id: "guidelines", label: "GUIDELINES", shortLabel: "GUIDELINES", isExternal: false, href: "" },
      { id: "auction", label: "AUCTION", shortLabel: "AUCTION", isExternal: true, href: "/auction" },
    ];
    if (isAuthenticated && role === "admin") {
      list.push({ id: "admin", label: "ADMIN PANEL", shortLabel: "ADMIN", isExternal: true, href: "/admin" });
    }
    return list;
  }, [isAuthenticated, role]);

  // Call all hooks unconditionally at the top level
  const { data: unsoldPlayers, isLoading: loadingUnsold } = getUnsoldPlayers();
  const { data: soldPlayers, isLoading: loadingPlayers } = getSoldPlayersByTeam(
    selectedTeam || ""
  );

  // Generate team configs from leaderboard data (already sorted by ranking)
  const teamConfigs = React.useMemo(() => {
    if (!leaderboard) return [];
    return leaderboard.map((stat) => ({
      id: stat.teamId,
      name: stat.teamName,
      logo: supabaseService.getTeamLogo(stat.teamName),
      fundsRemaining: stat.fundsRemaining,
      overseasPlayers: stat.overseasCount,
      totalPlayers: stat.playersCount,
      borderColor: supabaseService.getTeamBorderColor(stat.teamName),
      bgGradient: supabaseService.getTeamGradient(stat.teamName),
    }));
  }, [leaderboard]);

  // Show loading page only for initial load, not background refreshes
  const shouldShowLoading = () => {
    switch (activeTab) {
      case "sold":
        return !players && isLoading; // Only show if no cached data exists
      case "unsold":
        return !unsoldPlayers && loadingUnsold; // Only show if no cached data exists
      case "leaderboard":
        return !leaderboard && isLoading; // Only show if no cached data exists
      default: // overview
        return !leaderboard && isLoading; // Only show if no cached data exists
    }
  };

  if (shouldShowLoading()) {
    return <LoadingPage />;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleTabClick = (tab: { id: string; isExternal: boolean; href?: string }) => {
    if (tab.href) {
      setLocation(tab.href);
      return;
    }
    setActiveTab(tab.id);
  };

  const handleTeamClick = (teamId: string) => {
    setLocation(`/team/${teamId}`);
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-red-400 text-lg">
            Error loading data: {error.message}
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "sold":
        // Show all sold players with team filtering, respecting pre-selected team
        const allSoldPlayers =
          players?.filter((p) => p.status === "sold") || [];
        const selectedTeamConfig = teamConfigs.find(
          (team) => team.id === selectedTeam
        );
        const teamDisplayName = selectedTeamConfig
          ? selectedTeamConfig.name
          : selectedTeam;
        return (
          <PlayerTable
            players={allSoldPlayers}
            title={
              selectedTeam ? `${teamDisplayName} Sold Players` : "Sold Players"
            }
            showTeam={true}
            showTeamFilter={true}
            teams={teamConfigs}
            selectedTeamFilter={selectedTeam}
            onTeamFilter={(teamId) => setSelectedTeam(teamId)}
          />
        );

      case "unsold":
        if (loadingUnsold) {
          return (
            <div className="text-wwwiplt-2-0comwhite">
              Loading unsold players...
            </div>
          );
        }
        // Ensure only truly unsold players are shown here
        const confirmedUnsoldPlayers = (unsoldPlayers || []).filter(
          (p) => p.status === "unsold"
        );
        return (
          <PlayerTable
            players={confirmedUnsoldPlayers}
            title="Unsold Players"
            showTeam={false}
            showTeamFilter={false}
            defaultSortField="sheetOrder"
            defaultSortDirection="asc"
            showPoints={false}
            showFinalBidPrice={false}
          />
        );

      case "leaderboard":
        return <LeaderboardView leaderboard={leaderboard || []} />;

      case "guidelines":
        return <GuidelinesView />;

      default: // overview
        if (teamStats && teamStats.length > 0) {
          return (
            <main className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4 sm:gap-6 content-start">
              {teamConfigs.map((teamConfig: Team) => {
                const teamStat = leaderboard?.find(
                  (stat) => stat.teamId === teamConfig.id
                );
                return (
                  <motion.div
                    key={teamConfig.id}
                    whileHover={{
                      scale: 1.05,
                      y: -8,
                      transition: { duration: 0.2, ease: "easeOut" },
                    }}
                    whileTap={{ scale: 0.98 }}>
                    <Card
                      className={`${TEAM_CARD_CONFIG.container.base} ${TEAM_CARD_CONFIG.container.hover} ${teamConfig.borderColor} ${teamConfig.bgGradient}`}
                      onClick={() => handleTeamClick(teamConfig.id)}>
                      <div className="flex flex-col items-center gap-2">
                        <div className={TEAM_CARD_CONFIG.logo.container}>
                          <TeamLogo
                            logo={teamConfig.logo}
                            name={teamConfig.name}
                          />
                        </div>
                        <div className={TEAM_CARD_CONFIG.teamName.container}>
                          <span className={TEAM_CARD_CONFIG.teamName.text}>
                            {teamConfig.name}
                          </span>
                        </div>
                      </div>

                      <CardContent className={`flex flex-col items-start w-full ${TEAM_CARD_CONFIG.content.background} ${TEAM_CARD_CONFIG.content.padding} flex-1`}>
                        <div className={`flex flex-col items-start pb-3 w-full border-b border-solid ${TEAM_CARD_CONFIG.stats.divider}`}>
                          <div className="flex flex-col items-center py-2 w-full">
                            <span className={TEAM_CARD_CONFIG.stats.label}>
                              Funds Remaining
                            </span>
                          </div>

                          <div className="flex flex-col items-center w-full">
                            <span className={TEAM_CARD_CONFIG.stats.value}>
                              {teamStat
                                ? formatCurrency(teamStat.fundsRemaining)
                                : "₹0"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-stretch justify-center w-full flex-1">
                          <div className={`pr-2 border-r border-solid ${TEAM_CARD_CONFIG.stats.divider} flex flex-col justify-between flex-1`}>
                            <div className="flex flex-col items-center py-2 w-full">
                              <span className={TEAM_CARD_CONFIG.stats.label}>
                                Overseas Players
                              </span>
                            </div>

                            <div className="flex flex-col items-center w-full">
                              <span className={TEAM_CARD_CONFIG.stats.value}>
                                {teamStat?.overseasCount || 0}
                              </span>
                            </div>
                          </div>

                          <div className="pl-2 flex flex-col justify-between flex-1">
                            <div className="flex flex-col items-center py-2 w-full">
                              <span className={TEAM_CARD_CONFIG.stats.label}>
                                Total Players
                              </span>
                            </div>

                            <div className="flex flex-col items-center w-full">
                              <span className={TEAM_CARD_CONFIG.stats.value}>
                                {teamStat?.playersCount || 0}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Points row */}
                        <div
                          className={`flex flex-col items-center pt-2 pb-1 w-full border-t border-solid ${TEAM_CARD_CONFIG.stats.divider} mt-2`}
                        >
                          <span className={TEAM_CARD_CONFIG.stats.label}>
                            Total Points
                          </span>
                          <span className="[font-family:'Work_Sans',Helvetica] font-bold text-[#00bcd4] text-lg text-center leading-7">
                            {teamStat?.totalPoints ?? 0}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </main>
          );
        } else {
          return (
            <div className="flex items-center justify-center h-32">
              <div className="text-wwwiplt-2-0comwhite text-lg">
                No teams available
              </div>
            </div>
          );
        }
    }
  };

  return (
    <motion.div
      className="bg-[#18184a] w-full min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}>
      {/* Unified Header */}
      <header
        className="sticky top-0 z-50 w-full backdrop-blur bg-[#0b2a7d]/80 border-b border-white/10 shadow-md"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(24,24,74,0.95) 0%, rgba(12,28,158,0.85) 49%, rgba(24,24,74,0.95) 100%)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}>
        <div className="w-full px-2 sm:px-4 lg:px-6 2xl:px-8 py-2 sm:py-2.5">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2">
            {/* Title Section */}
            <div className="flex items-center gap-2">
              <h1
                className="[font-family:'Work_Sans',Helvetica] font-bold text-sm sm:text-base md:text-lg lg:text-xl 2xl:text-2xl leading-tight tracking-[0] cursor-pointer whitespace-nowrap shrink-0"
                data-testid="text-title">
                <span className="text-white"> IPL 2025 </span>
                <span className="text-[#fe6804]">Player Auction</span>
              </h1>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1 w-full lg:w-auto overflow-x-auto scrollbar-hide">
              <nav
                className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto w-full lg:w-auto scrollbar-hide"
                aria-label="Primary navigation"
                role="navigation">
                <ul
                  className="flex items-center gap-1 sm:gap-1.5 xl:gap-2 min-w-max pr-1"
                  role="tablist">
                  {navigationTabsList.map((tab) => (
                    <li key={tab.id} role="none">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        aria-controls={`panel-${tab.id}`}
                        data-testid={`button-tab-${tab.id}`}
                        className={`h-auto px-2 sm:px-2.5 lg:px-2 xl:px-2.5 2xl:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] xl:text-xs font-semibold tracking-wide transition-all duration-200 whitespace-nowrap active:scale-95 ${
                          tab.id === "admin"
                            ? "bg-gradient-to-r from-[#fe6804] to-[#ef4123] text-white hover:opacity-90 shadow-sm"
                            : tab.isExternal
                              ? "bg-[linear-gradient(180deg,rgba(255,107,0,1)_0%,rgba(239,65,35,1)_100%)] text-white hover:opacity-90 shadow-sm"
                              : activeTab === tab.id
                                ? "bg-[linear-gradient(180deg,rgba(255,107,0,1)_0%,rgba(239,65,35,1)_100%)] text-white shadow-sm"
                                : "bg-white/10 border border-[#90b6ff]/60 text-white hover:text-white hover:bg-white/20 hover:border-[#fe6804]/60"
                        }`}
                        onClick={() => handleTabClick(tab)}>
                        <span className="hidden 2xl:inline">{tab.label}</span>
                        <span className="inline 2xl:hidden">{tab.shortLabel || tab.label}</span>
                      </button>
                    </li>
                  ))}
                  {isAuthenticated && (
                    <li>
                      <button
                        type="button"
                        className="h-auto px-2 sm:px-2.5 lg:px-2 xl:px-2.5 2xl:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] xl:text-xs font-semibold tracking-wide transition-all duration-200 whitespace-nowrap active:scale-95 bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 hover:text-white"
                        onClick={logout}>
                        LOGOUT
                      </button>
                    </li>
                  )}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Section */}
      <section className="w-full bg-[#18184a] p-4 sm:p-6 md:p-8 lg:p-[30px_47px] pt-6 md:pt-8">
        <div className="w-full bg-wwwiplt20comconcrete-80 rounded-[16px] md:rounded-[22.47px] backdrop-blur-[28.09px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(28.09px)_brightness(100%)] p-4 sm:p-6 md:p-[22px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              id={`panel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}>
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </motion.div>
  );
};
