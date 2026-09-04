import React, { useState } from "react";
import { useLocation } from "wouter";
import { useTournament } from "@/contexts/TournamentContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export const TournamentHeaderBar: React.FC = () => {
  const [, setLocation] = useLocation();
  const {
    currentTournament,
    tournaments,
    switchTournament,
    activeTournamentId,
  } = useTournament();

  const [copied, setCopied] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [joinError, setJoinError] = useState("");

  const handleCopyCode = async () => {
    if (!currentTournament?.room_code) return;
    try {
      await navigator.clipboard.writeText(currentTournament.room_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError("");
    if (!roomCodeInput.trim()) return;

    const success = await switchTournament(roomCodeInput.trim());
    if (success) {
      setShowSwitchModal(false);
      setRoomCodeInput("");
    } else {
      setJoinError("Room not found. Please verify the room code.");
    }
  };

  const handleSelectTournament = async (id: number) => {
    await switchTournament(id);
    setShowSwitchModal(false);
  };

  return (
    <>
      <div className="w-full bg-[#0a0f1d] border-b border-white/10 px-2 sm:px-4 lg:px-6 py-1.5 flex items-center justify-between text-xs text-slate-300">
        {/* Left: Active Tournament Badge & Currency */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <span className="bg-[#fe6804]/20 border border-[#fe6804]/50 text-[#fe6804] px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold tracking-wider uppercase whitespace-nowrap">
            TOURNAMENT ROOM
          </span>
          <span className="font-semibold text-white truncate max-w-[150px] sm:max-w-[240px] md:max-w-none">
            {currentTournament?.name || "IPL 2025 Mega Auction"}
          </span>
          <span className="text-slate-400 text-[11px] hidden sm:inline">
            ({currentTournament?.currency_symbol || "₹"} {currentTournament?.currency_code || "INR"})
          </span>
        </div>

        {/* Right: Room Code, Copy, Switcher, Lobby Link */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex items-center bg-white/5 border border-white/10 rounded px-2 py-0.5">
            <span className="text-slate-400 text-[10px] sm:text-[11px] mr-1 hidden md:inline">CODE:</span>
            <span className="font-mono font-bold text-[#00bcd4] text-[11px] sm:text-xs tracking-wider">
              {currentTournament?.room_code || "IPL2025"}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="ml-1.5 text-[10px] text-slate-300 hover:text-white uppercase font-semibold transition-colors"
              title="Copy room code to clipboard"
            >
              {copied ? "COPIED" : "COPY"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowSwitchModal(true)}
            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 border border-white/10 text-[11px] font-medium text-white transition-colors"
          >
            SWITCH ROOM
          </button>

          <button
            type="button"
            onClick={() => setLocation("/tournaments")}
            className="px-2 py-0.5 rounded bg-gradient-to-r from-[#fe6804] to-[#ef4123] hover:opacity-90 text-[11px] font-semibold text-white transition-opacity hidden sm:inline-block"
          >
            ROOMS HUB
          </button>
        </div>
      </div>

      {/* Switch Room Modal */}
      <Dialog open={showSwitchModal} onOpenChange={setShowSwitchModal}>
        <DialogContent className="bg-[#0f1629] border border-white/20 text-white max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold [font-family:'Work_Sans',Helvetica] text-white">
              Switch Auction Room
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Select an available tournament room or enter a unique room code.
            </DialogDescription>
          </DialogHeader>

          {/* Join by Code Input */}
          <form onSubmit={handleJoinByCode} className="space-y-2 my-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Join with Room Code
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="e.g. IPL2025"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                className="bg-black/30 border-white/20 text-white font-mono uppercase"
              />
              <Button
                type="submit"
                className="bg-[#fe6804] hover:bg-[#e05b03] text-white font-bold px-4"
              >
                JOIN
              </Button>
            </div>
            {joinError && (
              <p className="text-xs text-red-400 font-medium">{joinError}</p>
            )}
          </form>

          {/* Tournaments Directory List */}
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Available Rooms
            </h4>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {tournaments.map((t) => {
                const isActive = t.id === activeTournamentId;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTournament(t.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      isActive
                        ? "bg-[#fe6804]/20 border-[#fe6804] text-white"
                        : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          {t.name}
                        </span>
                        {isActive && (
                          <span className="text-[10px] bg-[#fe6804] text-white font-bold px-1.5 py-0.2 rounded">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Code: <span className="font-mono text-[#00bcd4]">{t.room_code}</span> | Currency: {t.currency_symbol || "₹"} {t.currency_code || "INR"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={isActive ? "default" : "outline"}
                      className={isActive ? "bg-[#fe6804] text-white" : "border-white/20 text-white"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTournament(t.id);
                      }}
                    >
                      {isActive ? "CURRENT" : "ENTER"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
              onClick={() => setShowSwitchModal(false)}
            >
              Close
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-[#fe6804] to-[#ef4123] text-white font-semibold"
              onClick={() => {
                setShowSwitchModal(false);
                setLocation("/tournaments");
              }}
            >
              Manage & Create Rooms
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
