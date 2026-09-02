import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users,
  Trophy,
  TrendingUp,
  Download,
  LogOut,
  Home,
  Settings,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabaseService } from "@/services/supabaseService";
import { formatIndianNumber } from "@/lib/utils";

export function AdminDashboard() {
  const { user, role, logout } = useAuth();
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
      value: stats.totalPlayers,
      icon: Users,
      color: "#00bcd4",
    },
    {
      title: "Sold",
      value: stats.soldPlayers,
      icon: Trophy,
      color: "#4caf50",
    },
    {
      title: "Unsold",
      value: stats.unsoldPlayers,
      icon: TrendingUp,
      color: "#fe6804",
    },
    {
      title: "Total Spent",
      value: `₹${formatIndianNumber(stats.totalSpent)}`,
      icon: TrendingUp,
      color: "#9c27b0",
    },
  ];

  const navLinks = [
    { href: "/admin/players", label: "Manage Players", icon: Users },
    { href: "/admin/teams", label: "Manage Teams", icon: Trophy },
    { href: "/admin/export", label: "Export Data", icon: Download },
    { href: "/", label: "Public View", icon: Home },
    { href: "/auction", label: "Auction Page", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0f1629] text-white p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto space-y-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Admin Dashboard
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Logged in as {user?.email} ({role})
            </p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-semibold"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <Card
              key={card.title}
              className="bg-[#18184a]/80 border-white/10"
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${card.color}20` }}
                >
                  <card.icon
                    className="w-5 h-5"
                    style={{ color: card.color }}
                  />
                </div>
                <div>
                  <p className="text-white/60 text-xs">{card.title}</p>
                  <p className="text-white text-lg font-bold">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="bg-[#18184a]/80 border-white/10 hover:border-[#fe6804]/40 transition-colors cursor-pointer">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#fe6804]/10 flex items-center justify-center">
                    <link.icon className="w-6 h-6 text-[#fe6804]" />
                  </div>
                  <span className="text-white font-semibold text-base">
                    {link.label}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
