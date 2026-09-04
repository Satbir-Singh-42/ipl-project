import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Home, Users, UserX, Trophy, Gavel, Swords,
  Search, Filter, LayoutGrid, Eye, DollarSign,
  Smartphone, Monitor, Keyboard, ArrowLeft, ArrowRight,
  Undo2, RefreshCw, Zap, X, Check, AlertTriangle,
  Download, Shield, Star, Target, Globe, Clock,
  Save, Wifi, HardDrive, Info,
} from "lucide-react";
import { formatIndianNumber } from "@/lib/utils";
import { useAuctionRules } from "@/hooks/useAuctionRules";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const item = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const navItems = [
  { icon: Home, label: "Overview", desc: "Team cards sorted by ranking. Click any team for detailed stats, budget breakdown, and squad info.", color: "text-blue-400" },
  { icon: Users, label: "Sold Players", desc: "All purchased players with team filters, sortable columns, search, and real-time status updates.", color: "text-green-400" },
  { icon: UserX, label: "Unsold Players", desc: "Available players not yet purchased. Browse base prices, categories, roles, and detailed profiles.", color: "text-red-400" },
  { icon: Trophy, label: "Leaderboard", desc: "Complete team rankings with circular rank indicators, medal badges for top 3, and sortable stats.", color: "text-yellow-400" },
  { icon: Gavel, label: "Auction", desc: "Live auction management with real-time bidding, player viewer, keyboard shortcuts, and animations.", color: "text-orange-400" },
  { icon: Swords, label: "Playing XI", desc: "Interactive team selection with role validation, points tracking, and CSV export for each team.", color: "text-purple-400" },
];

const keyboardShortcuts = [
  { keys: ["R"], desc: "Undo last sold/unsold action" },
  { keys: ["Z"], desc: "Manual sync with Supabase" },
  { keys: ["←", "→"], desc: "Navigate previous / next player" },
  { keys: ["S"], desc: "Mark player as Sold (confetti + 1s delay)" },
  { keys: ["U"], desc: "Mark player as Unsold (stamp + 1s delay)" },
  { keys: ["Space", "Enter"], desc: "Increment current bid" },
  { keys: ["Esc"], desc: "Close player viewer modal" },
];

const mobileGestures = [
  { gesture: "Swipe Left", action: "Navigate to next player", min: "50px distance" },
  { gesture: "Swipe Right", action: "Navigate to previous player", min: "50px distance" },
  { gesture: "Tap Player Card", action: "Open player detail viewer", min: "" },
  { gesture: "Tap Bid Area", action: "Increment current bid (mobile only ≤768px)", min: "Tap feedback" },
  { gesture: "Tap Outside", action: "Close player viewer modal", min: "" },
];

const Tag = ({ label }: { label: string }) => (
  <span className="inline-block px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold tracking-wider text-white/70 uppercase">
    {label}
  </span>
);

