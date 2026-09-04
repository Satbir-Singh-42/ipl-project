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
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full"
    >
      <Card className="w-full bg-[#0f1629] border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
        <CardHeader className="p-3.5 sm:p-5 md:p-6 border-b border-white/10 bg-[#18184a]/60">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-white text-base sm:text-lg md:text-xl font-bold font-['Work_Sans',sans-serif] flex items-center justify-between">
              <span>{title}</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 sm:ml-3">
                {sortedPlayers.length} Players
              </span>
            </CardTitle>
          </div>

          {/* Search Box */}
          <div className="mt-3 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search by name, role, nation, team, age..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 py-2 text-xs sm:text-sm bg-black/40 border-white/15 text-white placeholder:text-white/40 focus:ring-2 focus:ring-[#00bcd4] focus:border-[#00bcd4] rounded-xl"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors text-xs p-1">
                ✕
              </button>
            )}
          </div>
        </CardHeader>

        {/* Team Filter */}
        {showTeamFilter && teams.length > 0 && (
          <div className="px-3.5 sm:px-5 md:px-6 py-3 border-b border-white/5 bg-black/20">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide py-0.5">
              <Button
                variant={selectedTeamFilter === null ? "default" : "outline"}
                size="sm"
                onClick={() => handleTeamFilter(null)}
                className={`h-7 px-3 text-xs rounded-full font-semibold transition-all whitespace-nowrap ${
                  selectedTeamFilter === null
                    ? "bg-[#fe6804] text-white hover:bg-[#fe6804]/90 shadow-sm"
                    : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                }`}>
                All Teams
              </Button>
              {teams.map((team) => (
                <Button
                  key={team.id}
                  variant={selectedTeamFilter === team.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTeamFilter(team.id)}
                  className={`h-7 px-3 text-xs rounded-full font-semibold transition-all whitespace-nowrap ${
                    selectedTeamFilter === team.id
                      ? "bg-[#00bcd4] text-black font-bold hover:bg-[#00bcd4]/90 shadow-sm"
                      : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                  }`}>
                  {team.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        <CardContent className="p-0">
          <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            <div className="max-h-[70vh] overflow-y-auto">
              <table className="w-full min-w-[600px] text-left border-collapse">
                <thead className="sticky top-0 bg-[#18184a] border-b border-white/10 text-slate-300 text-xs sm:text-sm font-semibold z-10">
                  <tr>
                    <th className="py-3 px-2 sm:px-3 text-center w-12 sm:w-14">
                      <span>#</span>
                    </th>
                    <th className="py-3 px-2.5 sm:px-3.5 text-left min-w-[140px]">
                      <button
                        onClick={() => handleSort("name")}
                        className="flex items-center text-slate-200 font-semibold hover:text-[#00bcd4] transition-colors">
                        Player
                        {getSortIcon("name")}
                      </button>
                    </th>
                    <th className="py-3 px-2 sm:px-3 text-left">
                      <button
                        onClick={() => handleSort("role")}
                        className="flex items-center text-slate-200 font-semibold hover:text-[#00bcd4] transition-colors">
                        Role
                        {getSortIcon("role")}
                      </button>
                    </th>
                    <th className="py-3 px-2 sm:px-3 text-left">
                      <button
                        onClick={() => handleSort("nation")}
                        className="flex items-center text-slate-200 font-semibold hover:text-[#00bcd4] transition-colors">
                        Nation
                        {getSortIcon("nation")}
                      </button>
                    </th>
                    <th className="py-3 px-2 sm:px-3 text-center w-12 sm:w-16">
                      <button
                        onClick={() => handleSort("age")}
                        className="flex items-center justify-center text-slate-200 font-semibold hover:text-[#00bcd4] transition-colors">
                        Age
                        {getSortIcon("age")}
                      </button>
                    </th>
                    <th className="py-3 px-2.5 sm:px-3.5 text-left">
                      <button
                        onClick={() => handleSort("basePrice")}
                        className="flex items-center text-slate-200 font-semibold hover:text-[#00bcd4] transition-colors whitespace-nowrap">
                        <span className="hidden sm:inline">Base </span>Price
                        {getSortIcon("basePrice")}
                      </button>
                    </th>
                    {showFinalBidPrice && (
                      <th className="py-3 px-2.5 sm:px-3.5 text-left">
                        <button
                          onClick={() => handleSort("soldPrice")}
                          className="flex items-center text-slate-200 font-semibold hover:text-[#00bcd4] transition-colors whitespace-nowrap">
                          <span className="hidden sm:inline">Final </span>Price
                          {getSortIcon("soldPrice")}
                        </button>
                      </th>
                    )}
                    {showPoints && (
                      <th className="py-3 px-2 sm:px-3 text-center w-14 sm:w-20">
                        <button
                          onClick={() => handleSort("points")}
                          className="flex items-center justify-center text-slate-200 font-semibold hover:text-[#00bcd4] transition-colors">
                          Points
                          {getSortIcon("points")}
                        </button>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sortedPlayers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={
                          6 + (showFinalBidPrice ? 1 : 0) + (showPoints ? 1 : 0)
                        }
                        className="text-center py-12 text-slate-400 text-sm">
                        No players found
                      </td>
                    </tr>
                  ) : (
                    sortedPlayers.map((player, index) => (
                      <tr
                        key={player.name + "-" + player.originalIndex}
                        className={`hover:bg-white/[0.06] transition-colors ${
                          index % 2 === 0 ? "bg-[#0f1629]/80" : "bg-[#141b33]/80"
                        }`}>
                        <td className="py-2.5 px-2 sm:px-3 text-center text-slate-400 font-medium text-xs">
                          {index + 1}
                        </td>
                        <td className="py-2.5 px-2.5 sm:px-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-white font-semibold text-xs sm:text-sm truncate max-w-[130px] sm:max-w-[180px]">
                              {player.name}
                            </span>
                            {player.overseas && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 shrink-0">
                                OS
                              </span>
                            )}
                          </div>
                          {showTeam && player.team && player.team !== "N/A" && (
                            <div className="text-cyan-400/90 font-medium text-[11px] mt-0.5 truncate max-w-[140px]">
                              {player.team}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-2 sm:px-3 text-slate-300 text-xs">
                          <Badge variant="secondary" className="text-[10px] sm:text-xs px-2 py-0.5 bg-white/10 text-slate-200 border border-white/15">
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
                        <td className="py-2.5 px-2 sm:px-3 text-slate-300 text-xs truncate max-w-[90px]">
                          {player.nation}
                        </td>
                        <td className="py-2.5 px-2 sm:px-3 text-center text-slate-300 text-xs">
                          {player.age || "-"}
                        </td>
                        <td className="py-2.5 px-2.5 sm:px-3.5 text-slate-300 text-xs font-medium whitespace-nowrap">
                          {formatCurrency(player.basePrice)}
                        </td>
                        {showFinalBidPrice && (
                          <td className="py-2.5 px-2.5 sm:px-3.5 text-xs font-bold whitespace-nowrap">
                            {player.status === "sold" ? (
                              <span className="text-emerald-400">
                                {formatCurrency(player.soldPrice)}
                              </span>
                            ) : (
                              <span className="text-red-400 font-semibold px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20">
                                UNSOLD
                              </span>
                            )}
                          </td>
                        )}
                        {showPoints && (
                          <td className="py-2.5 px-2 sm:px-3 text-center text-amber-300 font-bold text-xs">
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
