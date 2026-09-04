import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Trophy,
  Crown,
  Medal,
  Plane,
  X,
  Plus,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ArrowLeftRight,
  GripVertical,
  Move,
} from "lucide-react";
import type { Player, Team } from "@/services/supabaseService";
import { supabaseService } from "@/services/supabaseService";
import type { AuctionSquadRules } from "@/services/auctionRules";
import { formatIndianNumber } from "@/lib/utils";

export interface FieldPosition {
  id: number;
  label: string;
  roleHint: "batsmen" | "wicketKeepers" | "allRounders" | "bowlers" | "any";
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
}

export const TACTICAL_POSITIONS: FieldPosition[] = [
  { id: 1, label: "Opener 1", roleHint: "batsmen", x: 22, y: 16 },
  { id: 2, label: "Opener 2", roleHint: "batsmen", x: 50, y: 11 },
  { id: 3, label: "Top Order #3", roleHint: "batsmen", x: 78, y: 16 },
  { id: 4, label: "Middle Order #4", roleHint: "batsmen", x: 21, y: 39 },
  { id: 5, label: "Wicket Keeper", roleHint: "wicketKeepers", x: 50, y: 26 },
  { id: 6, label: "Middle Order #5", roleHint: "batsmen", x: 79, y: 39 },
  { id: 7, label: "All-Rounder #6", roleHint: "allRounders", x: 50, y: 50 },
  { id: 8, label: "All-Rounder #7", roleHint: "allRounders", x: 23, y: 64 },
  { id: 9, label: "Strike Bowler #1", roleHint: "bowlers", x: 50, y: 71 },
  { id: 10, label: "Pacer / Spinner #2", roleHint: "bowlers", x: 77, y: 64 },
  { id: 11, label: "Pacer / Spinner #3", roleHint: "bowlers", x: 50, y: 88 },
];

interface CricketFieldFormationProps {
  teamConfig: Team;
  soldPlayers: Player[];
  playingXI: string[];
  captainName: string | null;
  viceCaptainName: string | null;
  rules: AuctionSquadRules;
  onAddPlayer: (playerName: string) => void;
  onAddPlayerToSlot: (playerName: string, slotIndex: number) => void;
  onSwapSlots: (fromIndex: number, toIndex: number) => void;
  onRemovePlayer: (playerName: string) => void;
  onSetCaptain: (playerName: string) => void;
  onSetViceCaptain: (playerName: string) => void;
  onClearXI: () => void;
}