export const GuidelinesView = (): JSX.Element => {
  const { rules } = useAuctionRules();

  const auctionRules = [
    { label: "Squad Size", value: `${rules.minPlayers || 11}–${rules.maxPlayers || 15} players`, icon: Users },
    { label: "Foreign Players", value: `Max ${rules.maxOverseas || 7} per full squad`, icon: Globe },
    { label: "Bid Increment", value: `+₹${formatIndianNumber(rules.bidIncrement || 100000)} per step`, icon: DollarSign },
    { label: "Default Budget", value: `₹${formatIndianNumber(rules.startingBudget || 10000000)}`, icon: Target },
    { label: "Base Price", value: `₹${formatIndianNumber(rules.defaultBasePrice || 400000)} default`, icon: DollarSign },
    { label: "Qualification", value: `Top ${rules.teamsQualifying || 8} teams advance`, icon: Star },
  ];

  const playingXIRules = [
    { role: "Total Players", rule: `Exactly ${rules.playingXITotal || 11}`, icon: Shield },
    { role: "Batsmen", rule: `${rules.batsmenMin || 2}–${rules.batsmenMax || 5} required`, icon: Target },
    { role: "Wicket-Keepers", rule: `${rules.wkMin || 1}–${rules.wkMax || 3} (min ${rules.wkMin || 1})`, icon: Zap },
    { role: "All-Rounders", rule: `At least ${rules.allRoundersMin || 1}`, icon: Star },
    { role: "Bowlers", rule: `At least ${rules.bowlersMin || 2}`, icon: Target },
    { role: "Foreign Players", rule: `Max ${rules.playingXIOverseasLimit || 4} in XI`, icon: Globe },
  ];

  return (
    <motion.div
      className="w-full space-y-6"
      initial="initial"
      animate="animate"
      variants={stagger}
    >
      {/* Hero Header */}
      <motion.div {...fadeInUp}>
        <Card className="bg-gradient-to-br from-[#18184a]/90 via-[#0f1629]/95 to-[#18184a]/90 border border-white/15 shadow-2xl backdrop-blur-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#fe6804]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#00bcd4]/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />
          <CardContent className="relative p-6 sm:p-8 md:p-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fe6804]/15 border border-[#fe6804]/40 mb-4 shadow-sm">
              <Info className="w-4 h-4 text-[#fe6804]" />
              <span className="text-xs font-bold tracking-wider text-[#fe6804] uppercase font-['Work_Sans',sans-serif]">Official Guidelines & Rules</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight font-['Work_Sans',sans-serif] drop-shadow-md">
              IPL 2025 Player Auction System
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
              Complete interactive reference for auction mechanics, team composition limits, keyboard shortcuts, and real-time live sync.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-xs font-semibold text-emerald-300 shadow-sm">
                <Wifi className="w-3.5 h-3.5" /> Real-Time Updates
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-xs font-semibold text-cyan-300 shadow-sm">
                <Monitor className="w-3.5 h-3.5" /> Responsive Design
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-500/15 border border-purple-400/40 text-xs font-semibold text-purple-300 shadow-sm">
                <Keyboard className="w-3.5 h-3.5" /> Fast Key Controls
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Navigation Guide (Arrows removed, vibrant cards) */}
      <motion.div variants={item}>
        <Card className="bg-gradient-to-br from-[#18184a]/90 to-[#0f1629]/95 border border-white/15 shadow-xl backdrop-blur-xl">
          <CardContent className="p-5 sm:p-7 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shadow-lg shadow-cyan-500/10">
                <LayoutGrid className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white font-['Work_Sans',sans-serif]">Navigation Guide</h2>
                <p className="text-xs text-slate-400">Available sections and views in the dashboard</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {navItems.map((nav) => (
                <div
                  key={nav.label}
                  className="flex items-start gap-3.5 p-4 rounded-xl bg-black/40 border border-white/10 hover:border-white/25 hover:bg-white/[0.06] transition-all duration-200 shadow-sm"
                >
                  <div className={`p-2.5 rounded-lg bg-white/5 border border-white/10 ${nav.color} shrink-0 shadow-inner`}>
                    <nav.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white mb-1 font-['Work_Sans',sans-serif]">{nav.label}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{nav.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Auction Rules */}
      <motion.div variants={item}>
        <Card className="bg-gradient-to-br from-[#18184a]/90 to-[#0f1629]/95 border border-white/15 shadow-xl backdrop-blur-xl">
          <CardContent className="p-5 sm:p-7 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center shadow-lg shadow-orange-500/10">
                <Gavel className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white font-['Work_Sans',sans-serif]">Auction Rules</h2>
                <p className="text-xs text-slate-400">Core mechanics and team constraints for the auction</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {auctionRules.map((rule) => (
                <div
                  key={rule.label}
                  className="flex items-center gap-3.5 p-4 rounded-xl bg-black/40 border border-white/10 hover:border-orange-500/30 transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#fe6804]/20 border border-[#fe6804]/40 flex items-center justify-center shrink-0 shadow-sm shadow-[#fe6804]/20">
                    <rule.icon className="w-5 h-5 text-[#fe6804]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{rule.label}</p>
                    <p className="text-sm font-bold text-white truncate font-['Work_Sans',sans-serif]">{rule.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <Separator className="bg-white/10 my-6" />
            <div className="p-4 sm:p-5 rounded-xl bg-orange-500/10 border border-orange-500/30">
              <h3 className="text-sm font-bold text-orange-400 mb-3 flex items-center gap-2 font-['Work_Sans',sans-serif]">
                <AlertTriangle className="w-4 h-4 text-orange-400" /> How Bidding Works
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-200 leading-relaxed">
                <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                  <p className="font-bold text-orange-300 mb-1">1. Base Price Opening</p>
                  <p>Each player has a set base price. The auctioneer opens bidding at this starting amount.</p>
                </div>
                <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                  <p className="font-bold text-orange-300 mb-1">2. Quick Increments</p>
                  <p>Bids increase with quick buttons (+20L, +50L, +1Cr, +2Cr) or keyboard shortcuts (Space / Enter).</p>
                </div>
                <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                  <p className="font-bold text-orange-300 mb-1">3. Team Assignment</p>
                  <p>Click Sold to choose from 10 team badges with instant purse validation, or Unsold to skip.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Playing XI Rules */}
      <motion.div variants={item}>
        <Card className="bg-gradient-to-br from-[#18184a]/90 to-[#0f1629]/95 border border-white/15 shadow-xl backdrop-blur-xl">
          <CardContent className="p-5 sm:p-7 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center shadow-lg shadow-purple-500/10">
                <Swords className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white font-['Work_Sans',sans-serif]">Playing XI Rules</h2>
                <p className="text-xs text-slate-400">Team composition requirements for a valid playing eleven</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
              {playingXIRules.map((rule) => (
                <div
                  key={rule.role}
                  className="text-center p-4 rounded-xl bg-black/40 border border-white/10 hover:border-purple-400/40 transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center mx-auto mb-2.5 shadow-sm shadow-purple-500/20">
                    <rule.icon className="w-5 h-5 text-purple-300" />
                  </div>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">{rule.role}</p>
                  <p className="text-xs sm:text-sm font-bold text-white font-['Work_Sans',sans-serif]">{rule.rule}</p>
                </div>
              ))}
            </div>
            <div className="p-4 sm:p-5 rounded-xl bg-purple-500/10 border border-purple-500/30">
              <h3 className="text-sm font-bold text-purple-300 mb-2 flex items-center gap-2 font-['Work_Sans',sans-serif]">
                <Info className="w-4 h-4 text-purple-300" /> Real-Time Lineup Validation
              </h3>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                The Playing XI builder enforces all constraints automatically. Indicators update live as players are selected.
                CSV export unlocks once all criteria are satisfied. Selections persist safely in local storage across browser refreshes.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Keyboard Shortcuts & Mobile Gestures */}
      <motion.div variants={item}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Keyboard Shortcuts */}
          <Card className="bg-gradient-to-br from-[#18184a]/90 to-[#0f1629]/95 border border-white/15 shadow-xl backdrop-blur-xl">
            <CardContent className="p-5 sm:p-7 md:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shadow-lg shadow-cyan-500/10">
                  <Keyboard className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white font-['Work_Sans',sans-serif]">Keyboard Shortcuts</h2>
                  <p className="text-xs text-slate-400">Fast controls for the auction view</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {keyboardShortcuts.map((sc) => (
                  <div key={sc.desc} className="flex items-center gap-3 py-2.5 px-3.5 rounded-xl bg-black/40 border border-white/10 hover:border-cyan-400/30 transition-colors">
                    <div className="flex items-center gap-1 shrink-0">
                      {sc.keys.map((k) => (
                        <kbd
                          key={k}
                          className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-xs font-mono font-bold text-cyan-300 shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                    <span className="text-xs text-slate-200 font-medium">{sc.desc}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mobile Gestures */}
          <Card className="bg-gradient-to-br from-[#18184a]/90 to-[#0f1629]/95 border border-white/15 shadow-xl backdrop-blur-xl">
            <CardContent className="p-5 sm:p-7 md:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-400/40 flex items-center justify-center shadow-lg shadow-pink-500/10">
                  <Smartphone className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white font-['Work_Sans',sans-serif]">Mobile & Touch</h2>
                  <p className="text-xs text-slate-400">Gestures on mobile devices</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {mobileGestures.map((g) => (
                  <div key={g.gesture} className="flex items-center gap-3 py-2.5 px-3.5 rounded-xl bg-black/40 border border-white/10 hover:border-pink-400/30 transition-colors">
                    <div className="w-24 shrink-0">
                      <span className="text-xs font-bold text-pink-300">{g.gesture}</span>
                    </div>
                    <span className="text-xs text-slate-200 font-medium flex-1">{g.action}</span>
                    {g.min && <Tag label={g.min} />}
                  </div>
                ))}
              </div>
              <Separator className="bg-white/10 my-4" />
              <div className="p-3.5 rounded-xl bg-pink-500/10 border border-pink-500/30">
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  <span className="font-bold text-pink-300">Tap to Increment</span> is enabled on mobile (≤768px).
                  Desktop users can use quick increment buttons or keyboard hotkeys.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Data Sync & Features */}
      <motion.div variants={item}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Data Management */}
          <Card className="bg-gradient-to-br from-[#18184a]/90 to-[#0f1629]/95 border border-white/15 shadow-xl backdrop-blur-xl">
            <CardContent className="p-5 sm:p-7 md:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                  <HardDrive className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white font-['Work_Sans',sans-serif]">Data Management</h2>
                  <p className="text-xs text-slate-400">Sync and persistence</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-black/40 border border-white/10">
                  <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 shrink-0">
                    <Save className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white font-['Work_Sans',sans-serif]">Local Storage</p>
                    <p className="text-xs text-slate-300 leading-relaxed">Auction state and Playing XI selections persist securely in browser storage.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-black/40 border border-white/10">
                  <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-400 shrink-0">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white font-['Work_Sans',sans-serif]">Auto Sync</p>
                    <p className="text-xs text-slate-300 leading-relaxed">Automatic background refreshes keep standings and budgets live.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-black/40 border border-white/10">
                  <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-400/30 text-purple-400 shrink-0">
                    <Wifi className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white font-['Work_Sans',sans-serif]">Real-Time Supabase</p>
                    <p className="text-xs text-slate-300 leading-relaxed">Instant live synchronization across all connected clients without page reloads.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-black/40 border border-white/10">
                  <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-400/30 text-amber-400 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white font-['Work_Sans',sans-serif]">Instant Undo</p>
                    <p className="text-xs text-slate-300 leading-relaxed">Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-[10px] font-mono font-bold text-amber-300">R</kbd> during auction to undo the last sale or unsold action.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Features */}
          <Card className="bg-gradient-to-br from-[#18184a]/90 to-[#0f1629]/95 border border-white/15 shadow-xl backdrop-blur-xl">
            <CardContent className="p-5 sm:p-7 md:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-400/40 flex items-center justify-center shadow-lg shadow-yellow-500/10">
                  <Zap className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white font-['Work_Sans',sans-serif]">Key Features</h2>
                  <p className="text-xs text-slate-400">Everything available in the dashboard</p>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { icon: Eye, text: "Live real-time auction management with Supabase" },
                  { icon: Search, text: "Fast player search & set filters across names, roles, nations" },
                  { icon: Filter, text: "Sortable tables for sold, unsold, and team rosters" },
                  { icon: LayoutGrid, text: "Playing XI builder with role constraints and CSV export" },
                  { icon: Trophy, text: "Live leaderboard ranking with podium indicators" },
                  { icon: Undo2, text: "Quick undo for immediate auction rollbacks" },
                  { icon: Download, text: "Export complete team rosters as CSV" },
                  { icon: Globe, text: "Foreign player limit validation (max 7 per squad)" },
                ].map((f) => (
                  <div key={f.text} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-black/40 border border-white/10 hover:border-yellow-400/30 transition-colors">
                    <f.icon className="w-4 h-4 text-yellow-400 shrink-0" />
                    <span className="text-xs text-slate-200 font-medium">{f.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

    </motion.div>
  );
};
