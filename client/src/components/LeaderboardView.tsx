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
      transition={{ duration: 0.5, ease: "easeOut" }}>
      <Card className="w-full bg-[#0f1629] border-[#1a2332]">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-wwwiplt-2-0comwhite text-lg md:text-xl font-bold">
            Team Leaderboard ({leaderboard.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-[#1a2332] border-b border-[#2a3441]">
                  <th
                    className="p-3 md:p-4 text-left text-gray-300 text-sm font-semibold cursor-pointer hover:bg-[#2a3441] transition-colors"
                    onClick={() => handleSort("rank")}>
                    <div className="flex items-center">
                      Rank
                      {getSortIcon("rank")}
                    </div>
                  </th>
                  <th
                    className="p-3 md:p-4 text-left text-gray-300 text-sm font-semibold cursor-pointer hover:bg-[#2a3441] transition-colors"
                    onClick={() => handleSort("teamName")}>
                    <div className="flex items-center">
                      Team Name
                      {getSortIcon("teamName")}
                    </div>
                  </th>
                  <th
                    className="p-3 md:p-4 text-center text-gray-300 text-sm font-semibold cursor-pointer hover:bg-[#2a3441] transition-colors"
                    onClick={() => handleSort("totalSpent")}>
                    <div className="flex items-center justify-center">
                      Total Spent
                      {getSortIcon("totalSpent")}
                    </div>
                  </th>
                  <th
                    className="p-3 md:p-4 text-center text-gray-300 text-sm font-semibold cursor-pointer hover:bg-[#2a3441] transition-colors"
                    onClick={() => handleSort("fundsRemaining")}>
                    <div className="flex items-center justify-center">
                      Remaining Budget
                      {getSortIcon("fundsRemaining")}
                    </div>
                  </th>
                  <th
                    className="p-3 md:p-4 text-center text-gray-300 text-sm font-semibold cursor-pointer hover:bg-[#2a3441] transition-colors"
                    onClick={() => handleSort("playersCount")}>
                    <div className="flex items-center justify-center">
                      Total Players
                      {getSortIcon("playersCount")}
                    </div>
                  </th>
                  <th
                    className="p-3 md:p-4 text-center text-gray-300 text-sm font-semibold cursor-pointer hover:bg-[#2a3441] transition-colors"
                    onClick={() => handleSort("overseasCount")}>
                    <div className="flex items-center justify-center">
                      Foreign Players
                      {getSortIcon("overseasCount")}
                    </div>
                  </th>
                  <th
                    className="p-3 md:p-4 text-center text-gray-300 text-sm font-semibold cursor-pointer hover:bg-[#2a3441] transition-colors"
                    onClick={() => handleSort("totalPoints")}>
                    <div className="flex items-center justify-center">
                      Total Team Points
                      {getSortIcon("totalPoints")}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedLeaderboard.map((team, index) => {
                  const isEven = index % 2 === 0;
                  const rank = rankMap.get(team.teamId) ?? index + 1;

                  return (
                    <tr
                      key={team.teamId}
                      className={`border-b border-[#2a3441] hover:bg-[#1a2332] transition-colors ${
                        isEven ? "bg-[#0f1629]" : "bg-[#151b2e]"
                      }`}>
                      <td className="p-3 md:p-4 text-center">
                        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-sm">
                          {rank}
                        </div>
                      </td>
                      <td className="p-3 md:p-4">
                        <div className="flex items-center gap-3">
                          <TeamLogo
                            logo={
                              teamLogos[team.teamName] ||
                              team.teamName
                                .split(" ")
                                .map((w) => w[0])
                                .join("")
                            }
                            name={team.teamName}
                          />
                          <span className="text-white font-medium text-sm md:text-base">
                            {team.teamName}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 md:p-4 text-center text-green-400 font-semibold text-sm md:text-base">
                        {formatCurrency(team.totalSpent)}
                      </td>
                      <td className="p-3 md:p-4 text-center text-blue-400 font-semibold text-sm md:text-base">
                        {formatCurrency(team.fundsRemaining)}
                      </td>
                      <td className="p-3 md:p-4 text-center text-white font-medium text-sm md:text-base">
                        {team.playersCount}
                      </td>
                      <td className="p-3 md:p-4 text-center text-purple-400 font-medium text-sm md:text-base">
                        {team.overseasCount}
                      </td>
                      <td className="p-3 md:p-4 text-center text-yellow-400 font-semibold text-sm md:text-base">
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
