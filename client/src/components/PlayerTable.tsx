import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Player, Team } from "@/services/supabaseService";
import { ChevronUp, ChevronDown, Search } from "lucide-react";

interface PlayerTableProps {
  players: Player[];
  title: string;
  showTeam?: boolean;
  showTeamFilter?: boolean;
  teams?: Team[];
  selectedTeamFilter?: string | null;
  onTeamFilter?: (teamId: string | null) => void;
  defaultSortField?: SortField;
  defaultSortDirection?: SortDirection;
  showPoints?: boolean;
  showFinalBidPrice?: boolean;
}

type SortField =
  | "name"
  | "role"
  | "nation"
  | "age"
  | "basePrice"
  | "soldPrice"
  | "points"
  | "sheetOrder";
type SortDirection = "asc" | "desc";

export const PlayerTable: React.FC<PlayerTableProps> = ({
  players,
  title,
  showTeam = true,
  showTeamFilter = false,
  teams = [],
  selectedTeamFilter: externalSelectedTeam = null,
  onTeamFilter,
  defaultSortField = "name",
  defaultSortDirection = "asc",
  showPoints = true,
  showFinalBidPrice = true,
}) => {
  const [sortField, setSortField] = useState<SortField>(defaultSortField);
  const [sortDirection, setSortDirection] =
    useState<SortDirection>(defaultSortDirection);
  const [internalSelectedTeamFilter, setInternalSelectedTeamFilter] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Use external selection if provided, otherwise use internal state
  const selectedTeamFilter =
    externalSelectedTeam !== null
      ? externalSelectedTeam
      : internalSelectedTeamFilter;

  // Custom role sorting order
  const ROLE_ORDER = [
    "batsman",
    "bowler",
    "allrounder",
    "wicketkeeper",
  ] as const;
  const ALIASES: Record<string, string> = {
    batter: "batsman",
    bat: "batsman",
    bowl: "bowler",
    ar: "allrounder",
    "all-rounder": "allrounder",
    "all rounder": "allrounder",
    wk: "wicketkeeper",
    "wicket-keeper": "wicketkeeper",
    "wicket keeper": "wicketkeeper",
    wocketkeeper: "wicketkeeper",
  };

  const normalizeRole = (r?: string) => {
    const key = (r || "").toLowerCase().replace(/\s+/g, "").replace(/-/g, "");
    return ALIASES[key] ?? key;
  };

  const roleRank = (r?: string) => {
    const norm = normalizeRole(r);
    const idx = ROLE_ORDER.indexOf(norm as any);
    return idx === -1 ? Number.POSITIVE_INFINITY : idx;
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const sortedPlayers = useMemo(() => {
    let filtered = players;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          (p.name?.toLowerCase() || "").includes(query) ||
          (p.role?.toLowerCase() || "").includes(query) ||
          (p.nation?.toLowerCase() || "").includes(query) ||
          (p.team?.toLowerCase() || "").includes(query) ||
          (p.age && p.age.toString().includes(query)) ||
          (p.points && p.points.toString().includes(query)),
      );
    }

    // Filter by team if selected
    if (selectedTeamFilter) {
      const selectedTeam = teams.find((t) => t.id === selectedTeamFilter);
      if (selectedTeam) {
        filtered = filtered.filter(
          (p) =>
            p.team.toLowerCase().includes(selectedTeam.name.toLowerCase()) ||
            p.team.toLowerCase().includes(selectedTeamFilter.toLowerCase()),
        );
      }
    }

    // Sort players
    return [...filtered].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "role":
          aValue = roleRank(a.role);
          bValue = roleRank(b.role);
          if (aValue === bValue) {
            // Stable tiebreaker when roles have same rank
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
          }
          break;
        case "nation":
          aValue = a.nation.toLowerCase();
          bValue = b.nation.toLowerCase();
          break;
        case "age":
          aValue = a.age || 0;
          bValue = b.age || 0;
          break;
        case "basePrice":
          aValue = a.basePrice;
          bValue = b.basePrice;
          break;
        case "soldPrice":
          aValue = a.soldPrice;
          bValue = b.soldPrice;
          break;
        case "points":
          aValue = a.points || 0;
          bValue = b.points || 0;
          break;
        case "sheetOrder":
          aValue = a.originalIndex || 0;
          bValue = b.originalIndex || 0;
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
  }, [
    players,
    sortField,
    sortDirection,
    selectedTeamFilter,
    teams,
    searchQuery,
  ]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleTeamFilter = (teamId: string | null) => {
    // Only update internal state if not controlled externally
    if (externalSelectedTeam === null) {
      setInternalSelectedTeamFilter(teamId);
    }
    if (onTeamFilter) {
      onTeamFilter(teamId);
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
            {title} ({sortedPlayers.length})
          </CardTitle>

          {/* Search Box */}
          <div className="mt-4 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search players by name, role, nation, team, age, or points..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#1a2332] border-[#2a3441] text-white placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                ✕
              </button>
            )}
          </div>
        </CardHeader>

        {/* Team Filter */}
        {showTeamFilter && teams.length > 0 && (
          <div className="px-4 md:px-6 pb-4">
            <div className="flex items-center gap-2 md:gap-3 overflow-x-auto scrollbar-hide">
              <Button
                variant={selectedTeamFilter === null ? "default" : "outline"}
                size="sm"
                onClick={() => handleTeamFilter(null)}
                className="whitespace-nowrap">
                All Teams
              </Button>
              {teams.map((team) => (
                <Button
                  key={team.id}
                  variant={
                    selectedTeamFilter === team.id ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => handleTeamFilter(team.id)}
                  className="whitespace-nowrap">
                  {team.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="max-h-[70vh] overflow-y-auto">
              <table className="w-full min-w-[700px]">
                <thead className="sticky top-0 bg-[#0a1120] border-b border-[#1a2332]">
                  <tr>
                    <th className="text-left p-3 md:p-4">
                      <span className="text-white font-semibold">Sr. No.</span>
                    </th>
                    <th className="text-left p-3 md:p-4">
                      <button
                        onClick={() => handleSort("name")}
                        className="flex items-center text-white font-semibold hover:text-orange-300 transition-colors">
                        Player Name
                        {getSortIcon("name")}
                      </button>
                    </th>
                    <th className="text-left p-3 md:p-4">
                      <button
                        onClick={() => handleSort("role")}
                        className="flex items-center text-white font-semibold hover:text-orange-300 transition-colors">
                        Role
                        {getSortIcon("role")}
                      </button>
                    </th>
                    <th className="text-left p-3 md:p-4">
                      <button
                        onClick={() => handleSort("nation")}
                        className="flex items-center text-white font-semibold hover:text-orange-300 transition-colors">
                        Nation
                        {getSortIcon("nation")}
                      </button>
                    </th>
                    <th className="text-center p-3 md:p-4">
                      <button
                        onClick={() => handleSort("age")}
                        className="flex items-center text-white font-semibold hover:text-orange-300 transition-colors">
                        Age
                        {getSortIcon("age")}
                      </button>
                    </th>
                    <th className="text-left p-3 md:p-4">
                      <button
                        onClick={() => handleSort("basePrice")}
                        className="flex items-center text-white font-semibold hover:text-orange-300 transition-colors">
                        Base Price
                        {getSortIcon("basePrice")}
                      </button>
                    </th>
                    {showFinalBidPrice && (
                      <th className="text-left p-3 md:p-4">
                        <button
                          onClick={() => handleSort("soldPrice")}
                          className="flex items-center text-white font-semibold hover:text-orange-300 transition-colors">
                          Final Bid Price
                          {getSortIcon("soldPrice")}
                        </button>
                      </th>
                    )}
                    {showPoints && (
                      <th className="text-center p-3 md:p-4">
                        <button
                          onClick={() => handleSort("points")}
                          className="flex items-center text-white font-semibold hover:text-orange-300 transition-colors">
                          Points
                          {getSortIcon("points")}
                        </button>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sortedPlayers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={
                          6 + (showFinalBidPrice ? 1 : 0) + (showPoints ? 1 : 0)
                        }
                        className="text-center py-8 text-gray-400">
                        No players found
                      </td>
                    </tr>
                  ) : (
                    sortedPlayers.map((player, index) => (
                      <tr
                        key={player.name + "-" + player.originalIndex}
                        className={`border-b border-[#1a2332] ${
                          index % 2 === 0 ? "bg-[#0f1629]" : "bg-[#1a2332]"
                        }`}>
                        <td className="p-3 md:p-4 text-gray-300 font-medium">
                          {index + 1}
                        </td>
                        <td className="p-3 md:p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-300 font-medium text-sm md:text-base">
                              {player.name}
                            </span>
                            {player.overseas && (
                              <svg
                                className="w-4 h-4 text-blue-600"
                                fill="currentColor"
                                viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                          {showTeam && player.team && (
                            <div className="text-gray-500 text-xs mt-1">
                              {player.team}
                            </div>
                          )}
                        </td>
                        <td className="p-3 md:p-4 text-gray-300 text-sm font-medium">
                          <Badge variant="secondary" className="text-xs">
                            {player.role === "Wicket Keeper"
                              ? "WK"
                              : player.role === "All Rounder"
                                ? "AR"
                                : player.role === "Opening Batsman"
                                  ? "Opener"
                                  : player.role === "Middle Order Batsman"
                                    ? "Middle"
                                    : player.role === "Tail End Batsman"
                                      ? "Tail"
                                      : player.role === "Opening Bowler"
                                        ? "Opener"
                                        : player.role === "Death Bowler"
                                          ? "Death"
                                          : player.role}
                          </Badge>
                        </td>
                        <td className="p-3 md:p-4 text-gray-300 text-sm font-medium">
                          {player.nation}
                        </td>
                        <td className="p-3 md:p-4 text-center text-gray-300 text-sm font-medium">
                          {player.age || "-"}
                        </td>
                        <td className="p-3 md:p-4 text-left text-gray-300 text-sm font-medium">
                          {formatCurrency(player.basePrice)}
                        </td>
                        {showFinalBidPrice && (
                          <td className="p-3 md:p-4 text-left text-gray-300 text-sm font-medium">
                            {player.status === "sold" ? (
                              formatCurrency(player.soldPrice)
                            ) : (
                              <span className="text-red-400 font-medium">
                                UNSOLD
                              </span>
                            )}
                          </td>
                        )}
                        {showPoints && (
                          <td className="p-3 md:p-4 text-center text-gray-300 text-sm font-medium">
                            {player.points || "-"}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
