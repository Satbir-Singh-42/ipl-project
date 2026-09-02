import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Download, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabaseService } from "@/services/supabaseService";
import { useToast } from "@/hooks/use-toast";

export function AdminExport() {
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);

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
    if (
      !confirm(
        "RESET ENTIRE AUCTION? All sold/unsold data will be cleared. This CANNOT be undone.",
      )
    )
      return;
    if (!confirm("Are you absolutely sure? Type confirms this action."))
      return;

    setIsResetting(true);
    try {
      await supabaseService.resetAuction();
      toast({ title: "Auction has been reset. All players are now unsold." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: message, variant: "destructive" });
    } finally {
      setIsResetting(false);
    }
  };

  const exportButtons = [
    {
      label: "All Players",
      description: "Export all players with status, prices, and teams",
      onClick: handleExportAll,
      color: "#00bcd4",
    },
    {
      label: "Sold Players Only",
      description: "Export only sold players with teams and final prices",
      onClick: handleExportSold,
      color: "#4caf50",
    },
    {
      label: "Team Summary",
      description:
        "Export team budgets, spending, player counts, and total points",
      onClick: handleExportTeams,
      color: "#fe6804",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f1629] text-white p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto space-y-8"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-2xl font-bold">Export Data</h1>
        </div>

        {/* Export Buttons */}
        <div className="space-y-4">
          {exportButtons.map((btn) => (
            <Card
              key={btn.label}
              className="bg-[#18184a]/80 border-white/10 hover:border-white/20 transition-colors cursor-pointer"
              onClick={btn.onClick}
            >
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold">{btn.label}</h3>
                  <p className="text-white/50 text-sm mt-0.5">
                    {btn.description}
                  </p>
                </div>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${btn.color}20` }}
                >
                  <Download className="w-5 h-5" style={{ color: btn.color }} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Danger Zone */}
        <div className="pt-4">
          <Card className="bg-red-950/30 border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-400 text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/60 text-sm mb-4">
                Resetting the auction will mark ALL players as unsold and clear
                all sold prices and team assignments. This action cannot be
                reversed.
              </p>
              <button
                onClick={handleResetAuction}
                disabled={isResetting}
                className="px-6 py-2.5 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isResetting ? "Resetting..." : "Reset Entire Auction"}
              </button>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
