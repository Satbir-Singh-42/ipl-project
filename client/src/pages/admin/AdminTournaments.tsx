import { useState, useEffect, useCallback } from "react";
import {
  Trophy,
  Plus,
  Trash2,
  Edit2,
  Copy,
  ExternalLink,
  Shield,
  Layers,
  Users,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AdminHeader } from "@/components/AdminHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { useTournament } from "@/contexts/TournamentContext";
import { supabaseService, type Tournament } from "@/services/supabaseService";

interface TournamentStats {
  teamsCount: number;
  playersCount: number;
  poolsCount: number;
}

export function AdminTournaments() {
  const { toast } = useToast();
  const {
    tournaments,
    currentTournament,
    switchTournament,
    createTournament,
    updateTournament,
    deleteTournament,
    refreshTournaments,
    activeTournamentId,
  } = useTournament();

  const [statsMap, setStatsMap] = useState<Record<number, TournamentStats>>({});
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Create Modal / Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [newRoomCode, setNewRoomCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCurrencySymbol, setNewCurrencySymbol] = useState("₹");
  const [newCurrencyCode, setNewCurrencyCode] = useState("INR");
  const [cloneTemplate, setCloneTemplate] = useState(true);

  // Edit Modal State
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editRoomCode, setEditRoomCode] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCurrencySymbol, setEditCurrencySymbol] = useState("₹");
  const [editCurrencyCode, setEditCurrencyCode] = useState("INR");

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info" | "primary";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const loadStats = useCallback(async () => {
    setIsLoadingStats(true);
    const stats: Record<number, TournamentStats> = {};
    for (const t of tournaments) {
      try {
        const [teams, players, pools] = await Promise.all([
          supabaseService.getTeamConfigs(t.id),
          supabaseService.getPlayers(t.id),
          supabaseService.getPools(t.id),
        ]);
        stats[t.id] = {
          teamsCount: teams.length,
          playersCount: players.length,
          poolsCount: pools.length,
        };
      } catch {
        stats[t.id] = { teamsCount: 0, playersCount: 0, poolsCount: 0 };
      }
    }
    setStatsMap(stats);
    setIsLoadingStats(false);
  }, [tournaments]);

  useEffect(() => {
    if (tournaments.length > 0) {
      loadStats();
    }
  }, [tournaments, loadStats]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast({
        title: "Validation Error",
        description: "Tournament name is required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createTournament({
        name: newName.trim(),
        slug: newSlug.trim() || undefined,
        room_code: newRoomCode.trim() || undefined,
        description: newDescription.trim() || undefined,
        currency_symbol: newCurrencySymbol.trim() || "₹",
        currency_code: newCurrencyCode.trim() || "INR",
        cloneFromTemplate: cloneTemplate,
      });

      toast({
        title: "Tournament Room Created",
        description: `Room code [${created.room_code}] generated and active.`,
      });

      setShowCreateModal(false);
      setNewName("");
      setNewSlug("");
      setNewRoomCode("");
      setNewDescription("");
      loadStats();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Creation failed.";
      toast({
        title: "Error Creating Tournament",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (t: Tournament) => {
    setEditingTournament(t);
    setEditName(t.name);
    setEditSlug(t.slug);
    setEditRoomCode(t.room_code);
    setEditDescription(t.description || "");
    setEditCurrencySymbol(t.currency_symbol || "₹");
    setEditCurrencyCode(t.currency_code || "INR");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTournament) return;

    setIsSubmitting(true);
    try {
      await updateTournament(editingTournament.id, {
        name: editName.trim(),
        slug: editSlug.trim(),
        room_code: editRoomCode.trim().toUpperCase(),
        description: editDescription.trim(),
        currency_symbol: editCurrencySymbol.trim(),
        currency_code: editCurrencyCode.trim().toUpperCase(),
      });

      toast({
        title: "Tournament Updated",
        description: `Saved changes to ${editName}.`,
      });
      setEditingTournament(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Update failed.";
      toast({
        title: "Update Failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (tournament: Tournament) => {
    if (tournament.id === 1) {
      toast({
        title: "Cannot Delete Default Room",
        description: "The primary IPL 2025 Mega Auction room is protected.",
        variant: "destructive",
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: `Delete Tournament Room: ${tournament.name}?`,
      description: `This will permanently delete this tournament room, including all its players, teams, pools, and auction logs. This action cannot be undone.`,
      confirmText: "Delete Permanently",
      cancelText: "Cancel",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteTournament(tournament.id);
          toast({
            title: "Tournament Room Deleted",
            description: `Removed ${tournament.name}.`,
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Deletion failed.";
          toast({
            title: "Delete Failed",
            description: msg,
            variant: "destructive",
          });
        }
      },
    });
  };

  const handleSwitch = async (id: number) => {
    await switchTournament(id);
    toast({
      title: "Active Room Switched",
      description: `Workspace is now targeting tournament room ID: ${id}`,
    });
  };

  return (
    <div className="min-h-screen bg-[#0f1629] text-white">
      <AdminHeader activeTab={"dashboard" as any} title="MANAGE TOURNAMENT ROOMS">
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider">
              Active Workspace:
            </span>
            <span className="bg-[#fe6804]/20 border border-[#fe6804]/60 text-[#fe6804] px-2 py-0.5 rounded text-xs font-bold">
              {currentTournament?.name || "IPL 2025 Mega Auction"} ({currentTournament?.room_code})
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-[#fe6804] to-[#ef4123] text-white font-bold text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            CREATE ROOM
          </Button>
        </div>
      </AdminHeader>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-[#18184a]/80 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                <span>Total Tournament Rooms</span>
                <Trophy className="w-4 h-4 text-[#fe6804]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{tournaments.length}</div>
              <p className="text-[11px] text-slate-400 mt-1">Independent isolated databases</p>
            </CardContent>
          </Card>

          <Card className="bg-[#18184a]/80 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                <span>Active Room Code</span>
                <Shield className="w-4 h-4 text-[#00bcd4]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-mono font-bold text-[#00bcd4]">
                {currentTournament?.room_code || "IPL2025"}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Currency: {currentTournament?.currency_symbol || "₹"} ({currentTournament?.currency_code || "INR"})
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#18184a]/80 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                <span>Active Scope Stats</span>
                <Users className="w-4 h-4 text-green-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {statsMap[activeTournamentId]?.teamsCount || 0} Teams / {statsMap[activeTournamentId]?.playersCount || 0} Players
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {statsMap[activeTournamentId]?.poolsCount || 0} Auction Sets & Pools
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tournaments Table */}
        <Card className="bg-[#18184a]/80 border-white/10 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-white/10 flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle className="text-lg font-bold text-white">
                Tournament & Organization Rooms Directory
              </CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage room access, codes, currencies, and switch admin workspace scope
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refreshTournaments();
                loadStats();
              }}
              disabled={isLoadingStats}
              className="border-white/20 text-slate-300 hover:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoadingStats ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/40 text-slate-400 text-xs uppercase font-semibold border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Room & Name</th>
                    <th className="py-3 px-4">Room Code</th>
                    <th className="py-3 px-4">Currency</th>
                    <th className="py-3 px-4 text-center">Teams</th>
                    <th className="py-3 px-4 text-center">Players</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tournaments.map((t) => {
                    const isActive = t.id === activeTournamentId;
                    const stats = statsMap[t.id] || { teamsCount: 0, playersCount: 0, poolsCount: 0 };

                    return (
                      <tr
                        key={t.id}
                        className={`transition-colors ${
                          isActive ? "bg-[#fe6804]/10 hover:bg-[#fe6804]/15" : "hover:bg-white/5"
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded bg-gradient-to-tr from-[#0b2a7d] to-[#18184a] border border-white/20 flex items-center justify-center font-bold text-white text-xs shrink-0">
                              {t.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                {t.name}
                                {t.id === 1 && (
                                  <span className="text-[10px] bg-[#00bcd4]/20 text-[#00bcd4] border border-[#00bcd4]/40 px-1.5 py-0.2 rounded font-bold uppercase">
                                    DEFAULT
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 truncate max-w-xs">
                                slug: /{t.slug}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[#00bcd4] text-xs">
                              {t.room_code}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(t.room_code);
                                toast({
                                  title: "Copied Code",
                                  description: `[${t.room_code}] copied to clipboard.`,
                                });
                              }}
                              className="text-slate-400 hover:text-white"
                              title="Copy Code"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-300">
                          {t.currency_symbol || "₹"} {t.currency_code || "INR"}
                        </td>

                        <td className="py-3 px-4 text-center font-bold text-white">
                          {stats.teamsCount}
                        </td>

                        <td className="py-3 px-4 text-center font-bold text-white">
                          {stats.playersCount}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#fe6804] text-white">
                              <CheckCircle2 className="w-3 h-3" /> ACTIVE
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSwitch(t.id)}
                              className="text-xs text-slate-400 hover:text-white underline"
                            >
                              Set Active
                            </button>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditModal(t)}
                              className="text-slate-300 hover:text-white h-8 px-2"
                              title="Edit Room Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>

                            {t.id !== 1 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(t)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-8 px-2"
                                title="Delete Room"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f1629] border border-white/20 rounded-xl max-w-lg w-full p-6 text-white shadow-2xl">
            <h3 className="text-xl font-bold [font-family:'Work_Sans',Helvetica] mb-1">
              Create New Auction Room
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Create an isolated workspace with custom room code and currency.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-300">
                  Tournament Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Hyderabad Premier League 2025"
                  value={newName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = e.target.value;
                    setNewName(val);
                    if (!isSlugCustomized) {
                      setNewSlug(
                        val
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/(^-|-$)/g, ""),
                      );
                    }
                  }}
                  className="bg-black/30 border-white/20 text-white mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-300">
                    Room Code
                  </label>
                  <Input
                    placeholder="e.g. HYD2025"
                    value={newRoomCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRoomCode(e.target.value.toUpperCase())}
                    className="bg-black/30 border-white/20 text-white font-mono uppercase mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-300">
                    URL Slug
                  </label>
                  <Input
                    placeholder="e.g. hyd-2025"
                    value={newSlug}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setNewSlug(e.target.value.toLowerCase());
                      setIsSlugCustomized(true);
                    }}
                    className="bg-black/30 border-white/20 text-white mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-300">
                    Currency Symbol
                  </label>
                  <Input
                    placeholder="e.g. ₹ or $ or PTS"
                    value={newCurrencySymbol}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCurrencySymbol(e.target.value)}
                    className="bg-black/30 border-white/20 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-300">
                    Currency Code
                  </label>
                  <Input
                    placeholder="e.g. INR or USD"
                    value={newCurrencyCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCurrencyCode(e.target.value.toUpperCase())}
                    className="bg-black/30 border-white/20 text-white mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-300">
                  Description
                </label>
                <textarea
                  placeholder="Organizer information and tournament background..."
                  value={newDescription}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-md bg-black/30 border border-white/20 text-white p-2 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-[#fe6804]"
                />
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="adminCloneTemplate"
                  checked={cloneTemplate}
                  onChange={(e) => setCloneTemplate(e.target.checked)}
                  className="mt-1 accent-[#fe6804] w-4 h-4 rounded cursor-pointer"
                />
                <label htmlFor="adminCloneTemplate" className="text-xs cursor-pointer text-slate-300">
                  <span className="font-bold text-white block">
                    Copy Official IPL 2025 Template
                  </span>
                  Automatically duplicate teams, sets & pools, and squad rules into this new room.
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-[#fe6804] to-[#ef4123] text-white font-bold"
                >
                  {isSubmitting ? "Creating..." : "Confirm & Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTournament && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f1629] border border-white/20 rounded-xl max-w-lg w-full p-6 text-white shadow-2xl">
            <h3 className="text-xl font-bold [font-family:'Work_Sans',Helvetica] mb-1">
              Edit Tournament Room
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Update room metadata, code, or currency settings.
            </p>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-300">
                  Tournament Name *
                </label>
                <Input
                  required
                  value={editName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
                  className="bg-black/30 border-white/20 text-white mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-300">
                    Room Code *
                  </label>
                  <Input
                    required
                    value={editRoomCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditRoomCode(e.target.value.toUpperCase())}
                    className="bg-black/30 border-white/20 text-white font-mono uppercase mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-300">
                    URL Slug *
                  </label>
                  <Input
                    required
                    value={editSlug}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditSlug(e.target.value.toLowerCase())}
                    className="bg-black/30 border-white/20 text-white mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-300">
                    Currency Symbol
                  </label>
                  <Input
                    value={editCurrencySymbol}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditCurrencySymbol(e.target.value)}
                    className="bg-black/30 border-white/20 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-300">
                    Currency Code
                  </label>
                  <Input
                    value={editCurrencyCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditCurrencyCode(e.target.value.toUpperCase())}
                    className="bg-black/30 border-white/20 text-white mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-300">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-md bg-black/30 border border-white/20 text-white p-2 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-[#fe6804]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingTournament(null)}
                  className="text-slate-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#fe6804] hover:bg-[#e05b03] text-white font-bold"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        variant={confirmDialog.variant}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
