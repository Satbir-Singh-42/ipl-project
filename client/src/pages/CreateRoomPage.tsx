import React, { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Plus,
  ArrowLeft,
  Globe,
  Lock,
  Key,
  Eye,
  EyeOff,
  Coins,
  ChevronDown,
  Check,
  Shield,
} from "lucide-react";
import { useTournament } from "@/contexts/TournamentContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { LoadingPage } from "@/components/LoadingPage";

export function CreateRoomPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAdmin, isAuthenticated, user, isLoading } = useAuth();
  const { tournaments, createTournament } = useTournament();

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
  const [isCreating, setIsCreating] = useState(false);

  if (isLoading) return <LoadingPage />;
  if (!isAuthenticated) return <RoomAuthGate />;

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
        created_by: user?.id ?? null,
        cloneFromTemplate: cloneTemplate,
      });

      toast({
        title: "Tournament Room Created",
        description: `Room code [${created.room_code}] is now ready.`,
      });

      setLocation(`/room/${created.room_code}/auction`);
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
      <header className="w-full backdrop-blur bg-[#0b2a7d]/90 border-b border-white/10 shadow-lg py-3 px-4 sm:px-8 sticky top-0 z-50"
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
              onClick={() => setLocation("/tournaments")}
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Back to Rooms
            </Button>
            {isAuthenticated && isAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10 text-xs font-semibold"
                onClick={() => setLocation("/admin")}
              >
                Admin Panel
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="max-w-3xl mx-auto w-full px-4 sm:px-8 py-10 sm:py-14 flex-1">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="[font-family:'Work_Sans',Helvetica] text-2xl sm:text-3xl font-bold text-white text-center leading-tight mb-2 tracking-tight">
            Create New Auction Room
          </h1>
          <p className="text-slate-400 text-sm text-center mb-8">
            Configure room details, visibility, passwords, custom currency, and isolated squad rules.
          </p>

          <div className="rounded-3xl border border-white/15 bg-[#18184a]/70 backdrop-blur p-6 sm:p-8 shadow-2xl">
            <form onSubmit={handleCreateRoom} className="space-y-5">
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
                  id="createCloneTemplate"
                  checked={cloneTemplate}
                  onChange={(e) => setCloneTemplate(e.target.checked)}
                  className="mt-0.5 accent-[#fe6804] w-4 h-4 rounded cursor-pointer shrink-0"
                />
                <label htmlFor="createCloneTemplate" className="text-xs cursor-pointer text-slate-300 leading-relaxed">
                  <span className="font-bold text-white text-sm block mb-0.5">
                    Copy Official IPL 2025 Template
                  </span>
                  Automatically duplicate the 10 franchise teams, standard auction sets, and squad rules so you can start immediately.
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end items-center gap-3 pt-3 border-t border-white/10">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setLocation("/tournaments")}
                  className="text-slate-300 hover:text-white px-5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="bg-gradient-to-r from-[#fe6804] to-[#ef4123] hover:opacity-95 text-white font-bold px-8 h-11 rounded-xl shadow-lg shadow-[#fe6804]/20"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  {isCreating ? "Creating Room..." : "Confirm & Create"}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
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
    </div>
  );
}

function RoomAuthGate() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-[#0f1629] text-white flex flex-col font-['Segoe_UI',sans-serif]">
      <header className="w-full backdrop-blur bg-[#0b2a7d]/90 border-b border-white/10 shadow-lg py-3 px-4 sm:px-8 sticky top-0 z-50"
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
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10 text-xs font-semibold"
            onClick={() => setLocation("/tournaments")}
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Rooms
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="rounded-3xl border border-white/15 bg-[#18184a]/70 backdrop-blur p-8 text-center shadow-2xl">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-[#fe6804]/15 border border-[#fe6804]/40 flex items-center justify-center mb-5">
              <Lock className="w-7 h-7 text-[#fe6804]" />
            </div>
            <h1 className="[font-family:'Work_Sans',Helvetica] text-2xl font-bold text-white tracking-tight mb-2">
              Create an Account to Host
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Tournament rooms require an account. Sign up free, then configure and
              launch your isolated auction room in under a minute.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => setLocation("/signup")}
                className="bg-gradient-to-r from-[#fe6804] to-[#ef4123] hover:opacity-95 text-white font-semibold px-8 h-11 rounded-xl shadow-lg shadow-[#fe6804]/20 w-full"
              >
                Create Account
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/login")}
                className="border-white/20 text-white hover:bg-white/10 text-sm font-semibold w-full"
              >
                I Already Have an Account — Sign In
              </Button>
            </div>
            <button
              onClick={() => setLocation("/tournaments")}
              className="mt-5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Or browse existing rooms instead
            </button>
          </div>
        </motion.div>
      </main>

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
    </div>
  );
}
