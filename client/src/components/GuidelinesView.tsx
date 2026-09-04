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
  Save, Wifi, HardDrive, ChevronRight, Info,
} from "lucide-react";
import { AUCTION_CONFIG, PLAYING_XI_CONFIG, KEYBOARD_SHORTCUTS } from "@shared/config";

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

const auctionRules = [
  { label: "Squad Size", value: `${AUCTION_CONFIG.minPlayers}–${AUCTION_CONFIG.maxPlayers} players`, icon: Users },
  { label: "Foreign Players", value: `Max ${AUCTION_CONFIG.maxOverseasPlayers} per full squad`, icon: Globe },
  { label: "Bid Increment", value: `₹${(AUCTION_CONFIG.bidIncrement).toLocaleString()} per step`, icon: DollarSign },
  { label: "Default Budget", value: `₹${(AUCTION_CONFIG.defaultTeamBudget / 100000).toLocaleString()} Lakh`, icon: Target },
  { label: "Base Price", value: `₹${(AUCTION_CONFIG.defaultBasePrice / 1000).toLocaleString()}K default`, icon: DollarSign },
  { label: "Qualification", value: `Top ${AUCTION_CONFIG.teamsQualifying} teams advance`, icon: Star },
];

const playingXIRules = [
  { role: "Total Players", rule: `Exactly ${PLAYING_XI_CONFIG.totalPlayers}`, icon: Shield },
  { role: "Batsmen", rule: `${PLAYING_XI_CONFIG.batsmen.min}–${PLAYING_XI_CONFIG.batsmen.max} required`, icon: Target },
  { role: "Wicket-Keepers", rule: `${PLAYING_XI_CONFIG.wicketKeepers.min}–${PLAYING_XI_CONFIG.wicketKeepers.max} (min ${PLAYING_XI_CONFIG.wicketKeepers.min})`, icon: Zap },
  { role: "All-Rounders", rule: `At least ${PLAYING_XI_CONFIG.allRounders.min}`, icon: Star },
  { role: "Bowlers", rule: `At least ${PLAYING_XI_CONFIG.bowlers.min}`, icon: Target },
  { role: "Foreign Players", rule: `Max ${PLAYING_XI_CONFIG.foreignPlayers.max} in XI`, icon: Globe },
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
  return (
    <motion.div
      className="w-full space-y-6"
      initial="initial"
      animate="animate"
      variants={stagger}
    >
      {/* Hero Header */}
      <motion.div {...fadeInUp}>
        <Card className="bg-gradient-to-br from-[#1a1f3a]/90 to-[#0a0e1a]/90 border-[#90b6ff]/30 overflow-hidden">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#fe6804]/10 via-transparent to-[#ef4123]/10" />
            <CardContent className="relative p-6 md:p-8 lg:p-10 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fe6804]/10 border border-[#fe6804]/30 mb-4">
                <Info className="w-3.5 h-3.5 text-[#fe6804]" />
                <span className="text-[11px] font-semibold tracking-wider text-[#fe6804] uppercase">Official Guidelines</span>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 tracking-tight">
                IPL 2025 Player Auction
              </h1>
              <p className="text-base md:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
                Complete guide to navigating the auction dashboard, understanding rules, and using all available features.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-xs font-medium text-green-400">
                  <Wifi className="w-3 h-3" /> Real-Time Updates
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-medium text-blue-400">
                  <Monitor className="w-3 h-3" /> Desktop & Mobile
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs font-medium text-purple-400">
                  <Keyboard className="w-3 h-3" /> Keyboard Shortcuts
                </span>
              </div>
            </CardContent>
          </div>
        </Card>
      </motion.div>

      {/* Navigation Guide */}
      <motion.div variants={item}>
        <Card className="bg-gradient-to-br from-[#1a1f3a]/90 to-[#0a0e1a]/90 border-[#90b6ff]/30">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                <LayoutGrid className="w-4.5 h-4.5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Navigation Guide</h2>
                <p className="text-xs text-white/50">Browse through all available tabs from the top navbar</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {navItems.map((nav) => (
                <div
                  key={nav.label}
                  className="group flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.06] transition-all duration-200"
                >
                  <div className={`mt-0.5 ${nav.color}`}>
                    <nav.icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white mb-1">{nav.label}</h3>
                    <p className="text-xs text-white/50 leading-relaxed">{nav.desc}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-white/20 mt-1 shrink-0 group-hover:text-white/40 transition-colors" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Auction Rules */}
      <motion.div variants={item}>
        <Card className="bg-gradient-to-br from-[#1a1f3a]/90 to-[#0a0e1a]/90 border-[#90b6ff]/30">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                <Gavel className="w-4.5 h-4.5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Auction Rules</h2>
                <p className="text-xs text-white/50">Core mechanics and team constraints for the auction</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {auctionRules.map((rule) => (
                <div
                  key={rule.label}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#fe6804]/10 border border-[#fe6804]/30 flex items-center justify-center shrink-0">
                    <rule.icon className="w-4 h-4 text-[#fe6804]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-white/50 font-medium uppercase tracking-wider">{rule.label}</p>
                    <p className="text-sm font-semibold text-white truncate">{rule.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <Separator className="bg-white/10 my-5" />
            <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
              <h3 className="text-sm font-semibold text-orange-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> How Bidding Works
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-white/60 leading-relaxed">
                <div>
                  <p className="font-semibold text-white/80 mb-1">1. Base Price Set</p>
                  <p>Each player has a minimum base price set by the admin. The auctioneer opens bidding at this amount.</p>
                </div>
                <div>
                  <p className="font-semibold text-white/80 mb-1">2. Bidding Increments</p>
                  <p>Bids increase by ₹{(AUCTION_CONFIG.bidIncrement).toLocaleString()} per step. On mobile, tap the bid area. On desktop, use keyboard shortcuts.</p>
                </div>
                <div>
                  <p className="font-semibold text-white/80 mb-1">3. Sold / Unsold</p>
                  <p>Auctioneer marks the player as Sold (to a team) or Unsold. Sold triggers confetti, Unsold shows a stamp overlay.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Playing XI Rules */}
      <motion.div variants={item}>
        <Card className="bg-gradient-to-br from-[#1a1f3a]/90 to-[#0a0e1a]/90 border-[#90b6ff]/30">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                <Swords className="w-4.5 h-4.5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Playing XI Rules</h2>
                <p className="text-xs text-white/50">Team composition requirements for a valid playing eleven</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
              {playingXIRules.map((rule) => (
                <div
                  key={rule.role}
                  className="text-center p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto mb-2.5">
                    <rule.icon className="w-5 h-5 text-purple-400" />
                  </div>
                  <p className="text-[11px] text-white/50 font-medium uppercase tracking-wider mb-0.5">{rule.role}</p>
                  <p className="text-sm font-bold text-white">{rule.rule}</p>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
              <h3 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" /> Validation Summary
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                The Playing XI selector enforces all rules in real-time. A green indicator shows when your lineup is valid.
                You can only download a CSV export once the lineup passes all validation checks. Selections are auto-saved
                to your browser's local storage and persist across sessions.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Keyboard Shortcuts & Mobile Gestures */}
      <motion.div variants={item}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Keyboard Shortcuts */}
          <Card className="bg-gradient-to-br from-[#1a1f3a]/90 to-[#0a0e1a]/90 border-[#90b6ff]/30">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                  <Keyboard className="w-4.5 h-4.5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Keyboard Shortcuts</h2>
                  <p className="text-xs text-white/50">Auction page only — disabled in search box</p>
                </div>
              </div>
              <div className="space-y-2">
                {keyboardShortcuts.map((sc) => (
                  <div key={sc.desc} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white/[0.03]">
                    <div className="flex items-center gap-1 shrink-0">
                      {sc.keys.map((k) => (
                        <kbd
                          key={k}
                          className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md bg-white/10 border border-white/15 text-[11px] font-mono font-bold text-white/80"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                    <span className="text-xs text-white/60">{sc.desc}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mobile Gestures */}
          <Card className="bg-gradient-to-br from-[#1a1f3a]/90 to-[#0a0e1a]/90 border-[#90b6ff]/30">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center">
                  <Smartphone className="w-4.5 h-4.5 text-pink-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Mobile Gestures</h2>
                  <p className="text-xs text-white/50">Touch controls for the auction page</p>
                </div>
              </div>
              <div className="space-y-2">
                {mobileGestures.map((g) => (
                  <div key={g.gesture} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white/[0.03]">
                    <div className="w-20 shrink-0">
                      <span className="text-xs font-semibold text-pink-400">{g.gesture}</span>
                    </div>
                    <span className="text-xs text-white/60 flex-1">{g.action}</span>
                    {g.min && <Tag label={g.min} />}
                  </div>
                ))}
              </div>
              <Separator className="bg-white/10 my-4" />
              <div className="p-3 rounded-lg bg-pink-500/5 border border-pink-500/20">
                <p className="text-xs text-white/50 leading-relaxed">
                  <span className="font-semibold text-white/70">Tap to Increment</span> is enabled only on screens ≤768px.
                  Desktop users can use keyboard shortcuts (Space / Enter) instead.
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
          <Card className="bg-gradient-to-br from-[#1a1f3a]/90 to-[#0a0e1a]/90 border-[#90b6ff]/30">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                  <HardDrive className="w-4.5 h-4.5 text-green-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Data Management</h2>
                  <p className="text-xs text-white/50">How your data is saved and synced</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03]">
                  <Save className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">Local Storage</p>
                    <p className="text-xs text-white/50">Auction state, Playing XI selections, and preferences are saved to your browser. Survives page refreshes.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03]">
                  <RefreshCw className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">Auto Sync</p>
                    <p className="text-xs text-white/50">Data refreshes every 5s on homepage, 60s on auction page. Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono font-bold text-white/70">Z</kbd> for manual sync.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03]">
                  <Wifi className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">Real-Time</p>
                    <p className="text-xs text-white/50">Supabase Realtime pushes instant updates when data changes. No page refresh needed.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03]">
                  <Clock className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">Undo Support</p>
                    <p className="text-xs text-white/50">Mistake? Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono font-bold text-white/70">R</kbd> within the auction page to revert the last sold/unsold action instantly.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Features */}
          <Card className="bg-gradient-to-br from-[#1a1f3a]/90 to-[#0a0e1a]/90 border-[#90b6ff]/30">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                  <Zap className="w-4.5 h-4.5 text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Key Features</h2>
                  <p className="text-xs text-white/50">Everything the dashboard offers</p>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { icon: Eye, text: "Real-time auction tracking with Supabase Realtime" },
                  { icon: Search, text: "Advanced search & filter across names, roles, nations" },
                  { icon: Filter, text: "Sortable columns on all player tables" },
                  { icon: LayoutGrid, text: "Interactive Playing XI selector with CSV export" },
                  { icon: Trophy, text: "Live leaderboard with circular rank indicators" },
                  { icon: Undo2, text: "Quick undo for auction actions" },
                  { icon: Download, text: "Export team data as CSV" },
                  { icon: Globe, text: "Foreign player tracking & limit enforcement" },
                ].map((f) => (
                  <div key={f.text} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white/[0.03]">
                    <f.icon className="w-4 h-4 text-yellow-400 shrink-0" />
                    <span className="text-xs text-white/60">{f.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Footer Note */}
      <motion.div variants={item}>
        <Card className="bg-gradient-to-br from-[#1a1f3a]/60 to-[#0a0e1a]/60 border-[#90b6ff]/15">
          <CardContent className="p-5 text-center">
            <p className="text-xs text-white/40 leading-relaxed">
              For additional help or to report an issue, contact the auction administrator.
              All configuration values can be customized in <code className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-white/60">shared/config.ts</code>.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
