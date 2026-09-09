import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Trophy,
  Plus,
  Users,
  Shield,
  Lock,
  Globe,
  Key,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";
import { useTournament } from "@/contexts/TournamentContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseService, type Tournament } from "@/services/supabaseService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface RoomCardStats {
  teamsCount: number;
  playersCount: number;
  poolsCount: number;
}

export function TournamentsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAdmin, isAuthenticated, canManageRoom } = useAuth();
  const { tournaments, currentTournament, switchTournament } = useTournament();

  const [statsMap, setStatsMap] = useState<Record<number, RoomCardStats>>({});

  // Private Room Unlock State
  const [unlockModalTournament, setUnlockModalTournament] = useState<Tournament | null>(null);
  const [unlockTarget, setUnlockTarget] = useState<"public" | "auction">("public");
  const [unlockPasswordInput, setUnlockPasswordInput] = useState("");
  const [showUnlockPass, setShowUnlockPass] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadStats = async () => {
      try {
        const stats = await supabaseService.getMultiTournamentSummaryStats();
        if (isMounted) {
          setStatsMap(stats);
        }
      } catch {
        // ignore
      }
    };

    if (tournaments.length > 0) {
      loadStats();
    }

    return () => {
      isMounted = false;
    };
  }, [tournaments]);

  const handleEnterRoom = async (tournament: Tournament, target: "public" | "auction" = "public") => {
    if (tournament.is_private) {
      const isUnlocked = sessionStorage.getItem(`room_unlocked_${tournament.id}`) === "true";
      if (!isUnlocked && !canManageRoom(tournament.created_by)) {
        setUnlockModalTournament(tournament);
        setUnlockTarget(target);
        setUnlockPasswordInput("");
        return;
      }
    }

    await switchTournament(tournament.id);
    toast({
      title: "Room Selected",
      description: `Targeting: ${tournament.name} [#${tournament.room_code}]`,
    });
    if (target === "auction") {
      setLocation(`/room/${tournament.room_code}/auction`);
    } else {
      setLocation(`/room/${tournament.room_code}`);
    }
  };

  const handleUnlockRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockModalTournament) return;

    const inputPass = unlockPasswordInput.trim();
    const isMatch = await supabaseService.verifyRoomPassword(unlockModalTournament.id, inputPass);

    if (isMatch) {
      sessionStorage.setItem(`room_unlocked_${unlockModalTournament.id}`, "true");
      const target = unlockTarget;
      const tourney = unlockModalTournament;
      setUnlockModalTournament(null);
      setUnlockPasswordInput("");

      await switchTournament(tourney.id);
      toast({
        title: "Room Unlocked",
        description: `Access granted to [${tourney.name}].`,
      });
      if (target === "auction") {
        setLocation(`/room/${tourney.room_code}/auction`);
      } else {
        setLocation(`/room/${tourney.room_code}`);
      }
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect password for this private room.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1629] text-white flex flex-col font-['Segoe_UI',sans-serif]">
      {/* Top Navbar */}
      <header
        className="w-full backdrop-blur bg-[#0b2a7d]/90 border-b border-white/10 shadow-lg py-3 px-4 sm:px-8 sticky top-0 z-50"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(24,24,74,0.98) 0%, rgba(12,28,158,0.9) 49%, rgba(24,24,74,0.98) 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation("/")}>
            <img src="/IPL-logo.png" alt="IPL Logo" className="h-10 w-auto" />
            <div>
              <h1 className="[font-family:'Work_Sans',Helvetica] font-bold text-lg sm:text-xl leading-tight">
                <span className="text-white">IPL AUCTION </span>
                <span className="text-[#fe6804]">PORTAL</span>
              </h1>
              <p className="text-[11px] text-slate-300">
                Live Tournament & Multi-Room Auction Hub
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10 text-xs font-semibold"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Home
            </Button>
            <Button
              size="sm"
              className="bg-[#fe6804] hover:bg-[#e05b03] text-white text-xs font-semibold"
              onClick={() => setLocation("/create")}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              New Room
            </Button>
            {isAuthenticated && isAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10 text-xs font-semibold"
                onClick={() => setLocation("/admin")}
              >
                Admin
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-10 sm:py-14 flex-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-[#fe6804] text-xs font-semibold uppercase tracking-[0.2em] mb-3">
              Tournament Rooms
            </p>
            <h1 className="[font-family:'Work_Sans',Helvetica] text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Available Auction Rooms
            </h1>
            <p className="text-slate-400 text-sm mt-2">
              Select a room to enter tournament or begin live bidding.
            </p>
          </div>
          <span className="text-xs bg-white/10 px-3 py-1.5 rounded-full border border-white/10 text-slate-300 font-medium self-start sm:self-auto">
            {tournaments.length} {tournaments.length === 1 ? "Room Available" : "Rooms Available"}
          </span>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => {
            const isCurrent = tournament.id === currentTournament?.id;
            const stats = statsMap[tournament.id] || { teamsCount: 0, playersCount: 0, poolsCount: 0 };
            const canManageTournament = canManageRoom(tournament.created_by);

            return (
              <motion.div
                key={tournament.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border border-white/10 hover:border-white/20 bg-[#18184a]/70 hover:bg-[#18184a] p-6 flex flex-col justify-between transition-all backdrop-blur relative overflow-hidden shadow-lg"
              >
                {isCurrent && (
                  <span className="absolute top-0 left-0 right-0 h-1 bg-[#fe6804]" />
                )}

                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0b2a7d] to-[#18184a] border border-white/20 flex items-center justify-center font-bold text-white text-base shrink-0">
                        {tournament.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-base sm:text-lg text-white leading-snug">
                          {tournament.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-mono font-bold text-[#00bcd4]">
                            #{tournament.room_code}
                          </span>
                          <span className="text-slate-500 text-[10px]">•</span>
                          <span className="text-xs text-slate-300">
                            {tournament.currency_symbol || "₹"} {tournament.currency_code || "INR"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {tournament.is_private ? (
                        <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                          <Lock className="w-2.5 h-2.5" />
                          PRIVATE
                        </span>
                      ) : (
                        <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                          <Globe className="w-2.5 h-2.5" />
                          PUBLIC
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 mb-5 leading-relaxed">
                    {tournament.description || "Custom independent tournament auction room."}
                  </p>
                </div>

                <div>
                  <div className="grid grid-cols-3 gap-2 py-3 px-3 rounded-xl bg-black/25 border border-white/5 mb-5 text-center">
                    <div>
                      <div className="text-sm font-bold text-white">{stats.teamsCount}</div>
                      <div className="text-[10px] uppercase font-semibold text-slate-400">Teams</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{stats.playersCount}</div>
                      <div className="text-[10px] uppercase font-semibold text-slate-400">Players</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{stats.poolsCount}</div>
                      <div className="text-[10px] uppercase font-semibold text-slate-400">Sets</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEnterRoom(tournament, "public")}
                      className={`flex-1 font-bold text-xs uppercase text-white tracking-wider h-9 rounded-xl transition-all ${
                        tournament.is_private
                          ? "bg-gradient-to-r from-[#fe6804] to-[#e05b03] hover:opacity-90"
                          : "bg-[#fe6804] hover:bg-[#e05b03]"
                      }`}
                    >
                      {tournament.is_private ? (
                        <>
                          <Lock className="w-3 h-3 mr-1 text-amber-200" />
                          Enter Room
                        </>
                      ) : (
                        "Public View"
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        if (canManageTournament) {
                          handleEnterRoom(tournament, "auction");
                        } else {
                          toast({
                            title: "Auction Locked",
                            description: "Only the room creator or an admin can start the auction.",
                            variant: "destructive",
                          });
                        }
                      }}
                      className={`flex-1 font-bold text-xs uppercase border tracking-wider h-9 rounded-xl transition-all ${
                        canManageTournament
                          ? "bg-white/10 hover:bg-white/20 text-white border-white/10"
                          : "bg-white/5 text-slate-400 border-white/10 opacity-70 cursor-not-allowed"
                      }`}
                    >
                      {canManageTournament ? (
                        <Shield className="w-3 h-3 mr-1 text-[#fe6804]" />
                      ) : (
                        <Lock className="w-3 h-3 mr-1 text-slate-400" />
                      )}
                      Auction
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* No rooms empty state */}
        {tournaments.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-16 bg-[#18184a]/40 border border-dashed border-white/10 rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-[#fe6804]/15 border border-[#fe6804]/30 text-[#fe6804] flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No Auction Rooms Yet</h3>
            <p className="text-sm text-slate-400 mb-5 max-w-sm">
              Create the first tournament room to start hosting live player auctions.
            </p>
            <Button
              onClick={() => setLocation("/create")}
              className="bg-gradient-to-r from-[#fe6804] to-[#ef4123] hover:opacity-95 text-white font-bold px-6 h-11 shadow-lg shadow-[#fe6804]/20"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              CREATE FIRST ROOM
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 bg-[#0b2a7d]/40 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <img src="/IPL-logo.png" alt="IPL Logo" className="h-6 w-auto" />
            <span>© 2025 IPL Auction Portal</span>
          </div>
          <nav className="flex items-center gap-6">
            <button onClick={() => setLocation("/privacy-policy")} className="text-xs text-slate-400 hover:text-white transition-colors">
              Privacy Policy
            </button>
            <button onClick={() => setLocation("/terms")} className="text-xs text-slate-400 hover:text-white transition-colors">
              Terms & Conditions
            </button>
          </nav>
        </div>
      </footer>

      {/* Unlock Private Room Modal */}
      <Dialog open={!!unlockModalTournament} onOpenChange={(open) => !open && setUnlockModalTournament(null)}>
        <DialogContent
          style={{ backgroundColor: "#181820" }}
          className="!bg-[#181820] border border-white/10 text-white max-w-md w-[92vw] sm:w-full p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl [font-family:'Work_Sans',Helvetica] gap-0"
        >
          <DialogHeader className="text-left space-y-1.5 pr-6">
            <DialogTitle className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
              Unlock {unlockModalTournament?.name}?
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
              This auction room is private. Enter the room access password to view teams, rosters, and live bidding.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUnlockRoomSubmit} className="space-y-4 mt-3">
            <div className="relative">
              <Input
                type={showUnlockPass ? "text" : "password"}
                required
                autoFocus
                placeholder="Enter room password..."
                value={unlockPasswordInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUnlockPasswordInput(e.target.value)}
                className="bg-[#272732] border border-white/10 text-white h-10 px-3.5 rounded-xl text-sm focus:border-[#fe6804] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowUnlockPass(!showUnlockPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                aria-label={showUnlockPass ? "Hide password" : "Show password"}
              >
                {showUnlockPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setUnlockModalTournament(null)}
                className="px-4 py-1.5 rounded-full bg-[#272732] hover:bg-[#333342] text-white text-xs sm:text-sm font-medium border border-white/10 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-[#fe6804] hover:bg-[#e05b03] text-white shadow-md shadow-orange-500/20 transition-all active:scale-95"
              >
                Unlock & Enter
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
