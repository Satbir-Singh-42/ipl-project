import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamStats, supabaseService } from "@/services/supabaseService";
import { ChevronUp, ChevronDown } from "lucide-react";

interface LeaderboardViewProps {
  leaderboard: TeamStats[];
}

type SortField =
  | "rank"
  | "teamName"
  | "totalSpent"
  | "fundsRemaining"
  | "playersCount"
  | "overseasCount"
  | "totalPoints";
type SortDirection = "asc" | "desc";

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
  // Check if logo is a file path or abbreviation
  const isImageLogo = logo.startsWith("/") || logo.startsWith("http");

  if (isImageLogo) {
    return (
      <div
        className={`w-10 h-10 aspect-square bg-cover bg-center rounded-full flex-shrink-0 ${className}`}
        style={{ backgroundImage: `url(${logo})` }}
      />
    );
  } else {
    // Display team initials instead of ?? if logo is missing
    const displayText =
      logo === "??" ? supabaseService.getTeamInitials(name) : logo;
    const teamGradient = supabaseService.getTeamGradient(name);
    return (
      <div
        className={`w-10 h-10 aspect-square flex items-center justify-center rounded-full flex-shrink-0 ${teamGradient} text-white text-sm font-bold ${className}`}>
        {displayText}
      </div>
    );
  }
};

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  leaderboard,
}) => {
  const [sortField, setSortField] = useState<SortField>("totalPoints");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [teamLogos, setTeamLogos] = React.useState<Record<string, string>>({});

  // Load team logos asynchronously
  React.useEffect(() => {
    supabaseService.getTeamConfigs().then((configs) => {
      const logoMap: Record<string, string> = {};
      configs.forEach((config) => {
        logoMap[config.name] = config.logo;
      });
      setTeamLogos(logoMap);
    });
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const sortedLeaderboard = useMemo(() => {
    return [...leaderboard].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case "rank":
          // Multi-level ranking: points -> budget -> alphabetical
          if (a.totalPoints !== b.totalPoints) {
            aValue = a.totalPoints;
            bValue = b.totalPoints;
          } else if (a.fundsRemaining !== b.fundsRemaining) {
            aValue = a.fundsRemaining;
            bValue = b.fundsRemaining;
          } else {
            aValue = a.teamName.toLowerCase();
            bValue = b.teamName.toLowerCase();
          }
          break;
        case "teamName":
          aValue = a.teamName.toLowerCase();
          bValue = b.teamName.toLowerCase();
          break;
        case "totalSpent":
          aValue = a.totalSpent;
          bValue = b.totalSpent;
          break;
        case "fundsRemaining":
          aValue = a.fundsRemaining;
          bValue = b.fundsRemaining;
          break;
        case "playersCount":
          aValue = a.playersCount;
          bValue = b.playersCount;
          break;
        case "overseasCount":
          aValue = a.overseasCount;
          bValue = b.overseasCount;
          break;
        case "totalPoints":
          aValue = a.totalPoints;
          bValue = b.totalPoints;
          break;
        default:
          return 0;
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [leaderboard, sortField, sortDirection]);

  // Pre-compute rank map once (O(n log n)) instead of per-row (O(n² log n))
  const rankMap = useMemo(() => {
    const sorted = [...leaderboard].sort((a, b) => {
      if (a.totalPoints !== b.totalPoints) return b.totalPoints - a.totalPoints;
      if (a.fundsRemaining !== b.fundsRemaining)
        return b.fundsRemaining - a.fundsRemaining;
      return a.teamName.toLowerCase().localeCompare(b.teamName.toLowerCase());
    });
    const map = new Map<string, number>();
    sorted.forEach((team, i) => map.set(team.teamId, i + 1));
    return map;
  }, [leaderboard]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "teamName" ? "asc" : "desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1" />
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full"
    >
      <Card className="w-full bg-[#0f1629] border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
        <CardHeader className="p-3.5 sm:p-5 md:p-6 border-b border-white/10 bg-[#18184a]/60">
          <CardTitle className="text-white text-base sm:text-lg md:text-xl font-bold font-['Work_Sans',sans-serif] flex items-center justify-between">
            <span>Team Leaderboard</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
              {leaderboard.length} Teams
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            <table className="w-full min-w-[620px] text-left border-collapse">
              <thead>
                <tr className="bg-[#18184a]/90 border-b border-white/10 text-slate-300 text-xs sm:text-sm font-semibold">
                  <th
                    className="py-3 px-2.5 sm:px-3.5 text-center cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap"
                    onClick={() => handleSort("rank")}>
                    <div className="flex items-center justify-center">
                      Rank
                      {getSortIcon("rank")}
                    </div>
                  </th>
                  <th
                    className="py-3 px-2.5 sm:px-3.5 text-left cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap min-w-[140px]"
                    onClick={() => handleSort("teamName")}>
                    <div className="flex items-center">
                      Team Name
                      {getSortIcon("teamName")}
                    </div>
                  </th>
                  <th
                    className="py-3 px-2.5 sm:px-3 text-center cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap"
                    onClick={() => handleSort("totalSpent")}>
                    <div className="flex items-center justify-center">
                      <span className="hidden md:inline">Total </span>Spent
                      {getSortIcon("totalSpent")}
                    </div>
                  </th>
                  <th
                    className="py-3 px-2.5 sm:px-3 text-center cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap"
                    onClick={() => handleSort("fundsRemaining")}>
                    <div className="flex items-center justify-center">
                      <span className="hidden md:inline">Remaining </span>Budget
                      {getSortIcon("fundsRemaining")}
                    </div>
                  </th>
                  <th
                    className="py-3 px-2 sm:px-3 text-center cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap"
                    onClick={() => handleSort("playersCount")}>
                    <div className="flex items-center justify-center">
                      <span className="hidden sm:inline">Total </span>Squad
                      {getSortIcon("playersCount")}
                    </div>
                  </th>
                  <th
                    className="py-3 px-2 sm:px-3 text-center cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap"
                    onClick={() => handleSort("overseasCount")}>
                    <div className="flex items-center justify-center">
                      Overseas
                      {getSortIcon("overseasCount")}
                    </div>
                  </th>
                  <th
                    className="py-3 px-2.5 sm:px-3.5 text-center cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap"
                    onClick={() => handleSort("totalPoints")}>
                    <div className="flex items-center justify-center">
                      Points
                      {getSortIcon("totalPoints")}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedLeaderboard.map((team, index) => {
                  const isEven = index % 2 === 0;
                  const rank = rankMap.get(team.teamId) ?? index + 1;
                  const isTop3 = rank <= 3;

                  return (
                    <tr
                      key={team.teamId}
                      className={`hover:bg-white/[0.06] transition-colors ${
                        isEven ? "bg-[#0f1629]/80" : "bg-[#141b33]/80"
                      }`}>
                      <td className="py-3 px-2.5 sm:px-3.5 text-center">
                        <div
                          className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 mx-auto rounded-full font-bold text-xs sm:text-sm shadow-sm ${
                            rank === 1
                              ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-amber-500/30"
                              : rank === 2
                              ? "bg-gradient-to-r from-slate-200 to-slate-400 text-black shadow-slate-300/30"
                              : rank === 3
                              ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-orange-500/30"
                              : "bg-white/10 text-white/80 border border-white/15"
                          }`}
                        >
                          {rank}
                        </div>
                      </td>
                      <td className="py-3 px-2.5 sm:px-3.5">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <TeamLogo
                            className="w-7 h-7 sm:w-9 sm:h-9"
                            logo={
                              teamLogos[team.teamName] ||
                              team.teamName
                                .split(" ")
                                .map((w) => w[0])
                                .join("")
                            }
                            name={team.teamName}
                          />
                          <span className="text-white font-semibold text-xs sm:text-sm md:text-base truncate max-w-[130px] sm:max-w-[200px]">
                            {team.teamName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2.5 sm:px-3 text-center text-emerald-400 font-bold text-xs sm:text-sm md:text-base whitespace-nowrap">
                        {formatCurrency(team.totalSpent)}
                      </td>
                      <td className="py-3 px-2.5 sm:px-3 text-center text-cyan-400 font-bold text-xs sm:text-sm md:text-base whitespace-nowrap">
                        {formatCurrency(team.fundsRemaining)}
                      </td>
                      <td className="py-3 px-2 sm:px-3 text-center text-slate-200 font-semibold text-xs sm:text-sm md:text-base">
                        {team.playersCount}
                      </td>
                      <td className="py-3 px-2 sm:px-3 text-center text-purple-300 font-semibold text-xs sm:text-sm md:text-base">
                        {team.overseasCount}
                      </td>
                      <td className="py-3 px-2.5 sm:px-3.5 text-center text-amber-300 font-extrabold text-xs sm:text-sm md:text-base">
                        {team.totalPoints}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
