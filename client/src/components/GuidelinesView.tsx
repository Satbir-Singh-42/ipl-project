import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AUCTION_CONFIG, PLAYING_XI_CONFIG } from "@shared/config";

export const GuidelinesView = (): JSX.Element => {
  return (
    <div className="w-full space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-[#1a1f3a]/90 to-[#0a0e1a]/90 border-[#90b6ff]/30">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl font-bold text-white text-center">
              IPL 2025 Player Auction Dashboard - Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-white/90">
            {/* Introduction */}
            <div>
              <p className="text-base leading-relaxed">
                Real-time IPL 2025 player auction tracking with live updates.
                View team budgets, player stats, and leaderboard rankings instantly.
              </p>
            </div>

            <Separator className="bg-white/20" />

            {/* Navigation Guide */}
            <div>
              <h3 className="text-lg font-semibold text-[#fe6804] mb-3">
                Navigation
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold text-white mb-1">OVERVIEW</h4>
                  <p className="ml-3 text-white/80">Team cards with rankings, budgets, and player counts. Click any team for details.</p>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-1">SOLD PLAYERS</h4>
                  <p className="ml-3 text-white/80">All purchased players with filtering, search, and sortable columns.</p>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-1">UNSOLD PLAYERS</h4>
                  <p className="ml-3 text-white/80">Available players with base prices and detailed information.</p>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-1">LEADERBOARD</h4>
                  <p className="ml-3 text-white/80">Complete team rankings with circular rank indicators and sortable stats.</p>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-1">AUCTION</h4>
                  <p className="ml-3 text-white/80">Live auction dashboard showing current bidding, active player, and team budgets.</p>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-1">PLAYING XI</h4>
                  <p className="ml-3 text-white/80">Select your team's best 11 players from the team dashboard. Download validated lineups as CSV.</p>
                </div>
              </div>
            </div>

            <Separator className="bg-white/20" />

            {/* Playing XI Rules */}
            <div>
              <h3 className="text-lg font-semibold text-[#fe6804] mb-3">
                Playing XI Rules
              </h3>
              <ul className="space-y-1.5 text-sm list-disc list-inside text-white/80">
                <li>Exactly {PLAYING_XI_CONFIG.totalPlayers} players required</li>
                <li>Batsmen: {PLAYING_XI_CONFIG.batsmen.min}-{PLAYING_XI_CONFIG.batsmen.max} players</li>
                <li>Wicket-Keepers: {PLAYING_XI_CONFIG.wicketKeepers.min}-{PLAYING_XI_CONFIG.wicketKeepers.max} players (at least {PLAYING_XI_CONFIG.wicketKeepers.min} required)</li>
                <li>All-Rounders: at least {PLAYING_XI_CONFIG.allRounders.min}</li>
                <li>Bowlers: at least {PLAYING_XI_CONFIG.bowlers.min}</li>
                <li>Foreign players: maximum {PLAYING_XI_CONFIG.foreignPlayers.max} in playing XI</li>
                <li>Download CSV only when lineup is valid</li>
              </ul>
            </div>

            <Separator className="bg-white/20" />

            {/* IPL Auction Rules */}
            <div>
              <h3 className="text-lg font-semibold text-[#fe6804] mb-3">
                Auction Rules
              </h3>
              <ul className="space-y-1.5 text-sm list-disc list-inside text-white/80">
                <li>Dynamic budget per team (set by admin)</li>
                <li>{AUCTION_CONFIG.maxPlayers} players per squad</li>
                <li>Max {AUCTION_CONFIG.maxOverseasPlayers} foreign players</li>
                <li>Live bidding with base price and categories</li>
              </ul>
            </div>

            <Separator className="bg-white/20" />

            {/* Features */}
            <div>
              <h3 className="text-lg font-semibold text-[#fe6804] mb-3">
                Features
              </h3>
              <ul className="space-y-1.5 text-sm list-disc list-inside text-white/80">
                <li>Real-time updates via Supabase</li>
                <li>Responsive design for all devices</li>
                <li>Advanced search and filtering</li>
                <li>Player detail modals</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
