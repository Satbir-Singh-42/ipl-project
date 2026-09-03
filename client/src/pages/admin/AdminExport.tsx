import { useState, useEffect } from "react";
import {
  Download,
  AlertTriangle,
  Flame,
  Coins,
  CheckCircle2,
  Shield,
  FileSpreadsheet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabaseService, Player, TeamStats } from "@/services/supabaseService";
import { useToast } from "@/hooks/use-toast";
import { AdminHeader } from "@/components/AdminHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { formatIndianNumber } from "@/lib/utils";

export function AdminExport() {
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [teamLogos, setTeamLogos] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<{
    mostExpensive: Player | null;
    totalSpent: number;
    soldCount: number;
    totalCount: number;
    remainingPurse: number;
  }>({
    mostExpensive: null,
    totalSpent: 0,
    soldCount: 0,
    totalCount: 0,
    remainingPurse: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [players, teams, configs] = await Promise.all([
          supabaseService.getPlayers(),
          supabaseService.getTeamStats(),
          supabaseService.getTeamConfigs(),
        ]);

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
        const totalSpent = soldPlayers.reduce(
          (acc, p) => acc + (p.soldPrice || 0),
          0
        );
        const remainingPurse = teams.reduce(
          (acc, t) => acc + (t.fundsRemaining || 0),
          0
        );

        setStats({
          mostExpensive: topSold,
          totalSpent,
          soldCount: soldPlayers.length,
          totalCount: players.length,
          remainingPurse,
        });
      } catch (err) {
        console.error("Failed to load auction export stats:", err);
      }
    };
    loadStats();
  }, []);

  const downloadCSV = (csvString: string, filename: string) => {
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAll = async () => {
    const csv = await supabaseService.exportAllPlayersCSV();
    downloadCSV(csv, "ipl_auction_all_players.csv");
    toast({ title: "All players exported" });
  };

  const handleExportSold = async () => {
    const csv = await supabaseService.exportSoldPlayersCSV();
    downloadCSV(csv, "ipl_auction_sold_players.csv");
    toast({ title: "Sold players exported" });
  };

  const handleExportTeams = async () => {
    const csv = await supabaseService.exportTeamSummaryCSV();
    downloadCSV(csv, "ipl_auction_team_summary.csv");
    toast({ title: "Team summary exported" });
  };

  const handleResetAuction = async () => {
    setIsResetting(true);
    try {
      await supabaseService.resetAuction();
      toast({ title: "Auction has been reset. All players are now unsold." });
      setStats((prev) => ({
        ...prev,
        mostExpensive: null,
        totalSpent: 0,
        soldCount: 0,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: message, variant: "destructive" });
    } finally {
      setIsResetting(false);
      setShowResetConfirm(false);
    }
  };

  const exportButtons = [
    {
      label: "All Players Catalogue",
      description: "Complete export with ratings, roles, base prices, status, sold prices, and assigned teams",
      onClick: handleExportAll,
      color: "#00bcd4",
    },
    {
      label: "Sold Players Only",
      description: "Targeted export of successfully acquired players, selling amounts, and acquiring franchises",
      onClick: handleExportSold,
      color: "#4caf50",
    },
    {
      label: "Franchise Financial Summary",
      description: "Aggregated export of team purses, total expenditures, squad sizes, overseas caps, and point totals",
      onClick: handleExportTeams,
      color: "#fe6804",
    },
  ];

  const mostExpensiveTeamLogo = stats.mostExpensive?.team
    ? teamLogos[stats.mostExpensive.team]
    : undefined;

  return (
    <div className="bg-[#18184a] w-full min-h-screen text-white flex flex-col [font-family:'Work_Sans',Helvetica]">
      <AdminHeader activeTab="export" />

      <section className="w-full bg-[#18184a] p-2 sm:p-4 md:p-6 py-3 sm:py-5 flex-1">
        <div className="w-full bg-wwwiplt20comconcrete-80 rounded-xl md:rounded-2xl backdrop-blur-[28.09px] p-2.5 sm:p-4 md:p-5 space-y-4">
          {/* Major Auction Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Most Expensive Player */}
            <div className="bg-[#0f1629] border border-[#1a2332] rounded-xl p-3 sm:p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                {mostExpensiveTeamLogo && (mostExpensiveTeamLogo.startsWith("/") || mostExpensiveTeamLogo.startsWith("http")) ? (
                  <div
                    className="w-10 h-10 rounded-full bg-cover bg-center border border-white/20 shrink-0 shadow-sm"
                    style={{ backgroundImage: `url(${mostExpensiveTeamLogo})` }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Flame className="w-5 h-5 text-[#fe6804]" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-[11px] text-white/50 uppercase tracking-wider font-semibold">
                    Most Expensive Player
                  </div>
                  <div className="text-sm sm:text-base font-bold text-white truncate max-w-[140px]">
                    {stats.mostExpensive ? stats.mostExpensive.name : "None yet"}
                  </div>
                  <div className="text-[11px] text-[#fe6804] font-semibold">
                    {stats.mostExpensive
                      ? `₹${formatIndianNumber(stats.mostExpensive.soldPrice)} (${stats.mostExpensive.team ? supabaseService.getTeamInitials(stats.mostExpensive.team) : "—"})`
                      : "Auction pending"}
                  </div>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#fe6804]/10 border border-[#fe6804]/30 flex items-center justify-center text-[#fe6804] shrink-0">
                <Flame className="w-5 h-5" />
              </div>
            </div>

            {/* Total Auction Turnover */}
            <div className="bg-[#0f1629] border border-[#1a2332] rounded-xl p-3 sm:p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-white/50 uppercase tracking-wider font-semibold">
                  Total Auction Spend
                </div>
                <div className="text-base sm:text-lg font-bold text-white mt-0.5">
                  ₹{formatIndianNumber(stats.totalSpent)}
                </div>
                <div className="text-[11px] text-[#00BCD4] font-semibold mt-0.5">
                  Across all transactions
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#00BCD4]/10 border border-[#00BCD4]/30 flex items-center justify-center text-[#00BCD4] shrink-0">
                <Coins className="w-5 h-5" />
              </div>
            </div>

            {/* Sold Players vs Catalogue */}
            <div className="bg-[#0f1629] border border-[#1a2332] rounded-xl p-3 sm:p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-white/50 uppercase tracking-wider font-semibold">
                  Auction Clearance
                </div>
                <div className="text-base sm:text-lg font-bold text-white mt-0.5">
                  {stats.soldCount} / {stats.totalCount}
                </div>
                <div className="text-[11px] text-green-400 font-semibold mt-0.5">
                  {stats.totalCount > 0
                    ? `${((stats.soldCount / stats.totalCount) * 100).toFixed(0)}% players sold`
                    : "0%"}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* Total Remaining Purse */}
            <div className="bg-[#0f1629] border border-[#1a2332] rounded-xl p-3 sm:p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-white/50 uppercase tracking-wider font-semibold">
                  Remaining Purse
                </div>
                <div className="text-base sm:text-lg font-bold text-white mt-0.5">
                  ₹{formatIndianNumber(stats.remainingPurse)}
                </div>
                <div className="text-[11px] text-white/40 mt-0.5">
                  Available for upcoming bids
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Main Card with Reports */}
          <Card className="w-full bg-[#0f1629] border-[#1a2332]">
            <CardHeader className="p-3 sm:p-4 md:p-5 border-b border-[#1a2332]">
              <div>
                <CardTitle className="text-white text-base sm:text-lg md:text-xl font-bold flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#fe6804]" />
                  Export Data & Official Reports
                </CardTitle>
                <p className="text-white/60 text-xs mt-0.5">
                  Download live data extracts in CSV spreadsheet format for external reporting and analysis
                </p>
              </div>
            </CardHeader>

            <CardContent className="p-3 sm:p-4 md:p-5 space-y-6">
              {/* Export Buttons */}
              <div className="space-y-3">
                {exportButtons.map((btn) => (
                  <div
                    key={btn.label}
                    className="bg-[#1a2332] border border-[#2a3441] hover:border-[#fe6804]/50 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all cursor-pointer shadow-md group"
                    onClick={btn.onClick}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-inner shrink-0"
                        style={{ backgroundColor: `${btn.color}20` }}
                      >
                        <Download className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: btn.color }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-[#fe6804] transition-colors">
                          {btn.label}
                        </h3>
                        <p className="text-white/60 text-xs mt-0.5">
                          {btn.description}
                        </p>
                      </div>
                    </div>
                    <span className="self-start sm:self-auto text-xs font-bold text-white/90 uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-[#0f1629] border border-[#2a3441] group-hover:border-[#fe6804]/50 group-hover:bg-[#fe6804]/10 transition-colors whitespace-nowrap">
                      Download CSV
                    </span>
                  </div>
                ))}
              </div>

              {/* Danger Zone */}
              <div className="pt-2">
                <div className="bg-red-950/30 border border-red-500/40 rounded-xl p-4 sm:p-5 shadow-lg space-y-3">
                  <h4 className="text-red-300 font-bold text-sm sm:text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                    Danger Zone
                  </h4>
                  <p className="text-white/70 text-xs sm:text-sm">
                    Resetting the auction will mark ALL players as unsold, wipe all sold prices, and clear team rosters. This action cannot be reversed.
                  </p>
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    disabled={isResetting}
                    className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold transition-all active:scale-95 disabled:opacity-50 shadow-md"
                  >
                    Reset Entire Auction
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetAuction}
        title="Reset Entire Auction?"
        description="Are you absolutely sure? All sold players will be marked as unsold, purchase prices will be wiped, and team purse spends will be cleared. This action cannot be undone."
        confirmText="Reset Entire Auction"
        variant="danger"
        isLoading={isResetting}
      />
    </div>
  );
}
