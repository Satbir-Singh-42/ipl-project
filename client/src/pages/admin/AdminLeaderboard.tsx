import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import {
  Trophy,
  Users,
  Coins,
  ArrowUpDown,
  Search,
  ExternalLink,
  Shield,
  Award,
  Flame,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminHeader } from "@/components/AdminHeader";
import { supabaseService, TeamStats, Player } from "@/services/supabaseService";
import { formatIndianNumber } from "@/lib/utils";

type SortField =
  | "rank"
  | "teamName"
  | "totalSpent"
  | "fundsRemaining"
  | "playersCount"
  | "overseasCount"
  | "totalPoints";
type SortDirection = "asc" | "desc";

export function AdminLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<TeamStats[]>([]);
  const [teamLogos, setTeamLogos] = useState<Record<string, string>>({});
  const [mostExpensive, setMostExpensive] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("totalPoints");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [data, configs, players] = await Promise.all([
          supabaseService.getLeaderboard(),
          supabaseService.getTeamConfigs(),
          supabaseService.getPlayers(),
        ]);
        setLeaderboard(data);
        const logoMap: Record<string, string> = {};
        configs.forEach((c) => {
          logoMap[c.name] = c.logo;
        });
        setTeamLogos(logoMap);

        const soldPlayers = players.filter(
          (p) => p.status === "sold" && p.soldPrice > 0
        );
        const topSold =
          [...soldPlayers].sort((a, b) => b.soldPrice - a.soldPrice)[0] || null;
        setMostExpensive(topSold);
      } catch (err) {
        console.error("Failed to load admin leaderboard:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "teamName" ? "asc" : "desc");
    }
  };

  const filteredLeaderboard = useMemo(() => {
    return leaderboard.filter((team) =>
      team.teamName.toLowerCase().includes(search.toLowerCase())
    );
  }, [leaderboard, search]);

  const sortedLeaderboard = useMemo(() => {
    return [...filteredLeaderboard].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "rank":
          comparison = a.totalPoints !== b.totalPoints
            ? a.totalPoints - b.totalPoints
            : a.fundsRemaining - b.fundsRemaining;
          break;
        case "teamName":
          comparison = a.teamName.localeCompare(b.teamName);
          break;
        case "totalSpent":
          comparison = a.totalSpent - b.totalSpent;
          break;
        case "fundsRemaining":
          comparison = a.fundsRemaining - b.fundsRemaining;
          break;
        case "playersCount":
          comparison = a.playersCount - b.playersCount;
          break;
        case "overseasCount":
          comparison = a.overseasCount - b.overseasCount;
          break;
        case "totalPoints":
          comparison = a.totalPoints - b.totalPoints;
          break;
        default:
          comparison = 0;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredLeaderboard, sortField, sortDirection]);

  // Overall KPIs
  const topTeam = useMemo(() => {
    if (!leaderboard.length) return null;
    return [...leaderboard].sort((a, b) => b.totalPoints - a.totalPoints)[0];
  }, [leaderboard]);

  const topSpender = useMemo(() => {
    if (!leaderboard.length) return null;
    return [...leaderboard].sort((a, b) => b.totalSpent - a.totalSpent)[0];
  }, [leaderboard]);

  const totalPurseSpent = useMemo(() => {
    return leaderboard.reduce((acc, t) => acc + t.totalSpent, 0);
  }, [leaderboard]);

  const totalPlayersAcquired = useMemo(() => {
    return leaderboard.reduce((acc, t) => acc + t.playersCount, 0);
  }, [leaderboard]);

  const topTeamLogo = topTeam ? teamLogos[topTeam.teamName] : undefined;
  const topSpenderLogo = topSpender ? teamLogos[topSpender.teamName] : undefined;

  return (
    <div className="bg-[#18184a] w-full min-h-screen text-white flex flex-col [font-family:'Work_Sans',Helvetica]">
      <AdminHeader activeTab="leaderboard" />

      <section className="w-full bg-[#18184a] p-2 sm:p-4 md:p-6 py-3 sm:py-5 flex-1">
        <div className="w-full bg-wwwiplt20comconcrete-80 rounded-xl md:rounded-2xl backdrop-blur-[28.09px] p-2.5 sm:p-4 md:p-5 space-y-4">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Top Team */}
            <div className="bg-[#0f1629] border border-[#1a2332] rounded-xl p-3 sm:p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                {topTeamLogo && (topTeamLogo.startsWith("/") || topTeamLogo.startsWith("http")) ? (
                  <div
                    className="w-10 h-10 rounded-full bg-cover bg-center border border-white/20 shrink-0 shadow-sm"
                    style={{ backgroundImage: `url(${topTeamLogo})` }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#1a2332] border border-[#2a3441] flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {topTeam ? supabaseService.getTeamInitials(topTeam.teamName) : "—"}
                  </div>
                )}
                <div>
                  <div className="text-[11px] text-white/50 uppercase tracking-wider font-semibold">
                    Leaderboard Leader
                  </div>
                  <div className="text-base sm:text-lg font-bold text-white">
                    {topTeam ? supabaseService.getTeamInitials(topTeam.teamName) : "—"}
                  </div>
                  <div className="text-[11px] text-[#fe6804] font-semibold">
                    {topTeam ? `${topTeam.totalPoints.toFixed(1)} Pts` : "—"}
                  </div>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
            </div>

            {/* Most Expensive Player */}
            <div className="bg-[#0f1629] border border-[#1a2332] rounded-xl p-3 sm:p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                {mostExpensive?.team && teamLogos[mostExpensive.team] ? (
                  <div
                    className="w-10 h-10 rounded-full bg-cover bg-center border border-white/20 shrink-0 shadow-sm"
                    style={{ backgroundImage: `url(${teamLogos[mostExpensive.team]})` }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#1a2332] border border-[#2a3441] flex items-center justify-center text-xs font-bold text-white shrink-0">
                    <Flame className="w-5 h-5 text-[#fe6804]" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-[11px] text-white/50 uppercase tracking-wider font-semibold">
                    Most Expensive Player
                  </div>
                  <div className="text-sm sm:text-base font-bold text-white truncate max-w-[140px]">
                    {mostExpensive ? mostExpensive.name : "None yet"}
                  </div>
                  <div className="text-[11px] text-[#00BCD4] font-semibold">
                    {mostExpensive
                      ? `₹${formatIndianNumber(mostExpensive.soldPrice)} (${mostExpensive.team ? supabaseService.getTeamInitials(mostExpensive.team) : "—"})`
                      : "Pending"}
                  </div>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#00BCD4]/10 border border-[#00BCD4]/30 flex items-center justify-center text-[#00BCD4] shrink-0">
                <Coins className="w-5 h-5" />
              </div>
            </div>

            {/* Total Spent */}
            <div className="bg-[#0f1629] border border-[#1a2332] rounded-xl p-3 sm:p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-white/50 uppercase tracking-wider font-semibold">
                  Total League Spend
                </div>
                <div className="text-base sm:text-lg font-bold text-white mt-0.5">
                  ₹{formatIndianNumber(totalPurseSpent)}
                </div>
                <div className="text-[11px] text-white/40 mt-0.5">
                  Across {leaderboard.length} franchises
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
            </div>

            {/* Total Players Signed */}
            <div className="bg-[#0f1629] border border-[#1a2332] rounded-xl p-3 sm:p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-white/50 uppercase tracking-wider font-semibold">
                  Players Signed
                </div>
                <div className="text-base sm:text-lg font-bold text-white mt-0.5">
                  {totalPlayersAcquired}
                </div>
                <div className="text-[11px] text-white/40 mt-0.5">
                  Assigned to active rosters
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Main Leaderboard Table Card */}
          <Card className="w-full bg-[#0f1629] border-[#1a2332]">
            <CardHeader className="p-3 sm:p-4 md:p-5 border-b border-[#1a2332]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-white text-base sm:text-lg md:text-xl font-bold flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#fe6804]" />
                    Franchise Performance Leaderboard ({leaderboard.length})
                  </CardTitle>
                  <p className="text-white/60 text-xs mt-0.5">
                    Official rankings sorted by composite team evaluation points
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-60">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                    <Input
                      placeholder="Search franchise..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 h-8 sm:h-9 text-xs bg-[#1a2332] border-[#2a3441] text-white placeholder:text-gray-400 focus:ring-1 focus:ring-[#fe6804] focus:border-[#fe6804]"
                    />
                  </div>
                  <Link href="/admin/teams">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1a2332] hover:bg-[#2a3441] border border-[#2a3441] text-white text-xs font-semibold whitespace-nowrap transition-colors">
                      <span>Rosters</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#00BCD4]" />
                    </button>
                  </Link>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-left text-sm sm:text-base">
                  <thead className="sticky top-0 bg-[#0a1120] border-b border-[#1a2332] z-10">
                    <tr>
                      <th
                        onClick={() => handleSort("rank")}
                        className="px-3 py-3 sm:px-4 sm:py-3.5 text-white font-bold text-xs sm:text-sm cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap"
                      >
                        <div className="flex items-center gap-1.5">
                          Rank
                          <ArrowUpDown className="w-3.5 h-3.5 text-white/50" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("teamName")}
                        className="px-3 py-3 sm:px-4 sm:py-3.5 text-white font-bold text-xs sm:text-sm cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap"
                      >
                        <div className="flex items-center gap-1.5">
                          Franchise
                          <ArrowUpDown className="w-3.5 h-3.5 text-white/50" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("totalSpent")}
                        className="px-3 py-3 sm:px-4 sm:py-3.5 text-white font-bold text-xs sm:text-sm cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap"
                      >
                        <div className="flex items-center gap-1.5">
                          Total Spent
                          <ArrowUpDown className="w-3.5 h-3.5 text-white/50" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("fundsRemaining")}
                        className="px-3 py-3 sm:px-4 sm:py-3.5 text-white font-bold text-xs sm:text-sm cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap"
                      >
                        <div className="flex items-center gap-1.5">
                          Remaining Budget
                          <ArrowUpDown className="w-3.5 h-3.5 text-white/50" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("playersCount")}
                        className="px-3 py-3 text-center text-white font-bold text-xs sm:text-sm cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          Squad
                          <ArrowUpDown className="w-3.5 h-3.5 text-white/50" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("overseasCount")}
                        className="px-3 py-3 text-center text-white font-bold text-xs sm:text-sm cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          Overseas
                          <ArrowUpDown className="w-3.5 h-3.5 text-white/50" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("totalPoints")}
                        className="px-3 py-3 sm:px-4 sm:py-3.5 text-right text-white font-bold text-xs sm:text-sm cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          Total Points
                          <ArrowUpDown className="w-3.5 h-3.5 text-white/50" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a2332]">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-20">
                          <div className="flex flex-col items-center justify-center gap-3 text-white/70">
                            <div className="w-8 h-8 rounded-full border-2 border-[#fe6804] border-t-transparent animate-spin" />
                            <span className="text-sm font-semibold">Loading leaderboard data...</span>
                          </div>
                        </td>
                      </tr>
                    ) : sortedLeaderboard.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-gray-400">
                          No teams found
                        </td>
                      </tr>
                    ) : (
                      sortedLeaderboard.map((team, idx) => {
                        const rankNumber = idx + 1;

                        return (
                          <tr
                            key={team.teamId}
                            className="hover:bg-[#1a2332]/60 transition-colors group"
                          >
                            {/* Rank */}
                            <td className="px-3 py-3 sm:px-4 sm:py-3.5 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-bold ${
                                  rankNumber === 1
                                    ? "bg-amber-500 text-black shadow-md shadow-amber-500/30"
                                    : rankNumber === 2
                                    ? "bg-slate-300 text-black shadow-md shadow-slate-300/30"
                                    : rankNumber === 3
                                    ? "bg-amber-700 text-white shadow-md shadow-amber-700/30"
                                    : "bg-white/5 text-white/80 border border-white/10"
                                }`}
                              >
                                {rankNumber}
                              </span>
                            </td>

                            {/* Franchise Name */}
                            <td className="px-3 py-3 sm:px-4 sm:py-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                {(() => {
                                  const logo = teamLogos[team.teamName];
                                  if (logo && (logo.startsWith("/") || logo.startsWith("http"))) {
                                    return (
                                      <div
                                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-cover bg-center border border-white/20 shrink-0"
                                        style={{ backgroundImage: `url(${logo})` }}
                                      />
                                    );
                                  }
                                  return (
                                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1a2332] border border-[#2a3441] flex items-center justify-center text-xs font-bold text-white shrink-0">
                                      {supabaseService.getTeamInitials(team.teamName)}
                                    </div>
                                  );
                                })()}
                                <span className="font-bold text-sm sm:text-base text-white group-hover:text-[#fe6804] transition-colors">
                                  {team.teamName}
                                </span>
                              </div>
                            </td>

                            {/* Total Spent */}
                            <td className="px-3 py-3 sm:px-4 sm:py-3.5 whitespace-nowrap font-semibold text-sm sm:text-base text-white/90">
                              ₹{formatIndianNumber(team.totalSpent)}
                            </td>

                            {/* Remaining Budget */}
                            <td className="px-3 py-3 sm:px-4 sm:py-3.5 whitespace-nowrap font-semibold text-sm sm:text-base text-green-400">
                              ₹{formatIndianNumber(team.fundsRemaining)}
                            </td>

                            {/* Squad - clean number without box */}
                            <td className="px-3 py-3 text-center whitespace-nowrap text-sm sm:text-base font-semibold text-white/90">
                              {team.playersCount}
                            </td>

                            {/* Overseas - clean number without box */}
                            <td className="px-3 py-3 text-center whitespace-nowrap text-sm sm:text-base font-semibold text-white/90">
                              {team.overseasCount}
                            </td>

                            {/* Points */}
                            <td className="px-3 py-3 sm:px-4 sm:py-3.5 text-right whitespace-nowrap">
                              <span className="text-base sm:text-lg font-bold text-[#fe6804]">
                                {team.totalPoints.toFixed(1)}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
