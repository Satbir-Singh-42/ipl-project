import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabaseService } from "@/services/supabaseService";
import type { TeamStats } from "@/services/supabaseService";
import { formatIndianNumber } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { AUCTION_CONFIG } from "@shared/config";

export function AdminTeams() {
  const { toast } = useToast();
  const [teams, setTeams] = useState<TeamStats[]>([]);
  const [editingBudgets, setEditingBudgets] = useState<Record<string, string>>(
    {},
  );

  const loadTeams = async () => {
    const data = await supabaseService.getTeamStats();
    setTeams(data);
    const budgets: Record<string, string> = {};
    data.forEach((t) => {
      budgets[t.teamId] = t.startingBudget.toString();
    });
    setEditingBudgets(budgets);
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleSaveBudget = async (teamId: string) => {
    const budget = parseFloat(editingBudgets[teamId]);
    if (isNaN(budget) || budget < 0) {
      toast({ title: "Invalid budget amount", variant: "destructive" });
      return;
    }

    try {
      await supabaseService.updateTeamBudget(teamId, budget);
      toast({ title: "Budget updated" });
      await loadTeams();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: message, variant: "destructive" });
    }
  };

  const handleResetAllBudgets = async () => {
    if (!confirm("Reset all team budgets to 1 Crore? This cannot be undone."))
      return;

    try {
      const { error } = await supabase
        .from("teams")
        .update({ starting_budget: AUCTION_CONFIG.defaultTeamBudget })
        .neq("id", 0);

      if (error) throw new Error(error.message);
      toast({ title: "All budgets reset to 1 Crore" });
      await loadTeams();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1629] text-white p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <h1 className="text-2xl font-bold">Manage Teams</h1>
          </div>
          <button
            onClick={handleResetAllBudgets}
            className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-semibold"
          >
            Reset All Budgets
          </button>
        </div>

        {/* Teams Grid */}
        <div className="space-y-3">
          {teams.map((team) => (
            <Card
              key={team.teamId}
              className="bg-[#18184a]/80 border-white/10"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <h3 className="text-white font-bold text-base">
                      {team.teamName}
                    </h3>
                    <div className="flex gap-4 mt-1 text-xs text-white/50">
                      <span>Players: {team.playersCount}</span>
                      <span>Overseas: {team.overseasCount}</span>
                      <span>Points: {team.totalPoints}</span>
                      <span>
                        Spent: ₹{formatIndianNumber(team.totalSpent)}
                      </span>
                      <span>
                        Remaining: ₹{formatIndianNumber(team.fundsRemaining)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/50 text-xs">Budget:</span>
                    <input
                      type="number"
                      value={editingBudgets[team.teamId] || ""}
                      onChange={(e) =>
                        setEditingBudgets({
                          ...editingBudgets,
                          [team.teamId]: e.target.value,
                        })
                      }
                      className="w-32 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#fe6804]/50"
                    />
                    <button
                      onClick={() => handleSaveBudget(team.teamId)}
                      className="p-2 rounded-lg bg-[#fe6804]/20 text-[#fe6804] hover:bg-[#fe6804]/30 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
