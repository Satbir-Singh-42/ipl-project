import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useTournament } from "@/contexts/TournamentContext";
import {
  Users,
  Trophy,
  TrendingUp,
  Coins,
  Download,
  Home,
  Settings,
  ArrowRight,
  Layers,
} from "lucide-react";
import { supabaseService } from "@/services/supabaseService";
import { formatIndianNumber } from "@/lib/utils";
import { AdminHeader } from "@/components/AdminHeader";

export function AdminDashboard() {
  const { user, role, displayName } = useAuth();
  const [, setLocation] = useLocation();
  const { currentTournament } = useTournament();
  const [stats, setStats] = useState({
    totalPlayers: 0,
    soldPlayers: 0,
    unsoldPlayers: 0,
    totalTeams: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      const players = await supabaseService.getPlayers();
      const teamStats = await supabaseService.getTeamStats();
      setStats({
        totalPlayers: players.length,
        soldPlayers: players.filter((p) => p.status === "sold").length,
        unsoldPlayers: players.filter((p) => p.status === "unsold").length,
        totalTeams: teamStats.length,
        totalSpent: teamStats.reduce((s, t) => s + t.totalSpent, 0),
      });
    };
    loadStats();
  }, []);

  const statCards = [
    {
      title: "Total Players",
      value: stats.totalPlayers.toString(),
      subtitle: "In catalogue",
      icon: Users,
      gradient:
        "bg-[linear-gradient(135deg,rgba(0,188,212,0.95)_0%,rgba(0,120,170,0.85)_45%,rgba(0,76,151,0.9)_100%)]",
      borderColor: "border-[#00bcd4]/50",
    },
    {
      title: "Sold Players",
      value: stats.soldPlayers.toString(),
      subtitle: `${
        stats.totalPlayers > 0
          ? Math.round((stats.soldPlayers / stats.totalPlayers) * 100)
          : 0
      }% of catalogue`,
      icon: Trophy,
      gradient:
        "bg-[linear-gradient(135deg,rgba(34,197,94,0.95)_0%,rgba(22,101,52,0.85)_45%,rgba(15,70,40,0.9)_100%)]",
      borderColor: "border-[#22c55e]/50",
    },
    {
      title: "Unsold Players",
      value: stats.unsoldPlayers.toString(),
      subtitle: "Available for auction",
      icon: TrendingUp,
      gradient:
        "bg-[linear-gradient(135deg,rgba(254,104,4,0.95)_0%,rgba(239,65,35,0.85)_45%,rgba(180,30,10,0.9)_100%)]",
      borderColor: "border-[#fe6804]/50",
    },
    {
      title: "Total Spent",
      value: `₹${formatIndianNumber(stats.totalSpent)}`,
      subtitle: `Across ${stats.totalTeams} teams`,
      icon: Coins,
      gradient:
        "bg-[linear-gradient(135deg,rgba(112,26,117,0.95)_0%,rgba(62,31,71,0.85)_45%,rgba(30,15,40,0.9)_100%)]",
      borderColor: "border-[#a855f7]/50",
    },
  ];

  const publicHref = currentTournament?.room_code
    ? `/room/${currentTournament.room_code}`
    : "/";

  const actionCards = [
    {
      title: "Manage Players",
      description:
        "View catalogue, add individual players, edit stats, or bulk import via CSV file.",
      href: "/admin/players",
      icon: Users,
      buttonText: "Open Player Manager",
      gradient:
        "bg-[linear-gradient(135deg,rgba(29,65,140,0.95)_0%,rgba(15,35,90,0.9)_100%)]",
      borderColor: "border-[#90b6ff]/40",
    },
    {
      title: "Manage Teams",
      description:
        "Configure team starting budgets, review spent funds, overseas counts and rosters.",
      href: "/admin/teams",
      icon: Trophy,
      buttonText: "Open Team Manager",
      gradient:
        "bg-[linear-gradient(135deg,rgba(180,140,0,0.95)_0%,rgba(140,110,0,0.85)_45%,rgba(100,80,0,0.9)_100%)]",
      borderColor: "border-[#F9CD00]/50",
    },
    {
      title: "Sets & Pools Manager",
      description:
        "Organize auction sets, structure call queues, resequence players, and pool unsold candidates.",
      href: "/admin/pools",
      icon: Layers,
      buttonText: "Open Pool Manager",
      gradient:
        "bg-[linear-gradient(135deg,rgba(100,40,160,0.95)_0%,rgba(60,20,110,0.9)_100%)]",
      borderColor: "border-purple-500/50",
    },
    {
      title: "Live Auction Page",
      description:
        "Access the live auction interface with real-time bidding, keyboard controls, and sold animations.",
      href: "/auction",
      icon: Settings,
      buttonText: "Launch Auction",
      gradient:
        "bg-[linear-gradient(135deg,rgba(254,104,4,0.95)_0%,rgba(239,65,35,0.9)_45%,rgba(180,30,10,0.95)_100%)]",
      borderColor: "border-[#fe6804]/60",
    },
    {
      title: "Export Data",
      description:
        "Download comprehensive CSV reports for all players, sold players, and team summaries.",
      href: "/admin/export",
      icon: Download,
      buttonText: "Export CSV Reports",
      gradient:
        "bg-[linear-gradient(135deg,rgba(0,151,167,0.95)_0%,rgba(0,120,135,0.85)_45%,rgba(0,70,100,0.9)_100%)]",
      borderColor: "border-[#00BCD4]/50",
    },
    {
      title: "Public Dashboard",
      description:
        "Switch to the public view showing team rankings, leaderboard, and playing XI selection.",
      href: publicHref,
      icon: Home,
      buttonText: "View Public Dashboard",
      gradient:
        "bg-[linear-gradient(135deg,rgba(62,31,71,0.95)_0%,rgba(45,20,55,0.85)_45%,rgba(30,15,40,0.9)_100%)]",
      borderColor: "border-[#a855f7]/40",
    },
  ];

  return (
    <motion.div
      className="bg-[#18184a] w-full min-h-screen text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Unified Header matching public site */}
      <AdminHeader activeTab="dashboard" />

      {/* Main Section */}
      <section className="w-full bg-[#18184a] p-2 sm:p-4 md:p-6 py-3 sm:py-5 flex-1">
        <div className="w-full bg-wwwiplt20comconcrete-80 rounded-xl md:rounded-2xl backdrop-blur-[28.09px] p-2.5 sm:p-4 md:p-5 shadow-2xl space-y-6 md:space-y-8">
          {/* Top Control Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#18184a]/90 border border-white/10 shadow-lg">
            <div>
              <h2 className="[font-family:'Work_Sans',Helvetica] text-lg sm:text-xl md:text-2xl font-bold text-white tracking-wide">
                Auction Administration Control
              </h2>
              <p className="text-white/60 text-xs sm:text-sm mt-0.5">
                Logged in as <span className="text-white font-semibold">{displayName || "Admin"}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#fe6804]/20 text-[#fe6804] border border-[#fe6804]/40">
                System Active
              </span>
            </div>
          </div>

          {/* Stat Cards */}
          <div>
            <div className="mb-3">
              <h3 className="[font-family:'Work_Sans',Helvetica] text-sm md:text-base font-bold text-[#18184a] uppercase tracking-wider">
                Auction Overview Statistics
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {statCards.map((card, idx) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.08 }}
                  className={`relative overflow-hidden rounded-[18px] border ${card.borderColor} ${card.gradient} p-5 shadow-xl text-white flex flex-col justify-between min-h-[150px]`}
                >
                  <div className="flex items-center justify-between">
                    <span className="[font-family:'Work_Sans',Helvetica] text-xs uppercase tracking-wider text-white/80 font-semibold">
                      {card.title}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/20">
                      <card.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="[font-family:'Work_Sans',Helvetica] text-2xl sm:text-3xl font-extrabold tracking-tight">
                      {card.value}
                    </div>
                    <div className="text-xs text-white/75 mt-1 font-medium">
                      {card.subtitle}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Action Modules */}
          <div>
            <div className="mb-3">
              <h3 className="[font-family:'Work_Sans',Helvetica] text-sm md:text-base font-bold text-[#18184a] uppercase tracking-wider">
                Management Modules
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {actionCards.map((card, idx) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + idx * 0.06 }}
                  onClick={() => setLocation(card.href)}
                  className={`cursor-pointer group relative overflow-hidden rounded-[18px] border ${card.borderColor} ${card.gradient} p-5 sm:p-6 shadow-xl text-white flex flex-col justify-between min-h-[190px] transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl`}
                >
                  <div>
                    <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/20 mb-4 group-hover:bg-white/25 transition-colors">
                      <card.icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="[font-family:'Work_Sans',Helvetica] text-lg font-bold tracking-tight">
                      {card.title}
                    </h4>
                    <p className="text-white/75 text-xs sm:text-sm mt-1.5 line-clamp-2">
                      {card.description}
                    </p>
                  </div>
                  <div className="mt-5 flex items-center justify-between pt-3 border-t border-white/15">
                    <span className="text-xs font-bold text-white tracking-wide uppercase">
                      {card.buttonText}
                    </span>
                    <ArrowRight className="w-4 h-4 text-white transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