export function CricketFieldFormation({
  teamConfig,
  soldPlayers,
  playingXI,
  captainName,
  viceCaptainName,
  rules,
  onAddPlayer,
  onAddPlayerToSlot,
  onSwapSlots,
  onRemovePlayer,
  onSetCaptain,
  onSetViceCaptain,
  onClearXI,
}: CricketFieldFormationProps) {
  const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null);
  const [activePlayerMenu, setActivePlayerMenu] = useState<string | null>(null);

  // Drag-and-drop state
  const [draggedSlotIndex, setDraggedSlotIndex] = useState<number | null>(null);
  const [draggedBenchPlayer, setDraggedBenchPlayer] = useState<string | null>(null);
  const [dragOverSlotIndex, setDragOverSlotIndex] = useState<number | null>(null);
  const [isBenchDragOver, setIsBenchDragOver] = useState(false);

  // Tap-to-Swap state (for mobile & mouse click swapping)
  const [swapSourceSlot, setSwapSourceSlot] = useState<number | null>(null);

  // Captain & Vice-Captain multiplier settings from admin rules
  const isCaptainMultiplierEnabled = rules.enableCaptainMultiplier !== false;
  const cMultiplier = isCaptainMultiplierEnabled ? (rules.captainMultiplier || 2.0) : 1;
  const vcMultiplier = isCaptainMultiplierEnabled ? (rules.viceCaptainMultiplier || 1.5) : 1;

  // Active roster players in XI (indexed by slot 0-10)
  const xiPlayerObjects = playingXI
    .map((name) => soldPlayers.find((p) => p.name === name))
    .filter(Boolean) as Player[];

  // Bench players (not in XI)
  const activeNames = playingXI.filter(Boolean);
  const benchPlayers = soldPlayers.filter((p) => !activeNames.includes(p.name));

  const teamBorder = teamConfig.borderColor || supabaseService.getTeamBorderColor(teamConfig.name);

  // Get player assigned to a specific slot index (0 to 10)
  const getPlayerForSlot = (index: number): Player | undefined => {
    const name = playingXI[index];
    if (!name) return undefined;
    return soldPlayers.find((p) => p.name === name);
  };

  const getRoleBadgeStyle = (role: string) => {
    const lower = role.toLowerCase();
    if (lower.includes("wicket") || lower.includes("wk") || lower.includes("keeper")) {
      return "bg-amber-500/25 text-amber-300 border-amber-400/40";
    }
    if (lower.includes("all") || lower.includes("rounder")) {
      return "bg-purple-500/25 text-purple-300 border-purple-400/40";
    }
    if (lower.includes("bowl")) {
      return "bg-emerald-500/25 text-emerald-300 border-emerald-400/40";
    }
    return "bg-cyan-500/25 text-cyan-300 border-cyan-400/40";
  };

  const getShortRole = (role: string) => {
    const lower = role.toLowerCase();
    if (lower.includes("wicket") || lower.includes("wk") || lower.includes("keeper")) return "WK";
    if (lower.includes("all") || lower.includes("rounder")) return "AR";
    if (lower.includes("bowl")) return "BOWL";
    return "BAT";
  };

  return (
    <div className="flex flex-col lg:flex-row items-stretch gap-5 w-full [font-family:'Work_Sans',Helvetica]">
      {/* LEFT: Interactive 2D Cricket Stadium Field */}
      <div className="flex-1 flex flex-col items-center">
        {/* Stadium Action Bar */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-2 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white/70">
              Stadium Formation
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-bold text-[#00BCD4]">
              {xiPlayerObjects.length} / {rules.playingXITotal || 11} Selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            {playingXI.some(Boolean) && (
              <button
                type="button"
                onClick={onClearXI}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-semibold border border-white/15 transition-all active:scale-95 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Swap Mode Notification Banner */}
        <AnimatePresence>
          {swapSourceSlot !== null && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="w-full mb-2 px-3 py-1.5 rounded-xl bg-cyan-950/90 border border-cyan-500/50 flex items-center justify-between text-xs text-cyan-200 shadow-lg shadow-cyan-950/50"
            >
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span>
                  Select another position to move or swap{" "}
                  <strong className="text-white">
                    {playingXI[swapSourceSlot] || `Slot #${swapSourceSlot + 1}`}
                  </strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSwapSourceSlot(null)}
                className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition-all"
              >
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2D Realistic Turf Field Container */}
        <div className="relative w-full max-w-xl aspect-square rounded-3xl overflow-hidden border-4 border-slate-900 shadow-2xl bg-[#092e16] select-none">
          {/* SVG Pitch & Ground Turf Vector */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 500 500"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Stadium Floodlight Radial Atmosphere */}
              <radialGradient id="fieldGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1e823d" stopOpacity="1" />
                <stop offset="60%" stopColor="#135a28" stopOpacity="1" />
                <stop offset="100%" stopColor="#0a3818" stopOpacity="1" />
              </radialGradient>

              {/* Pitch Clay Texture Gradient */}
              <linearGradient id="pitchClay" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#cbb085" />
                <stop offset="50%" stopColor="#bfa172" />
                <stop offset="100%" stopColor="#b29363" />
              </linearGradient>

              {/* Turf Mowing Stripe Pattern */}
              <pattern id="turfStripes" width="500" height="36" patternUnits="userSpaceOnUse">
                <rect width="500" height="18" fill="#000000" fillOpacity="0.05" />
                <rect y="18" width="500" height="18" fill="#ffffff" fillOpacity="0.03" />
              </pattern>
            </defs>

            {/* Outer Oval Stadium Grass */}
            <ellipse cx="250" cy="250" rx="242" ry="242" fill="url(#fieldGlow)" />
            <ellipse cx="250" cy="250" rx="242" ry="242" fill="url(#turfStripes)" />

            {/* Boundary Rope with Dual Stroke */}
            <ellipse
              cx="250"
              cy="250"
              rx="230"
              ry="230"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeOpacity="0.6"
              strokeDasharray="6 4"
            />
            <ellipse
              cx="250"
              cy="250"
              rx="228"
              ry="228"
              stroke="#00BCD4"
              strokeWidth="1"
              strokeOpacity="0.3"
            />

            {/* 30-Yard Infield Circle */}
            <ellipse
              cx="250"
              cy="250"
              rx="148"
              ry="148"
              stroke="#ffffff"
              strokeWidth="1.8"
              strokeOpacity="0.45"
              strokeDasharray="5 5"
            />

            {/* Center Watermark Franchise Logo */}
            {teamConfig.logo && (
              <image
                href={teamConfig.logo}
                x="190"
                y="190"
                width="120"
                height="120"
                opacity="0.12"
                preserveAspectRatio="xMidYMid meet"
              />
            )}

            {/* Rectangular Cricket Pitch Strip */}
            <rect
              x="226"
              y="160"
              width="48"
              height="180"
              rx="4"
              fill="url(#pitchClay)"
              stroke="#e4cfab"
              strokeWidth="1.5"
            />

            {/* Bowling Crease & Popping Crease (Top / Striker End) */}
            <line x1="218" y1="184" x2="282" y2="184" stroke="#ffffff" strokeWidth="1.8" />
            <line x1="226" y1="174" x2="274" y2="174" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.7" />
            {/* Wicket Stumps (Top) */}
            <circle cx="244" cy="176" r="2.2" fill="#5c3818" />
            <circle cx="250" cy="176" r="2.2" fill="#5c3818" />
            <circle cx="256" cy="176" r="2.2" fill="#5c3818" />

            {/* Bowling Crease & Popping Crease (Bottom / Non-Striker End) */}
            <line x1="218" y1="316" x2="282" y2="316" stroke="#ffffff" strokeWidth="1.8" />
            <line x1="226" y1="326" x2="274" y2="326" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.7" />
            {/* Wicket Stumps (Bottom) */}
            <circle cx="244" cy="324" r="2.2" fill="#5c3818" />
            <circle cx="250" cy="324" r="2.2" fill="#5c3818" />
            <circle cx="256" cy="324" r="2.2" fill="#5c3818" />
          </svg>

          {/* 11 Interactive Player Formation Nodes Placed on Field */}
          {TACTICAL_POSITIONS.map((pos, idx) => {
            const player = getPlayerForSlot(idx);
            const isCaptain = isCaptainMultiplierEnabled && player && captainName === player.name;
            const isViceCaptain = isCaptainMultiplierEnabled && player && viceCaptainName === player.name;
            const isHovered = player && hoveredPlayer === player.name;

            const isDraggingThis = draggedSlotIndex === idx;
            const isDragTarget =
              dragOverSlotIndex === idx &&
              (draggedSlotIndex !== idx || draggedBenchPlayer !== null);
            const isSwapSource = swapSourceSlot === idx;
            const isSwapTargetCandidate =
              swapSourceSlot !== null && swapSourceSlot !== idx;

            return (
              <div
                key={pos.id}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
                className={`absolute flex flex-col items-center transition-all duration-200 ${
                  isDragTarget
                    ? "scale-110 z-40"
                    : isDraggingThis
                    ? "opacity-30 scale-90 z-10"
                    : isSwapSource
                    ? "scale-105 z-30"
                    : isSwapTargetCandidate
                    ? "scale-105 z-30 cursor-pointer"
                    : "z-20"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOverSlotIndex !== idx) setDragOverSlotIndex(idx);
                }}
                onDragLeave={() => {
                  if (dragOverSlotIndex === idx) setDragOverSlotIndex(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverSlotIndex(null);
                  setDraggedSlotIndex(null);
                  setDraggedBenchPlayer(null);
                  try {
                    const raw = e.dataTransfer.getData("text/plain");
                    if (!raw) return;
                    const data = JSON.parse(raw);
                    if (data.type === "field" && typeof data.fromIndex === "number") {
                      onSwapSlots(data.fromIndex, idx);
                    } else if (data.type === "bench" && data.name) {
                      onAddPlayerToSlot(data.name, idx);
                    }
                  } catch (err) {
                    // ignore
                  }
                }}
                onClick={() => {
                  if (swapSourceSlot !== null) {
                    if (swapSourceSlot !== idx) {
                      onSwapSlots(swapSourceSlot, idx);
                    }
                    setSwapSourceSlot(null);
                  }
                }}
              >
                {/* Visual Drop Target Halo */}
                {isDragTarget && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -inset-3 rounded-full border-2 border-dashed border-[#00BCD4] bg-[#00BCD4]/20 animate-pulse pointer-events-none"
                  />
                )}

                {/* Visual Tap-to-Swap Target Halo */}
                {isSwapTargetCandidate && (
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="absolute -inset-2.5 rounded-full border-2 border-dashed border-cyan-400 bg-cyan-500/20 pointer-events-none"
                  />
                )}

                {player ? (
                  // Assigned Player Card Node (Draggable)
                  <div
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        "text/plain",
                        JSON.stringify({ type: "field", fromIndex: idx, name: player.name }),
                      );
                      setDraggedSlotIndex(idx);
                    }}
                    onDragEnd={() => {
                      setDraggedSlotIndex(null);
                      setDragOverSlotIndex(null);
                    }}
                    className="relative group cursor-grab active:cursor-grabbing flex flex-col items-center"
                    onMouseEnter={() => setHoveredPlayer(player.name)}
                    onMouseLeave={() => setHoveredPlayer(null)}
                    onClick={(e) => {
                      if (swapSourceSlot !== null) return;
                      e.stopPropagation();
                      setActivePlayerMenu(player.name);
                    }}
                  >
                    {/* Captain / Vice-Captain Top Badge */}
                    {isCaptainMultiplierEnabled && (
                      <div className="absolute -top-3 z-30 flex items-center gap-1">
                        {isCaptain && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-[9px] font-extrabold shadow-md flex items-center gap-0.5"
                            title={`Team Captain (${cMultiplier}x Points)`}
                          >
                            <Crown className="w-2.5 h-2.5" />
                            <span>C</span>
                          </motion.span>
                        )}
                        {isViceCaptain && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-slate-300 to-slate-400 text-black text-[9px] font-extrabold shadow-md flex items-center gap-0.5"
                            title={`Vice-Captain (${vcMultiplier}x Points)`}
                          >
                            <Medal className="w-2.5 h-2.5" />
                            <span>VC</span>
                          </motion.span>
                        )}
                      </div>
                    )}

                    {/* Circular Avatar */}
                    <div
                      className={`w-11 h-11 sm:w-13 sm:h-13 rounded-full overflow-hidden border-2 bg-black/70 shadow-xl transition-all duration-200 group-hover:scale-105 flex items-center justify-center relative ${
                        isSwapSource
                          ? "ring-4 ring-cyan-400 border-cyan-400"
                          : isCaptain
                          ? "border-amber-400 ring-2 ring-amber-400/50 shadow-amber-500/30"
                          : isViceCaptain
                          ? "border-slate-300 ring-2 ring-slate-300/40"
                          : "border-white/80 group-hover:border-[#00BCD4]"
                      }`}
                      style={{
                        borderColor: isSwapSource
                          ? "#00BCD4"
                          : isCaptain
                          ? "#fbbf24"
                          : isViceCaptain
                          ? "#e2e8f0"
                          : teamBorder || "#00BCD4",
                      }}
                    >
                      {player.images ? (
                        <img
                          src={player.images}
                          alt={player.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <span className="text-xs font-bold text-white uppercase">
                          {player.name.substring(0, 2)}
                        </span>
                      )}

                      {/* Foreign Player Flag Icon */}
                      {player.overseas && (
                        <div className="absolute bottom-0 right-0 bg-[#045093] p-0.5 rounded-full border border-white/60">
                          <Plane className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Name Pill Badge */}
                    <div className="mt-1 px-2 py-0.5 rounded-full bg-black/85 backdrop-blur-sm border border-white/20 text-white text-[10px] sm:text-xs font-bold whitespace-nowrap shadow-md max-w-[90px] sm:max-w-[110px] truncate text-center">
                      {player.name.split(" ").slice(-1)[0]}
                    </div>

                    {/* Compact Points / Role Pill */}
                    <div className="mt-0.5 flex items-center gap-1">
                      <span
                        className={`text-[8px] sm:text-[9px] font-bold px-1 rounded border shadow-sm ${getRoleBadgeStyle(
                          player.role,
                        )}`}
                      >
                        {getShortRole(player.role)}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-mono font-bold text-amber-300 drop-shadow">
                        {Math.round(
                          (player.points || 0) *
                            (isCaptain ? cMultiplier : isViceCaptain ? vcMultiplier : 1),
                        )}
                        p
                      </span>
                    </div>
                  </div>
                ) : (
                  // Empty Formation Slot Node (Drop Target & Add Trigger)
                  <div
                    onClick={(e) => {
                      if (swapSourceSlot !== null) return;
                      e.stopPropagation();
                    }}
                    className={`flex flex-col items-center group cursor-pointer transition-all duration-200 ${
                      isSwapTargetCandidate ? "scale-105" : ""
                    }`}
                  >
                    <div
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-200 ${
                        isSwapTargetCandidate
                          ? "border-cyan-400 bg-cyan-500/30 shadow-lg shadow-cyan-500/30 scale-110 animate-bounce"
                          : "border-white/35 bg-black/40 group-hover:border-[#00BCD4] group-hover:bg-[#00BCD4]/15"
                      }`}
                    >
                      <Plus
                        className={`w-4 h-4 transition-colors ${
                          isSwapTargetCandidate
                            ? "text-cyan-200"
                            : "text-white/40 group-hover:text-[#00BCD4]"
                        }`}
                      />
                    </div>
                    <span className="mt-1 text-[9px] sm:text-[10px] font-medium text-white/50 group-hover:text-white/80 bg-black/60 px-1.5 py-0.5 rounded-full border border-white/10 whitespace-nowrap">
                      {pos.label}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Centered Tactical Player Action Modal */}
          <AnimatePresence>
            {activePlayerMenu && (() => {
              const player = soldPlayers.find((p) => p.name === activePlayerMenu);
              if (!player) return null;

              const slotIdx = playingXI.indexOf(player.name);
              const pos = slotIdx !== -1 ? TACTICAL_POSITIONS[slotIdx] : null;
              const isCaptain = isCaptainMultiplierEnabled && captainName === player.name;
              const isViceCaptain = isCaptainMultiplierEnabled && viceCaptainName === player.name;
              const activeMultiplier = isCaptain ? cMultiplier : isViceCaptain ? vcMultiplier : 1;
              const displayModalPoints = Math.round((player.points || 0) * activeMultiplier);

              return (
                <div
                  key="tactical-modal-overlay"
                  className="absolute inset-0 z-50 flex items-center justify-center p-4"
                >
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
                    onClick={() => setActivePlayerMenu(null)}
                  />

                  {/* Modal Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="relative z-10 w-full max-w-[270px] bg-[#0f1629] border-2 border-[#2a3441] rounded-2xl p-3.5 shadow-2xl shadow-black text-white"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Close button */}
                    <button
                      type="button"
                      onClick={() => setActivePlayerMenu(null)}
                      className="absolute top-2.5 right-2.5 text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Player Header */}
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-white/10">
                      <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-cyan-400 bg-black/60 shrink-0 flex items-center justify-center relative">
                        {player.images ? (
                          <img
                            src={player.images}
                            alt={player.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-white uppercase">
                            {player.name.substring(0, 2)}
                          </span>
                        )}
                        {player.overseas && (
                          <div className="absolute bottom-0 right-0 bg-[#045093] p-0.5 rounded-full border border-white/60">
                            <Plane className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 pr-4">
                        <h4 className="font-bold text-xs text-white truncate">
                          {player.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[8px] font-bold px-1 rounded border ${getRoleBadgeStyle(player.role)}`}>
                            {player.role}
                          </span>
                          <span className="text-xs font-mono font-bold text-amber-300">
                            {displayModalPoints} pts
                          </span>
                          {isCaptainMultiplierEnabled && activeMultiplier > 1 && (
                            <span className="text-[10px] text-amber-300 font-bold">
                              ({activeMultiplier}x)
                            </span>
                          )}
                        </div>
                        {pos && (
                          <div className="text-[10px] text-cyan-300 font-medium mt-0.5">
                            Slot: {pos.label}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-2.5 space-y-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (slotIdx !== -1) setSwapSourceSlot(slotIdx);
                          setActivePlayerMenu(null);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between transition-all"
                      >
                        <span>Move / Swap Slot</span>
                        <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
                      </button>

                      {isCaptainMultiplierEnabled && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              onSetCaptain(player.name);
                              setActivePlayerMenu(null);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center justify-between transition-all ${
                              isCaptain
                                ? "text-amber-400 bg-amber-500/20 border-amber-400/60"
                                : "text-amber-300 hover:bg-amber-500/15 bg-white/5 border-white/10"
                            }`}
                          >
                            <span>{isCaptain ? `Captain Assigned (${cMultiplier}x)` : `Make Captain (${cMultiplier}x)`}</span>
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onSetViceCaptain(player.name);
                              setActivePlayerMenu(null);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center justify-between transition-all ${
                              isViceCaptain
                                ? "text-slate-200 bg-slate-400/20 border-slate-300/60"
                                : "text-slate-300 hover:bg-slate-500/15 bg-white/5 border-white/10"
                            }`}
                          >
                            <span>{isViceCaptain ? `VC Assigned (${vcMultiplier}x)` : `Make VC (${vcMultiplier}x)`}</span>
                            <Medal className="w-3.5 h-3.5 text-slate-300" />
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          onRemovePlayer(player.name);
                          setActivePlayerMenu(null);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/20 bg-red-950/30 border border-red-500/30 flex items-center justify-between transition-all"
                      >
                        <span>Bench Player</span>
                        <X className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </motion.div>
                </div>
              );
            })()}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT: Bench & Squad Selector Drawer */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isBenchDragOver) setIsBenchDragOver(true);
        }}
        onDragLeave={() => setIsBenchDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsBenchDragOver(false);
          try {
            const raw = e.dataTransfer.getData("text/plain");
            if (!raw) return;
            const data = JSON.parse(raw);
            if (data.type === "field" && data.name) {
              onRemovePlayer(data.name);
            }
          } catch (err) {}
        }}
        className={`w-full lg:w-80 xl:w-96 flex flex-col bg-[#141b2d] border rounded-3xl p-4 sm:p-5 shadow-xl transition-all duration-200 ${
          isBenchDragOver
            ? "border-red-500/70 ring-2 ring-red-500/30 bg-red-950/10"
            : "border-[#2a3441]"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#00BCD4]" />
            <div>
              <h3 className="text-sm font-bold text-white">Squad Bench</h3>
              <p className="text-[10px] text-white/50">Drag player to pitch slot or click Add</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-semibold text-white/70">
            {benchPlayers.length} available
          </span>
        </div>

        {/* Bench Players List */}
        <div className="flex-1 overflow-y-auto max-h-[360px] lg:max-h-[420px] space-y-2 mt-3 pr-1">
          {benchPlayers.length === 0 ? (
            <div className="text-center py-12 text-white/50 text-xs">
              {soldPlayers.length === 0
                ? "No players in team roster yet. Buy players in auction first."
                : "All rostered players are in your Playing XI!"}
            </div>
          ) : (
            benchPlayers.map((player) => {
              const isEligibleToAdd = xiPlayerObjects.length < (rules.playingXITotal || 11);
              return (
                <div
                  key={player.name}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      "text/plain",
                      JSON.stringify({ type: "bench", name: player.name }),
                    );
                    setDraggedBenchPlayer(player.name);
                  }}
                  onDragEnd={() => {
                    setDraggedBenchPlayer(null);
                    setDragOverSlotIndex(null);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-[#18223a]/80 hover:bg-[#1f2b48] border border-white/10 hover:border-[#00BCD4]/50 transition-all duration-200 group cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <GripVertical className="w-3.5 h-3.5 text-white/30 group-hover:text-[#00BCD4] shrink-0" />
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-black/40 border border-white/20 shrink-0 flex items-center justify-center">
                      {player.images ? (
                        <img
                          src={player.images}
                          alt={player.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <span className="text-[11px] font-bold text-white">
                          {player.name.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">
                          {player.name}
                        </span>
                        {player.overseas && (
                          <Plane className="w-3 h-3 text-[#00BCD4] shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-white/50">
                        <span
                          className={`px-1 rounded border text-[9px] font-semibold ${getRoleBadgeStyle(
                            player.role,
                          )}`}
                        >
                          {player.role}
                        </span>
                        <span>₹{formatIndianNumber(player.soldPrice || player.basePrice)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!isEligibleToAdd}
                    onClick={() => onAddPlayer(player.name)}
                    className="p-1.5 rounded-xl bg-[#00BCD4]/15 hover:bg-[#00BCD4]/30 text-[#00BCD4] border border-[#00BCD4]/30 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 text-xs font-bold shrink-0"
                    title={isEligibleToAdd ? "Add to Playing XI" : "Playing XI Full"}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Role Quota Footer */}
        <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
          <div className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
            Playing XI Composition
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-black/30 p-2 rounded-xl border border-white/5 flex items-center justify-between">
              <span className="text-white/60">Batsmen:</span>
              <span className="font-bold text-white">
                {xiPlayerObjects.filter((p) => p.role.toLowerCase().includes("bat")).length}
              </span>
            </div>
            <div className="bg-black/30 p-2 rounded-xl border border-white/5 flex items-center justify-between">
              <span className="text-white/60">Bowlers:</span>
              <span className="font-bold text-white">
                {xiPlayerObjects.filter((p) => p.role.toLowerCase().includes("bowl")).length}
              </span>
            </div>
            <div className="bg-black/30 p-2 rounded-xl border border-white/5 flex items-center justify-between">
              <span className="text-white/60">All-Rounders:</span>
              <span className="font-bold text-white">
                {xiPlayerObjects.filter((p) => p.role.toLowerCase().includes("all")).length}
              </span>
            </div>
            <div className="bg-black/30 p-2 rounded-xl border border-white/5 flex items-center justify-between">
              <span className="text-white/60">Overseas:</span>
              <span
                className={`font-bold ${
                  xiPlayerObjects.filter((p) => p.overseas).length >
                  (rules.playingXIOverseasLimit || 4)
                    ? "text-red-400"
                    : "text-white"
                }`}
              >
                {xiPlayerObjects.filter((p) => p.overseas).length} /{" "}
                {rules.playingXIOverseasLimit || 4}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
