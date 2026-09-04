import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Trophy,
  Plus,
  Play,
  Copy,
  Users,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Unlock,
  Globe,
  Key,
  Eye,
  EyeOff,
  Coins,
  ChevronDown,
  Check,
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

export function LandingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAdmin, isAuthenticated } = useAuth();
  const {
    tournaments,
    currentTournament,
    switchTournament,
    createTournament,
  } = useTournament();

  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [statsMap, setStatsMap] = useState<Record<number, RoomCardStats>>({});

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [isRoomCodeCustomized, setIsRoomCodeCustomized] = useState(false);
  const [description, setDescription] = useState("");
  const [currencyPreset, setCurrencyPreset] = useState("INR");
  const [currencySymbol, setCurrencySymbol] = useState("₹");
  const [currencyCode, setCurrencyCode] = useState("INR");
  const [isPrivate, setIsPrivate] = useState(false);
  const [roomPassword, setRoomPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("admin123");
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [showRoomPass, setShowRoomPass] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [cloneTemplate, setCloneTemplate] = useState(true);

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
    // If room is private, verify room password unless already unlocked in this session or user is admin
    if (tournament.is_private) {
      const isUnlocked = sessionStorage.getItem(`room_unlocked_${tournament.id}`) === "true";
      if (!isUnlocked && !isAdmin) {
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

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = roomCodeInput.trim().toUpperCase();
    if (!cleanCode) return;

    setIsJoining(true);
    const targetRoom = await supabaseService.getTournamentBySlugOrCode(cleanCode);
    setIsJoining(false);

    if (targetRoom) {
      handleEnterRoom(targetRoom, "public");
    } else {
      toast({
        title: "Room Not Found",
        description: `No tournament room exists with code "${cleanCode}".`,
        variant: "destructive",
      });
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      toast({
        title: "Validation Error",
        description: "Tournament name is required.",
        variant: "destructive",
      });
      return;
    }

    if (tournaments.some((t) => t.name.toLowerCase() === cleanName.toLowerCase())) {
      toast({
        title: "Duplicate Tournament Name",
        description: `A tournament named "${cleanName}" already exists. Please choose a unique name.`,
        variant: "destructive",
      });
      return;
    }

    const cleanRoomCode = roomCode.trim().toUpperCase();
    if (cleanRoomCode && tournaments.some((t) => t.room_code.toUpperCase() === cleanRoomCode)) {
      toast({
        title: "Duplicate Room Code",
        description: `Room code [${cleanRoomCode}] is already in use. Please enter a different code.`,
        variant: "destructive",
      });
      return;
    }

    const cleanSlug = slug.trim().toLowerCase();
    if (cleanSlug && tournaments.some((t) => t.slug.toLowerCase() === cleanSlug)) {
      toast({
        title: "Duplicate URL Slug",
        description: `URL slug "${cleanSlug}" is already taken. Please enter a different slug.`,
        variant: "destructive",
      });
      return;
    }

    if (isPrivate && !roomPassword.trim()) {
      toast({
        title: "Password Required",
        description: "Please specify a password for this private room.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const created = await createTournament({
        name: cleanName,
        slug: cleanSlug || undefined,
        room_code: cleanRoomCode || undefined,
        description: description.trim() || undefined,
        currency_symbol: currencySymbol.trim() || "₹",
        currency_code: currencyCode.trim() || "INR",
        is_private: isPrivate,
        room_password: isPrivate ? roomPassword.trim() : "",
        admin_password: adminPassword.trim() || "admin123",
        cloneFromTemplate: cloneTemplate,
      });

      toast({
        title: "Tournament Room Created",
        description: `Room code [${created.room_code}] is now ready.`,
      });

      setShowCreateModal(false);
      setName("");
      setSlug("");
      setRoomCode("");
      setIsSlugCustomized(false);
      setIsRoomCodeCustomized(false);
      setDescription("");
      setIsPrivate(false);
      setRoomPassword("");
      setAdminPassword("admin123");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Creation failed.";
      toast({
        title: "Creation Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
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
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setLocation("/")}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#fe6804] to-[#ef4123] flex items-center justify-center font-bold text-lg shadow-md tracking-wider">
              IPL
            </div>
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

          {isAuthenticated && (
            <div className="flex items-center gap-2 sm:gap-3">
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10 text-xs font-semibold"
                  onClick={() => setLocation("/admin")}
                >
                  Admin Panel
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="border-red-500/40 text-red-300 hover:bg-red-500/20 text-xs"
                onClick={async () => {
                  localStorage.removeItem("ipl_custom_auth_session");
                  window.location.reload();
                }}
              >
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-12 flex-1">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-gradient-to-r from-[#18184a] via-[#1a2366] to-[#18184a] border border-white/15 rounded-3xl p-6 sm:p-12 shadow-2xl mb-10 relative overflow-hidden"
        >
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fe6804]/20 border border-[#fe6804]/40 text-[#fe6804] text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Multi-Tournament Architecture
            </div>

            <h2 className="[font-family:'Work_Sans',Helvetica] text-3xl sm:text-5xl font-black text-white leading-tight mb-4 tracking-tight">
              Create & Host Independent Player Auctions
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
              Host isolated auction environments for your cricket league, college festival, corporate tournament, or private event. Each room has an isolated database, custom squad rules, custom currencies, and unique room codes.
            </p>

            {/* Quick Actions Card */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              {/* Join Code Form */}
              <form onSubmit={handleJoinByCode} className="flex gap-2 flex-1 max-w-md">
                <Input
                  type="text"
                  placeholder="ENTER ROOM CODE (e.g. IPL2025)"
                  value={roomCodeInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomCodeInput(e.target.value.toUpperCase())}
                  className="bg-black/40 border-white/20 text-white font-mono uppercase text-sm tracking-wider h-11"
                />
                <Button
                  type="submit"
                  disabled={isJoining}
                  className="bg-[#00bcd4] hover:bg-[#00a2b8] text-black font-extrabold px-6 h-11 whitespace-nowrap shadow-md"
                >
                  {isJoining ? "CONNECTING..." : "ENTER ROOM"}
                </Button>
              </form>

              <div className="hidden sm:block text-slate-400 font-bold text-xs uppercase px-1">or</div>

              {/* Create Room Button */}
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-[#fe6804] to-[#ef4123] hover:opacity-95 text-white font-bold px-6 h-11 shadow-lg shadow-[#fe6804]/20 whitespace-nowrap"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                CREATE NEW ROOM
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Rooms Listing Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="[font-family:'Work_Sans',Helvetica] text-xl sm:text-2xl font-bold text-white">
              Available Auction Rooms
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Select a room to enter tournament or begin live bidding
            </p>
          </div>
          <span className="text-xs bg-white/10 px-3 py-1 rounded-full border border-white/10 text-slate-300 font-medium">
            {tournaments.length} {tournaments.length === 1 ? "Room Available" : "Rooms Available"}
          </span>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => {
            const isCurrent = tournament.id === currentTournament?.id;
            const stats = statsMap[tournament.id] || { teamsCount: 0, playersCount: 0, poolsCount: 0 };

            return (
              <motion.div
                key={tournament.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border border-white/10 hover:border-white/20 bg-[#18184a]/70 hover:bg-[#18184a] p-6 flex flex-col justify-between transition-all backdrop-blur relative overflow-hidden shadow-lg"
              >
                {/* Header Info */}
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

                {/* Stats Bar */}
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

                  {/* Actions */}
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
                      onClick={() => handleEnterRoom(tournament, "auction")}
                      className="flex-1 font-bold text-xs uppercase bg-white/10 hover:bg-white/20 text-white border border-white/10 tracking-wider h-9 rounded-xl"
                    >
                      Auction
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Create Room Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="w-[95vw] sm:w-[720px] max-w-[720px] bg-[#0f1629] border border-white/20 text-white p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl rounded-2xl">
          <DialogHeader className="space-y-1.5 pb-2">
            <DialogTitle className="text-2xl font-bold font-['Work_Sans',Helvetica] text-white">
              Create New Auction Room
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-sm">
              Configure room details, visibility, passwords, custom currency, and isolated squad rules.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRoom} className="space-y-5 my-2">
            {/* Tournament Name */}
            <div>
              <label className="text-sm font-semibold text-slate-200 block mb-1.5">
                Tournament Name <span className="text-[#fe6804]">*</span>
              </label>
              <Input
                required
                placeholder="e.g. Mumbai Premier League 2025"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const newName = e.target.value;
                  setName(newName);
                  
                  // Continuously auto-generate URL slug unless user manually typed in slug input
                  if (!isSlugCustomized) {
                    const autoSlug = newName
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-+|-+$/g, "");
                    setSlug(autoSlug);
                  }

                  // Auto-suggest room code unless user manually typed room code
                  if (!isRoomCodeCustomized) {
                    const words = newName.trim().split(/\s+/).filter(Boolean);
                    if (words.length >= 2) {
                      const acronym = words.map((w) => w[0]).join("").toUpperCase();
                      setRoomCode(`${acronym}2025`);
                    } else if (words.length === 1 && words[0].length >= 3) {
                      setRoomCode(`${words[0].slice(0, 4).toUpperCase()}2025`);
                    } else {
                      setRoomCode(newName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase());
                    }
                  }
                }}
                className={`h-11 text-sm bg-black/40 border-white/20 text-white rounded-xl placeholder:text-slate-500 ${
                  name.trim() && tournaments.some((t) => t.name.toLowerCase() === name.trim().toLowerCase())
                    ? "border-red-500 focus:ring-red-500"
                    : ""
                }`}
              />
              {name.trim() && tournaments.some((t) => t.name.toLowerCase() === name.trim().toLowerCase()) && (
                <p className="text-xs text-red-400 mt-1.5 font-medium">
                  A tournament with this name already exists. Please choose a unique name.
                </p>
              )}
            </div>

            {/* Room Code & Slug */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-200 block mb-1.5">
                  Room Code
                </label>
                <Input
                  placeholder="e.g. MPL2025"
                  value={roomCode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setRoomCode(e.target.value.toUpperCase());
                    setIsRoomCodeCustomized(true);
                  }}
                  className={`h-11 text-sm bg-black/40 border-white/20 text-white font-mono uppercase rounded-xl placeholder:text-slate-500 ${
                    roomCode.trim() && tournaments.some((t) => t.room_code.toUpperCase() === roomCode.trim().toUpperCase())
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                />
                {roomCode.trim() && tournaments.some((t) => t.room_code.toUpperCase() === roomCode.trim().toUpperCase()) && (
                  <p className="text-xs text-red-400 mt-1.5 font-medium">
                    Room code already in use.
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-200 block mb-1.5">
                  URL Slug
                </label>
                <Input
                  placeholder="e.g. mpl-2025"
                  value={slug}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSlug(e.target.value.toLowerCase());
                    setIsSlugCustomized(true);
                  }}
                  className={`h-11 text-sm bg-black/40 border-white/20 text-white rounded-xl placeholder:text-slate-500 ${
                    slug.trim() && tournaments.some((t) => t.slug.toLowerCase() === slug.trim().toLowerCase())
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                />
                {slug.trim() && tournaments.some((t) => t.slug.toLowerCase() === slug.trim().toLowerCase()) && (
                  <p className="text-xs text-red-400 mt-1.5 font-medium">
                    URL slug already taken.
                  </p>
                )}
              </div>
            </div>

            {/* 2-Column Section: Security & Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Left Column: Visibility & Passwords */}
              <div className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-3.5 flex flex-col justify-between">
                <div>
                  <label className="text-sm font-semibold text-slate-200 block mb-2">
                    Room Visibility
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPrivate(false)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        !isPrivate
                          ? "bg-[#00bcd4]/20 border-[#00bcd4] text-[#00bcd4] shadow-sm"
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      <Globe className="w-4 h-4" />
                      Public
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPrivate(true)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        isPrivate
                          ? "bg-[#fe6804]/20 border-[#fe6804] text-[#fe6804] shadow-sm"
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                      Private
                    </button>
                  </div>
                </div>

                {isPrivate && (
                  <div>
                    <label className="text-xs font-semibold text-amber-300 flex items-center gap-1 mb-1">
                      <Key className="w-3.5 h-3.5" />
                      Room Access Password *
                    </label>
                    <div className="relative">
                      <Input
                        type={showRoomPass ? "text" : "password"}
                        placeholder="Required for visitors"
                        value={roomPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomPassword(e.target.value)}
                        className="h-10 text-sm bg-black/40 border-amber-500/40 text-white pr-10 rounded-xl"
                        required={isPrivate}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRoomPass(!showRoomPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                      >
                        {showRoomPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1 mb-1">
                    <Shield className="w-3.5 h-3.5 text-[#00bcd4]" />
                    Admin / Host Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showAdminPass ? "text" : "password"}
                      placeholder="Enter admin password"
                      value={adminPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdminPassword(e.target.value)}
                      className="h-10 text-sm bg-black/40 border-white/20 text-white font-mono pr-10 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPass(!showAdminPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                    >
                      {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Direct credentials: login with room code & this admin key.
                  </p>
                </div>
              </div>

              {/* Right Column: Currency */}
              <div className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-3.5 flex flex-col justify-between">
                <div className="relative">
                  <label className="text-sm font-semibold text-slate-200 flex items-center gap-1.5 mb-2">
                    <Coins className="w-4 h-4 text-amber-400" />
                    Tournament Currency
                  </label>

                  {/* Custom Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                    className="w-full h-11 px-3 rounded-xl bg-black/40 hover:bg-black/60 border border-white/20 hover:border-[#00bcd4]/60 text-white flex items-center justify-between transition-all focus:outline-none focus:ring-1 focus:ring-[#00bcd4]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-[#00bcd4]/20 border border-[#00bcd4]/40 text-[#00bcd4] font-bold text-xs flex items-center justify-center font-mono shrink-0">
                        {currencySymbol || "₹"}
                      </span>
                      <div className="text-left min-w-0">
                        <div className="text-xs font-bold text-white truncate leading-tight">
                          {currencyPreset === "INR" && "₹ INR — Indian Rupee"}
                          {currencyPreset === "USD" && "$ USD — US Dollar"}
                          {currencyPreset === "EUR" && "€ EUR — Euro"}
                          {currencyPreset === "GBP" && "£ GBP — British Pound"}
                          {currencyPreset === "AUD" && "AU$ AUD — Australian Dollar"}
                          {currencyPreset === "AED" && "AED — UAE Dirham"}
                          {currencyPreset === "CAD" && "CA$ CAD — Canadian Dollar"}
                          {currencyPreset === "PTS" && "PTS — Auction Points"}
                          {currencyPreset === "CUSTOM" && `Custom (${currencyCode || "—"})`}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Code: {currencyCode || "INR"}
                        </div>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isCurrencyDropdownOpen ? "rotate-180 text-[#00bcd4]" : ""}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isCurrencyDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#18184a] border border-[#00bcd4]/40 rounded-xl p-1.5 shadow-2xl backdrop-blur-xl z-50 grid grid-cols-1 gap-1 max-h-52 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                      {[
                        { id: "INR", symbol: "₹", code: "INR", name: "Indian Rupee" },
                        { id: "USD", symbol: "$", code: "USD", name: "US Dollar" },
                        { id: "EUR", symbol: "€", code: "EUR", name: "Euro" },
                        { id: "GBP", symbol: "£", code: "GBP", name: "British Pound" },
                        { id: "AUD", symbol: "AU$", code: "AUD", name: "Australian Dollar" },
                        { id: "AED", symbol: "AED", code: "AED", name: "UAE Dirham" },
                        { id: "CAD", symbol: "CA$", code: "CAD", name: "Canadian Dollar" },
                        { id: "PTS", symbol: "PTS", code: "PTS", name: "Auction Points / Tokens" },
                        { id: "CUSTOM", symbol: "✎", code: "CUSTOM", name: "Custom Currency..." },
                      ].map((item) => {
                        const isSelected = currencyPreset === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setCurrencyPreset(item.id);
                              if (item.id !== "CUSTOM") {
                                setCurrencySymbol(item.symbol);
                                setCurrencyCode(item.code);
                              }
                              setIsCurrencyDropdownOpen(false);
                            }}
                            className={`p-2 rounded-lg text-left flex items-center justify-between transition-all ${
                              isSelected
                                ? "bg-[#00bcd4]/20 border border-[#00bcd4] text-white"
                                : "bg-white/5 border border-transparent hover:bg-white/10 text-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-6 h-6 rounded-md bg-black/40 border border-white/10 text-[#00bcd4] font-bold text-xs flex items-center justify-center font-mono shrink-0">
                                {item.symbol}
                              </span>
                              <div className="min-w-0">
                                <div className="text-xs font-bold truncate text-white">
                                  {item.name}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {item.code}
                                </div>
                              </div>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#00bcd4] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {currencyPreset === "CUSTOM" && (
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="text-xs font-semibold text-slate-200 block mb-1">
                        Symbol
                      </label>
                      <Input
                        placeholder="e.g. ₹ or $"
                        value={currencySymbol}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrencySymbol(e.target.value)}
                        className="h-10 text-sm bg-black/40 border-white/20 text-white rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-200 block mb-1">
                        Code
                      </label>
                      <Input
                        placeholder="e.g. INR or USD"
                        value={currencyCode}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrencyCode(e.target.value.toUpperCase())}
                        className="h-10 text-sm bg-black/40 border-white/20 text-white rounded-xl"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-semibold text-slate-200 block mb-1.5">
                Description
              </label>
              <textarea
                placeholder="Brief summary of this tournament and organizer details..."
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-xl bg-black/40 border border-white/20 text-white p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#fe6804] placeholder:text-slate-500"
              />
            </div>

            {/* Copy Template Checkbox */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start gap-3.5">
              <input
                type="checkbox"
                id="landingCloneTemplate"
                checked={cloneTemplate}
                onChange={(e) => setCloneTemplate(e.target.checked)}
                className="mt-0.5 accent-[#fe6804] w-4 h-4 rounded cursor-pointer shrink-0"
              />
              <label htmlFor="landingCloneTemplate" className="text-xs cursor-pointer text-slate-300 leading-relaxed">
                <span className="font-bold text-white text-sm block mb-0.5">
                  Copy Official IPL 2025 Template
                </span>
                Automatically duplicate the 10 franchise teams, standard auction sets, and squad rules so you can start immediately.
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end items-center gap-3 pt-3 border-t border-white/10">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-300 hover:text-white px-5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="bg-gradient-to-r from-[#fe6804] to-[#ef4123] hover:opacity-95 text-white font-bold px-8 h-11 rounded-xl shadow-lg shadow-[#fe6804]/20"
              >
                {isCreating ? "Creating Room..." : "Confirm & Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
