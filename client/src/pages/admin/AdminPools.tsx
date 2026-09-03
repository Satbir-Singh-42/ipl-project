import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Layers,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Edit2,
  Users,
  Check,
  RotateCcw,
  Sparkles,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AdminHeader } from "@/components/AdminHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CustomDropdown } from "@/components/CustomDropdown";
import { supabaseService } from "@/services/supabaseService";
import type { Pool, Player } from "@/services/supabaseService";
import { formatIndianNumber } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function AdminPools() {
  const { toast } = useToast();
  const [pools, setPools] = useState<Pool[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Custom Confirmation Modal state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    variant?: "danger" | "warning" | "info" | "primary";
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  // New pool state
  const [newPoolName, setNewPoolName] = useState("");
  const [editingPoolId, setEditingPoolId] = useState<number | null>(null);
  const [editingPoolName, setEditingPoolName] = useState("");

  // Search & filter for player roster
  const [playerSearch, setPlayerSearch] = useState("");
  const [unassignedSearch, setUnassignedSearch] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedPools, fetchedPlayers] = await Promise.all([
        supabaseService.getPools(),
        supabaseService.getPlayers(),
      ]);
      setPools(fetchedPools);
      setPlayers(fetchedPlayers);
      if (fetchedPools.length > 0 && selectedPoolId === null) {
        setSelectedPoolId(fetchedPools[0].id);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load data";
      toast({ title: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Pools Handlers
  const handleCreatePool = async () => {
    if (!newPoolName.trim()) return;
    setIsProcessing(true);
    try {
      const created = await supabaseService.createPool(newPoolName.trim());
      setNewPoolName("");
      toast({ title: `Created pool: ${created.name}` });
      await loadData();
      setSelectedPoolId(created.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create pool";
      toast({ title: message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdatePoolName = async (id: number) => {
    if (!editingPoolName.trim()) return;
    try {
      await supabaseService.updatePool(id, { name: editingPoolName.trim() });
      setEditingPoolId(null);
      toast({ title: "Pool name updated" });
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to rename pool";
      toast({ title: message, variant: "destructive" });
    }
  };

  const handleDeletePool = (id: number, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Auction Set",
      description: `Are you sure you want to delete "${name}"? Players in this set will become unassigned and remain safely in the catalogue.`,
      confirmText: "Delete Set",
      variant: "danger",
      onConfirm: async () => {
        try {
          await supabaseService.deletePool(id);
          toast({ title: `Deleted set "${name}"` });
          if (selectedPoolId === id) {
            setSelectedPoolId(null);
          }
          await loadData();
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Failed to delete set";
          toast({ title: message, variant: "destructive" });
        }
      },
    });
  };

  const handleMovePool = async (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === pools.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const reordered = [...pools];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    setPools(reordered);
    try {
      await supabaseService.reorderPools(reordered.map((p) => p.id));
      toast({ title: "Pool order updated" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reorder pools";
      toast({ title: message, variant: "destructive" });
      await loadData();
    }
  };

  // Quick Action: Auto Group by Role
  const handleAutoGroupByRole = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Auto-Group Players by Role",
      description: "Auto-group all players into 4 Sets (Batsmen, Bowlers, All-Rounders, Wicket-Keepers) sorted by player rating? Existing sets will be updated.",
      confirmText: "Auto-Group Players",
      variant: "info",
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const res = await supabaseService.autoGroupByRole();
          toast({
            title: "Auto-grouping completed",
            description: `Assigned ${res.playersAssigned} players across sets.`,
          });
          await loadData();
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Auto-grouping failed";
          toast({ title: message, variant: "destructive" });
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  // Quick Action: Pool Unsold Players
  const handlePoolUnsoldPlayers = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Pool Unsold Players",
      description: "This will gather all currently unsold players across prior rounds and cluster them into a dedicated Accelerated Round set for re-auction.",
      confirmText: "Pool Unsold Players",
      variant: "warning",
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const res = await supabaseService.poolUnsoldPlayers();
          toast({
            title: "Unsold players pooled",
            description: `Grouped ${res.count} unsold players into "${res.pool.name}".`,
          });
          await loadData();
          setSelectedPoolId(res.pool.id);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Failed to pool unsold players";
          toast({ title: message, variant: "destructive" });
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  // Player Sequencing within active pool
  const poolPlayers = players
    .filter((p) => p.poolId === selectedPoolId)
    .sort((a, b) => (a.auctionOrder || 0) - (b.auctionOrder || 0));

  const unassignedPlayers = players.filter((p) => !p.poolId);

  const filteredPoolPlayers = poolPlayers.filter(
    (p) =>
      p.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
      p.role.toLowerCase().includes(playerSearch.toLowerCase()),
  );

  const filteredUnassignedPlayers = unassignedPlayers.filter(
    (p) =>
      p.name.toLowerCase().includes(unassignedSearch.toLowerCase()) ||
      p.role.toLowerCase().includes(unassignedSearch.toLowerCase()),
  );

  const handleMovePlayer = async (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === poolPlayers.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const reordered = [...poolPlayers];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const orderedIds = reordered
      .map((p) => p.dbId)
      .filter((id): id is number => typeof id === "number");

    try {
      await supabaseService.reorderPlayersInPool(selectedPoolId, orderedIds);
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reorder players";
      toast({ title: message, variant: "destructive" });
    }
  };

  const handleAssignPlayer = async (playerId: number, targetPoolId: number | null) => {
    try {
      await supabaseService.assignPlayerToPool(playerId, targetPoolId);
      toast({ title: targetPoolId ? "Player added to set" : "Player removed from set" });
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to assign player";
      toast({ title: message, variant: "destructive" });
    }
  };

  const selectedPool = pools.find((p) => p.id === selectedPoolId);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Batsman":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "Bowler":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "All Rounder":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "Wicket Keeper":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      default:
        return "bg-white/10 text-white border-white/20";
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1629] text-white [font-family:'Work_Sans',Helvetica]">
      <AdminHeader activeTab="pools" />

      <main className="w-full p-4 sm:p-6 md:p-8 lg:p-12 space-y-6">
        {/* Page Title & Quick Actions Toolbar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 md:p-6 rounded-2xl bg-[#18184a] border border-white/10 shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-5 h-5 text-[#fe6804]" />
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Auction Sets & Pool Sequence Manager
              </h2>
            </div>
            <p className="text-xs md:text-sm text-white/60">
              Structure player sets, configure auction call sequences, and cluster unsold players into accelerated rounds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleAutoGroupByRole}
              disabled={isProcessing}
              className="bg-[#00BCD4]/10 border border-[#00BCD4]/40 text-[#00BCD4] hover:bg-[#00BCD4]/25 hover:border-[#00BCD4] text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center transition-all active:scale-95 disabled:opacity-50 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Auto-Group by Role
            </button>

            <button
              type="button"
              onClick={handlePoolUnsoldPlayers}
              disabled={isProcessing}
              className="bg-amber-500/10 border border-amber-500/40 text-amber-400 hover:bg-amber-500/25 hover:border-amber-500 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center transition-all active:scale-95 disabled:opacity-50 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Pool Unsold Players
            </button>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Sets & Pools List (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="bg-[#18184a] border-white/10 shadow-xl">
              <CardHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#fe6804]" />
                  Auction Sets ({pools.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-3">
                {/* Create Pool Input */}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="New set name (e.g. Set 1: Marquee)..."
                    value={newPoolName}
                    onChange={(e) => setNewPoolName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreatePool()}
                    className="bg-[#0f1629] border-[#2a3441] text-white text-xs"
                  />
                  <Button
                    onClick={handleCreatePool}
                    disabled={isProcessing || !newPoolName.trim()}
                    className="bg-[#fe6804] hover:bg-[#fe6804]/90 text-white text-xs px-3 py-2 shrink-0 rounded-lg font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add
                  </Button>
                </div>

                {/* Pools List */}
                <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                  {isLoading ? (
                    <div className="text-xs text-white/50 text-center py-8">Loading sets...</div>
                  ) : pools.length === 0 ? (
                    <div className="text-xs text-white/50 text-center py-8 bg-[#0f1629]/50 rounded-xl p-4 border border-dashed border-white/10">
                      No sets created yet. Use &ldquo;Auto-Group by Role&rdquo; or add a set above.
                    </div>
                  ) : (
                    pools.map((pool, idx) => {
                      const isSelected = pool.id === selectedPoolId;
                      const isEditing = pool.id === editingPoolId;

                      return (
                        <div
                          key={pool.id}
                          onClick={() => setSelectedPoolId(pool.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                            isSelected
                              ? "bg-[#fe6804]/15 border-[#fe6804] shadow-md ring-1 ring-[#fe6804]"
                              : "bg-[#0f1629] border-[#2a3441] hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="w-5 h-5 rounded-full bg-white/10 text-[10px] font-bold flex items-center justify-center text-white/70 shrink-0">
                              {idx + 1}
                            </span>
                            {isEditing ? (
                              <div
                                className="flex items-center gap-1.5 flex-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Input
                                  value={editingPoolName}
                                  onChange={(e) => setEditingPoolName(e.target.value)}
                                  className="h-7 text-xs bg-[#1a2332] border-[#2a3441] text-white"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdatePoolName(pool.id)}
                                  className="h-7 px-2 bg-[#00BCD4] text-white"
                                >
                                  <Check className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-white truncate">
                                  {pool.name}
                                </div>
                                <div className="text-[11px] text-white/50 flex items-center gap-1 mt-0.5">
                                  <Users className="w-3 h-3" />
                                  <span>{pool.playerCount || 0} players</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Controls */}
                          <div
                            className="flex items-center gap-1 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleMovePool(idx, "up")}
                              disabled={idx === 0}
                              className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-20"
                              title="Move Set Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMovePool(idx, "down")}
                              disabled={idx === pools.length - 1}
                              className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-20"
                              title="Move Set Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPoolId(pool.id);
                                setEditingPoolName(pool.name);
                              }}
                              className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white"
                              title="Rename Set"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePool(pool.id, pool.name)}
                              className="p-1 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300"
                              title="Delete Set"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Unassigned Players Summary Card */}
            <Card className="bg-[#18184a] border-white/10 shadow-xl">
              <CardHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Unassigned Players ({unassignedPlayers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-2.5" />
                  <Input
                    placeholder="Search unassigned..."
                    value={unassignedSearch}
                    onChange={(e) => setUnassignedSearch(e.target.value)}
                    className="pl-8 bg-[#0f1629] border-[#2a3441] text-white text-xs h-8"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {filteredUnassignedPlayers.length === 0 ? (
                    <div className="text-[11px] text-white/40 text-center py-4">
                      {unassignedPlayers.length === 0
                        ? "All players assigned to sets"
                        : "No matching players"}
                    </div>
                  ) : (
                    filteredUnassignedPlayers.map((player) => (
                      <div
                        key={player.dbId || player.name}
                        className="p-2 rounded-lg bg-[#0f1629] border border-[#2a3441] flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-semibold text-white truncate block">
                            {player.name}
                          </span>
                          <span className="text-[10px] text-white/50">{player.role}</span>
                        </div>
                        {selectedPoolId && (
                          <Button
                            size="sm"
                            onClick={() => player.dbId && handleAssignPlayer(player.dbId, selectedPoolId)}
                            className="h-6 px-2 text-[10px] bg-[#fe6804] hover:bg-[#fe6804]/90 text-white shrink-0 font-bold"
                          >
                            + Add to Set
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Active Set Player Roster (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <Card className="bg-[#18184a] border-white/10 shadow-xl">
              <CardHeader className="p-4 md:p-5 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00BCD4]" />
                    <CardTitle className="text-base font-bold text-white">
                      {selectedPool ? selectedPool.name : "Select an Auction Set"}
                    </CardTitle>
                    {selectedPool && (
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-xs font-semibold">
                        {poolPlayers.length} Players
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/50 mt-1">
                    Players in this set will be called up in this exact sequential order during the auction.
                  </p>
                </div>

                {selectedPool && (
                  <div className="relative w-full sm:w-60">
                    <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-2.5" />
                    <Input
                      placeholder="Filter players in set..."
                      value={playerSearch}
                      onChange={(e) => setPlayerSearch(e.target.value)}
                      className="pl-8 bg-[#0f1629] border-[#2a3441] text-white text-xs h-8"
                    />
                  </div>
                )}
              </CardHeader>

              <CardContent className="p-3 md:p-4">
                {!selectedPool ? (
                  <div className="text-center py-16 text-white/50 text-xs">
                    Please select or create an auction set on the left panel.
                  </div>
                ) : filteredPoolPlayers.length === 0 ? (
                  <div className="text-center py-16 text-white/50 text-xs bg-[#0f1629]/40 rounded-xl border border-dashed border-white/10">
                    No players in this set yet. Use &ldquo;+ Add to Set&rdquo; from the Unassigned Players tray below or auto-group players.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredPoolPlayers.map((player, idx) => (
                      <motion.div
                        key={player.dbId || player.name}
                        layout
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-xl bg-[#0f1629] border border-[#2a3441] hover:border-white/20 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        {/* Player Profile & Order Index */}
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-[#1a2332] text-white font-bold text-xs flex items-center justify-center border border-white/10 shrink-0">
                            #{idx + 1}
                          </span>

                          {player.images ? (
                            <img
                              src={player.images}
                              alt={player.name}
                              className="w-9 h-9 rounded-full object-cover border border-white/20 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#1a2332] border border-white/10 flex items-center justify-center text-xs font-bold text-white/60 shrink-0">
                              {player.name.charAt(0)}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white truncate">
                                {player.name}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${getRoleBadge(
                                  player.role,
                                )}`}
                              >
                                {player.role}
                              </span>
                              {player.status === "unsold" && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                                  Unsold
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-white/50 flex items-center gap-3 mt-0.5">
                              <span>{player.nation}</span>
                              <span>•</span>
                              <span>Base: ₹{formatIndianNumber(player.basePrice)}</span>
                              <span>•</span>
                              <span>Rating: {player.points} pts</span>
                            </div>
                          </div>
                        </div>

                        {/* Order Reorder & Move Controls */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          {/* Move to another pool dropdown */}
                          <CustomDropdown
                            value={player.poolId || ""}
                            onChange={(val) => {
                              const poolVal = val === "" ? null : Number(val);
                              if (player.dbId) handleAssignPlayer(player.dbId, poolVal);
                            }}
                            options={[
                              ...pools.map((p) => ({
                                value: p.id,
                                label: p.name,
                              })),
                              {
                                value: "",
                                label: "(Unassigned)",
                              },
                            ]}
                            placeholder="Move to set..."
                            size="sm"
                            className="w-40 sm:w-44"
                          />

                          {/* Up/Down buttons */}
                          <div className="flex items-center gap-1 bg-[#1a2332] p-0.5 rounded-lg border border-[#2a3441]">
                            <button
                              type="button"
                              onClick={() => handleMovePlayer(idx, "up")}
                              disabled={idx === 0}
                              className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-20"
                              title="Move Earlier in Auction Queue"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMovePlayer(idx, "down")}
                              disabled={idx === poolPlayers.length - 1}
                              className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-20"
                              title="Move Later in Auction Queue"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Remove from set button */}
                          <button
                            type="button"
                            onClick={() => player.dbId && handleAssignPlayer(player.dbId, null)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20"
                            title="Remove from this set"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Custom Confirmation Modal */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        isLoading={isProcessing}
      />
    </div>
  );
}
