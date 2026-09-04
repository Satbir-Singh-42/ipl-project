import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Save,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Shield,
  Sliders,
  DollarSign,
  Users,
  Globe,
  Award,
  CheckCircle2,
  AlertCircle,
  X,
  Upload,
  Pipette,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabaseService } from "@/services/supabaseService";
import type { TeamStats } from "@/services/supabaseService";
import { queryClient } from "@/lib/queryClient";
import { formatIndianNumber } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { AdminHeader } from "@/components/AdminHeader";
import {
  getAuctionRules,
  saveAuctionRules,
  resetAuctionRules,
  type AuctionSquadRules,
} from "@/services/auctionRules";

const PRESET_LOGOS = [
  { label: "CSK", path: "/images/teams/csk.jpg" },
  { label: "MI", path: "/images/teams/mi.jpg" },
  { label: "RCB", path: "/images/teams/rcb.jpg" },
  { label: "KKR", path: "/images/teams/kkr.jpeg" },
  { label: "DC", path: "/images/teams/dc.jpg" },
  { label: "SRH", path: "/images/teams/srh.webp" },
  { label: "RR", path: "/images/teams/rr.png" },
  { label: "PBKS", path: "/images/teams/pbks.png" },
  { label: "GT", path: "/images/teams/gt.png" },
  { label: "LSG", path: "/images/teams/lsg.png" },
  { label: "GG", path: "/images/teams/gg.png" },
  { label: "IT", path: "/images/teams/it.png" },
];

const PRESET_COLORS = [
  { name: "Yellow", hex: "#F9CD00" },
  { name: "Blue", hex: "#045093" },
  { name: "Red", hex: "#DA1212" },
  { name: "Purple", hex: "#3E1F47" },
  { name: "Navy", hex: "#004C97" },
  { name: "Orange", hex: "#F26522" },
  { name: "Pink", hex: "#EA1A8C" },
  { name: "Crimson", hex: "#C8102E" },
  { name: "Dark Navy", hex: "#0A1931" },
  { name: "Teal", hex: "#0097A7" },
  { name: "Cyan", hex: "#00BCD4" },
  { name: "IPL Orange", hex: "#fe6804" },
];

const sanitizeHexColor = (col?: string | null): string => {
  if (!col) return "#fe6804";
  const match = col.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/);
  if (match) return `#${match[1]}`;
  return col.startsWith("#") ? col : `#${col}`;
};

export function AdminTeams() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"teams" | "rules">("teams");
  const [teams, setTeams] = useState<TeamStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editing single budgets in list
  const [editingBudgets, setEditingBudgets] = useState<Record<string, string>>({});

  // Add / Edit Modal State
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamStats | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [teamForm, setTeamForm] = useState({
    name: "",
    slug: "",
    logoUrl: "/images/teams/csk.jpg",
    borderColor: "#F9CD00",
    startingBudget: "10000000",
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const publicUrl = await supabaseService.uploadImage("team-logos", file);
      setTeamForm((prev) => ({ ...prev, logoUrl: publicUrl }));
      toast({ title: "Team logo uploaded to Storage" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload logo";
      toast({ title: message, variant: "destructive" });
    } finally {
      setIsUploadingLogo(false);
      e.target.value = "";
    }
  };

  // Auction Rules State
  const [rules, setRules] = useState<AuctionSquadRules>(getAuctionRules());

  const loadTeams = async () => {
    setIsLoading(true);
    try {
      const data = await supabaseService.getTeamStats();
      setTeams(data);
      const budgets: Record<string, string> = {};
      data.forEach((t) => {
        budgets[t.teamId] = t.startingBudget.toString();
      });
      setEditingBudgets(budgets);
    } catch (err) {
      console.error("Failed to load teams:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const openAddModal = () => {
    setEditingTeam(null);
    setTeamForm({
      name: "",
      slug: "",
      logoUrl: "/images/teams/csk.jpg",
      borderColor: "#F9CD00",
      startingBudget: (rules.startingBudget || 10000000).toString(),
    });
    setShowTeamModal(true);
  };

  const openEditModal = (team: TeamStats) => {
    setEditingTeam(team);
    setTeamForm({
      name: team.teamName,
      slug: team.teamId,
      logoUrl: team.logoUrl || "/images/teams/csk.jpg",
      borderColor: sanitizeHexColor(team.borderColor),
      startingBudget: team.startingBudget.toString(),
    });
    setShowTeamModal(true);
  };

  const handleSaveTeamModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name.trim()) {
      toast({ title: "Team name is required", variant: "destructive" });
      return;
    }

    const budget = parseFloat(teamForm.startingBudget);
    if (isNaN(budget) || budget < 0) {
      toast({ title: "Starting budget must be a positive number", variant: "destructive" });
      return;
    }

    const cleanColor = sanitizeHexColor(teamForm.borderColor);
    setIsSubmitting(true);
    try {
      let finalLogoUrl = teamForm.logoUrl.trim();
      if (finalLogoUrl && (finalLogoUrl.startsWith("http://") || finalLogoUrl.startsWith("https://"))) {
        finalLogoUrl = await supabaseService.uploadImageFromUrl("team-logos", finalLogoUrl);
      }

      if (editingTeam) {
        // Update existing team
        await supabaseService.updateTeam(editingTeam.teamId, {
          name: teamForm.name.trim(),
          logo_url: finalLogoUrl,
          border_color: cleanColor,
          starting_budget: budget,
        });
        toast({ title: `Team "${teamForm.name}" updated successfully` });
      } else {
        // Create new team
        await supabaseService.createTeam({
          name: teamForm.name.trim(),
          slug: teamForm.slug.trim() || undefined,
          logo_url: finalLogoUrl,
          border_color: cleanColor,
          starting_budget: budget,
        });
        toast({ title: `Team "${teamForm.name}" created successfully` });
      }

      setShowTeamModal(false);
      await loadTeams();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save team";
      toast({ title: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeam = async (team: TeamStats) => {
    if (team.playersCount > 0) {
      if (
        !confirm(
          `Warning: "${team.teamName}" currently has ${team.playersCount} players assigned. Deleting this team will remove it from the roster. Proceed?`
        )
      ) {
        return;
      }
    } else {
      if (!confirm(`Are you sure you want to remove team "${team.teamName}"?`)) {
        return;
      }
    }

    try {
      await supabaseService.deleteTeam(team.teamId);
      toast({ title: `Team "${team.teamName}" deleted from database` });
      await loadTeams();
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["players"] });
      queryClient.invalidateQueries({ queryKey: ["soldPlayers"] });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete team";
      toast({ title: message, variant: "destructive" });
    }
  };

  const handleSaveBudget = async (teamId: string) => {
    const budget = parseFloat(editingBudgets[teamId]);
    if (isNaN(budget) || budget < 0) {
      toast({ title: "Invalid budget amount", variant: "destructive" });
      return;
    }

    try {
      await supabaseService.updateTeamBudget(teamId, budget);
      toast({ title: "Budget updated" });
      await loadTeams();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: message, variant: "destructive" });
    }
  };

  const handleApplyBudgetToAll = async () => {
    if (
      !confirm(
        `Update starting budget of ALL ${teams.length} teams to ₹${formatIndianNumber(
          rules.startingBudget
        )}?`
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("teams")
        .update({ starting_budget: rules.startingBudget })
        .neq("id", 0);

      if (error) throw new Error(error.message);
      toast({
        title: `All ${teams.length} team budgets updated to ₹${formatIndianNumber(
          rules.startingBudget
        )}`,
      });
      await loadTeams();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update budgets";
      toast({ title: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveRulesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rules.maxPlayers <= 0 || rules.minPlayers <= 0) {
      toast({ title: "Player limits must be greater than zero", variant: "destructive" });
      return;
    }
    if (rules.minPlayers > rules.maxPlayers) {
      toast({ title: "Min players cannot exceed max players", variant: "destructive" });
      return;
    }
    if (rules.maxOverseas > rules.maxPlayers) {
      toast({ title: "Overseas limit cannot exceed max players", variant: "destructive" });
      return;
    }

    saveAuctionRules(rules);
    toast({ title: "Auction and squad rules saved successfully" });
  };

  const handleResetRulesClick = () => {
    if (!confirm("Reset all auction rules to system defaults?")) return;
    const defaultRules = resetAuctionRules();
    setRules(defaultRules);
    toast({ title: "Auction rules reset to defaults" });
  };

  return (
    <div className="bg-[#18184a] w-full min-h-screen text-white flex flex-col">
      <AdminHeader activeTab="teams" />

      <section className="w-full bg-[#18184a] p-2 sm:p-4 md:p-6 py-3 sm:py-5 flex-1">
        <div className="w-full bg-wwwiplt20comconcrete-80 rounded-xl md:rounded-2xl backdrop-blur-[28.09px] p-2.5 sm:p-4 md:p-5">
          <Card className="w-full bg-[#0f1629] border-[#1a2332]">
            {/* Top Bar with Title, Subtabs, and Add Team Action */}
            <CardHeader className="p-4 md:p-6 border-b border-[#1a2332]">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-white text-lg md:text-xl font-bold [font-family:'Work_Sans',Helvetica]">
                    Team & Auction Rules Setup
                  </CardTitle>
                  <p className="text-white/60 text-xs mt-0.5">
                    Configure franchises, brand logos, colors, budgets, and squad limits
                  </p>
                </div>

                {/* Tab Pill Switcher */}
                <div className="flex items-center gap-1.5 bg-[#1a2332] p-1 rounded-full border border-[#2a3441]">
                  <button
                    onClick={() => setActiveTab("teams")}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      activeTab === "teams"
                        ? "bg-[linear-gradient(180deg,rgba(255,107,0,1)_0%,rgba(239,65,35,1)_100%)] text-white shadow-md"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    Teams & Rosters ({teams.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("rules")}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      activeTab === "rules"
                        ? "bg-[linear-gradient(180deg,rgba(255,107,0,1)_0%,rgba(239,65,35,1)_100%)] text-white shadow-md"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    Auction & Squad Rules
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 md:p-6">
              {/* TAB 1: TEAMS LIST & MANAGEMENT */}
              {activeTab === "teams" && (
                <div className="space-y-6">
                  {/* Action Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#1a2332] border border-[#2a3441]">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-[#fe6804]" />
                      <span className="text-sm font-semibold text-white">
                        {teams.length} Registered Teams
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[linear-gradient(180deg,rgba(255,107,0,1)_0%,rgba(239,65,35,1)_100%)] hover:opacity-90 text-white text-xs sm:text-sm font-semibold shadow-md"
                      >
                        <Plus className="w-4 h-4" />
                        Add Team
                      </Button>
                    </div>
                  </div>

                  {/* Teams Cards List */}
                  {isLoading ? (
                    <div className="text-center py-12 text-gray-400">Loading teams...</div>
                  ) : teams.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-[#2a3441] rounded-xl space-y-3">
                      <Shield className="w-12 h-12 text-white/30 mx-auto" />
                      <h3 className="text-base font-semibold text-white">No Teams Found</h3>
                      <p className="text-white/60 text-xs max-w-sm mx-auto">
                        There are currently no teams registered in the database. Click below to add your first team.
                      </p>
                      <Button
                        onClick={openAddModal}
                        className="bg-[#fe6804] hover:bg-[#fe6804]/90 text-white rounded-full text-xs font-semibold px-5"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Add Team
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {teams.map((team) => {
                        const isSquadFull = team.playersCount >= rules.maxPlayers;
                        const isOverseasFull = team.overseasCount >= rules.maxOverseas;

                        return (
                          <div
                            key={team.teamId}
                            className="bg-[#1a2332] border border-[#2a3441] hover:border-[#fe6804]/50 rounded-xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-colors"
                          >
                            {/* Left: Logo + Name + Badges */}
                            <div className="flex items-center gap-3.5">
                              {/* Team Logo with dynamic border */}
                              <div
                                className="w-12 h-12 rounded-full overflow-hidden bg-black/40 flex items-center justify-center shrink-0 border-2 shadow-md"
                                style={{ borderColor: team.borderColor || "#fe6804" }}
                              >
                                {team.logoUrl ? (
                                  <img
                                    src={team.logoUrl}
                                    alt={team.teamName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <span className="text-xs font-bold text-white uppercase">
                                    {team.teamName.substring(0, 3)}
                                  </span>
                                )}
                              </div>

                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="[font-family:'Work_Sans',Helvetica] font-bold text-base text-white">
                                    {team.teamName}
                                  </h3>
                                </div>

                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60 mt-1">
                                  <span>Spent: ₹{formatIndianNumber(team.totalSpent)}</span>
                                  <span>
                                    Remaining:{" "}
                                    <strong className="text-white">
                                      ₹{formatIndianNumber(team.fundsRemaining)}
                                    </strong>
                                  </span>
                                  <span
                                    className={isSquadFull ? "text-amber-400 font-semibold" : ""}
                                  >
                                    Players: {team.playersCount} / {rules.maxPlayers}
                                  </span>
                                  <span
                                    className={isOverseasFull ? "text-amber-400 font-semibold" : ""}
                                  >
                                    Overseas: {team.overseasCount} / {rules.maxOverseas}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Right: Budget Editor + Edit/Delete Buttons */}
                            <div className="flex flex-wrap items-center gap-3 self-end lg:self-auto w-full lg:w-auto justify-end">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-white/50 hidden sm:inline">
                                  Starting Budget:
                                </span>
                                <Input
                                  type="number"
                                  value={editingBudgets[team.teamId] || ""}
                                  onChange={(e) =>
                                    setEditingBudgets({
                                      ...editingBudgets,
                                      [team.teamId]: e.target.value,
                                    })
                                  }
                                  className="w-28 sm:w-32 h-8 px-2.5 rounded-lg bg-[#0f1629] border-[#2a3441] text-white text-xs sm:text-sm focus:ring-1 focus:ring-[#fe6804]"
                                />
                                <button
                                  onClick={() => handleSaveBudget(team.teamId)}
                                  title="Save Starting Budget"
                                  className="p-2 rounded-lg bg-[#fe6804]/20 text-[#fe6804] hover:bg-[#fe6804]/30 transition-colors"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="flex items-center gap-1.5 border-l border-[#2a3441] pl-2">
                                <button
                                  onClick={() => openEditModal(team)}
                                  title="Edit Team Name, Logo & Color"
                                  className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTeam(team)}
                                  title="Delete Team"
                                  className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: AUCTION & SQUAD RULES SETUP */}
              {activeTab === "rules" && (
                <form onSubmit={handleSaveRulesSubmit} className="space-y-6 max-w-4xl mx-auto">
                  {/* Banner */}
                  <div className="p-4 rounded-xl bg-[#1a2332] border border-[#2a3441] flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <Sliders className="w-5 h-5 text-[#fe6804]" />
                      <div>
                        <h4 className="text-sm font-bold text-white">Global Auction Regulations</h4>
                        <p className="text-xs text-white/60">
                          These limits govern team roster compositions, bidding increments, and
                          finances.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResetRulesClick}
                        className="text-xs px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/15 hover:border-white/30 transition-all font-semibold active:scale-95"
                      >
                        Reset Defaults
                      </button>
                      <Button
                        type="submit"
                        className="text-xs px-4 h-8 bg-[linear-gradient(180deg,rgba(255,107,0,1)_0%,rgba(239,65,35,1)_100%)] text-white hover:opacity-90 shadow-md font-semibold"
                      >
                        Save Rules
                      </Button>
                    </div>
                  </div>

                  {/* Section 1: Squad Size Limits */}
                  <div className="bg-[#1a2332] border border-[#2a3441] rounded-xl p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-[#2a3441] pb-3">
                      <Users className="w-5 h-5 text-[#00BCD4]" />
                      <h4 className="font-bold text-sm text-white uppercase tracking-wider">
                        Squad Size Limits
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-white/80 mb-1">
                          Max Total Players Team Can Buy
                        </label>
                        <Input
                          type="number"
                          value={rules.maxPlayers}
                          onChange={(e) =>
                            setRules({ ...rules, maxPlayers: parseInt(e.target.value) || 0 })
                          }
                          className="bg-[#0f1629] border-[#2a3441] text-white focus:ring-[#fe6804]"
                        />
                        <p className="text-[11px] text-white/50 mt-1">
                          The maximum roster capacity. Teams cannot purchase more players once
                          reaching this ceiling.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-white/80 mb-1">
                          Min Players Required for Roster
                        </label>
                        <Input
                          type="number"
                          value={rules.minPlayers}
                          onChange={(e) =>
                            setRules({ ...rules, minPlayers: parseInt(e.target.value) || 0 })
                          }
                          className="bg-[#0f1629] border-[#2a3441] text-white focus:ring-[#fe6804]"
                        />
                        <p className="text-[11px] text-white/50 mt-1">
                          Minimum squad size required for a team to be legally eligible.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Player Quotas (Indians vs Overseas) */}
                  <div className="bg-[#1a2332] border border-[#2a3441] rounded-xl p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-[#2a3441] pb-3">
                      <Globe className="w-5 h-5 text-[#fe6804]" />
                      <h4 className="font-bold text-sm text-white uppercase tracking-wider">
                        Composition Quotas (Indians & Overseas)
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-white/80 mb-1">
                          Max Overseas Players in Squad
                        </label>
                        <Input
                          type="number"
                          value={rules.maxOverseas}
                          onChange={(e) =>
                            setRules({ ...rules, maxOverseas: parseInt(e.target.value) || 0 })
                          }
                          className="bg-[#0f1629] border-[#2a3441] text-white focus:ring-[#fe6804]"
                        />
                        <p className="text-[11px] text-white/50 mt-1">
                          Foreign player quota across the entire purchased squad (default: 7 or 8).
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-white/80 mb-1">
                          Min Indian Domestic Players
                        </label>
                        <Input
                          type="number"
                          value={rules.minIndians}
                          onChange={(e) =>
                            setRules({ ...rules, minIndians: parseInt(e.target.value) || 0 })
                          }
                          className="bg-[#0f1629] border-[#2a3441] text-white focus:ring-[#fe6804]"
                        />
                        <p className="text-[11px] text-white/50 mt-1">
                          Minimum required Indian players per franchise roster.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-white/80 mb-1">
                          Max Overseas in Playing XI Match
                        </label>
                        <Input
                          type="number"
                          value={rules.playingXIOverseasLimit}
                          onChange={(e) =>
                            setRules({
                              ...rules,
                              playingXIOverseasLimit: parseInt(e.target.value) || 0,
                            })
                          }
                          className="bg-[#0f1629] border-[#2a3441] text-white focus:ring-[#fe6804]"
                        />
                        <p className="text-[11px] text-white/50 mt-1">
                          Standard IPL rule: Maximum 4 foreign players in the on-field Playing XI.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Financial & Bidding Rules */}
                  <div className="bg-[#1a2332] border border-[#2a3441] rounded-xl p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-[#2a3441] pb-3">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <h4 className="font-bold text-sm text-white uppercase tracking-wider">
                        Financial & Bidding Mechanics
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-white/80 mb-1">
                          Default Starting Budget (₹)
                        </label>
                        <Input
                          type="number"
                          value={rules.startingBudget}
                          onChange={(e) =>
                            setRules({
                              ...rules,
                              startingBudget: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="bg-[#0f1629] border-[#2a3441] text-white focus:ring-[#fe6804]"
                        />
                        <p className="text-[11px] text-white/50 mt-1">
                          ₹{formatIndianNumber(rules.startingBudget)}
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-white/80 mb-1">
                          Default Base Price (₹)
                        </label>
                        <Input
                          type="number"
                          value={rules.defaultBasePrice}
                          onChange={(e) =>
                            setRules({
                              ...rules,
                              defaultBasePrice: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="bg-[#0f1629] border-[#2a3441] text-white focus:ring-[#fe6804]"
                        />
                        <p className="text-[11px] text-white/50 mt-1">
                          ₹{formatIndianNumber(rules.defaultBasePrice)}
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-white/80 mb-1">
                          Bid Increment Amount (₹)
                        </label>
                        <Input
                          type="number"
                          value={rules.bidIncrement}
                          onChange={(e) =>
                            setRules({
                              ...rules,
                              bidIncrement: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="bg-[#0f1629] border-[#2a3441] text-white focus:ring-[#fe6804]"
                        />
                        <p className="text-[11px] text-white/50 mt-1">
                          +₹{formatIndianNumber(rules.bidIncrement)} per auction tap
                        </p>
                      </div>
                    </div>

                    {/* Quick Action: Apply to All Teams */}
                    <div className="pt-3 border-t border-[#2a3441] flex items-center justify-between flex-wrap gap-3">
                      <p className="text-xs text-white/60">
                        Want to synchronize all existing teams to the Default Starting Budget (₹
                        {formatIndianNumber(rules.startingBudget)})?
                      </p>
                      <Button
                        type="button"
                        onClick={handleApplyBudgetToAll}
                        disabled={isSubmitting}
                        className="text-xs rounded-full bg-[#18184a] border border-white/20 text-white hover:bg-[#18184a]/80"
                      >
                        Apply Budget to All Teams
                      </Button>
                    </div>
                  </div>

                  {/* Save Button Bar */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("teams")}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 hover:border-white/30 transition-all font-semibold text-xs active:scale-95"
                    >
                      Back to Teams
                    </button>
                    <Button
                      type="submit"
                      className="px-6 bg-[linear-gradient(180deg,rgba(255,107,0,1)_0%,rgba(239,65,35,1)_100%)] text-white hover:opacity-90 font-bold shadow-lg"
                    >
                      Save Rules & Limits
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ADD / EDIT TEAM MODAL */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-lg max-h-[90vh] bg-[#0f1629] border border-[#1a2332] rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#1a2332] pb-3 shrink-0">
              <h3 className="[font-family:'Work_Sans',Helvetica] font-bold text-base sm:text-lg text-white">
                {editingTeam ? `Edit Team: ${editingTeam.teamName}` : "Add New Franchise"}
              </h3>
              <button
                onClick={() => setShowTeamModal(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeamModal} className="flex-1 overflow-y-auto pr-1 mt-3 space-y-3.5">
              {/* Row 1: Name and Budget side-by-side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Team Name *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Chennai Super Kings"
                    value={teamForm.name}
                    onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                    className="bg-[#1a2332] border-[#2a3441] text-white focus:ring-[#fe6804] h-9 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Starting Budget (₹) *
                  </label>
                  <Input
                    type="number"
                    required
                    value={teamForm.startingBudget}
                    onChange={(e) => setTeamForm({ ...teamForm, startingBudget: e.target.value })}
                    className="bg-[#1a2332] border-[#2a3441] text-white focus:ring-[#fe6804] h-9 text-xs sm:text-sm"
                  />
                </div>
              </div>

              {!editingTeam && (
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Short Code / Slug (optional)
                  </label>
                  <Input
                    placeholder="e.g. csk or auto-generated"
                    value={teamForm.slug}
                    onChange={(e) => setTeamForm({ ...teamForm, slug: e.target.value })}
                    className="bg-[#1a2332] border-[#2a3441] text-white focus:ring-[#fe6804] h-8 text-xs"
                  />
                </div>
              )}

              {/* Logo Selection */}
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  Select Team Logo Image
                </label>
                <div className="grid grid-cols-6 gap-1.5 p-2 rounded-xl bg-[#1a2332] border border-[#2a3441] max-h-24 overflow-y-auto">
                  {PRESET_LOGOS.map((item) => (
                    <button
                      type="button"
                      key={item.path}
                      onClick={() => setTeamForm({ ...teamForm, logoUrl: item.path })}
                      className={`p-1 rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-all ${
                        teamForm.logoUrl === item.path
                          ? "border-[#fe6804] bg-[#fe6804]/20 ring-1 ring-[#fe6804]"
                          : "border-transparent hover:border-white/20"
                      }`}
                    >
                      <img
                        src={item.path}
                        alt={item.label}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-[9px] text-white/70 font-semibold truncate">{item.label}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <Input
                    placeholder="Custom logo image URL or upload..."
                    value={teamForm.logoUrl}
                    onChange={(e) => setTeamForm({ ...teamForm, logoUrl: e.target.value })}
                    className="bg-[#1a2332] border-[#2a3441] text-white text-xs h-8"
                  />
                  <label
                    className={`cursor-pointer px-3 py-1.5 bg-[#1a2332] hover:bg-[#2a3441] border border-[#2a3441] hover:border-[#00BCD4] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shrink-0 transition-colors ${
                      isUploadingLogo ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 text-[#00BCD4]" />
                    {isUploadingLogo ? "..." : "Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingLogo}
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </label>
                </div>
              </div>

              {/* Brand Color Selection */}
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  Brand Color & Border
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-[#1a2332] border border-[#2a3441]">
                  {PRESET_COLORS.map((col) => (
                    <button
                      type="button"
                      key={col.hex}
                      onClick={() => setTeamForm({ ...teamForm, borderColor: col.hex })}
                      className={`w-6 h-6 rounded-full border transition-all ${
                        sanitizeHexColor(teamForm.borderColor).toLowerCase() === col.hex.toLowerCase()
                          ? "scale-110 ring-2 ring-white border-white shadow-md"
                          : "border-white/20 hover:scale-105 opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: col.hex }}
                      title={col.name}
                    />
                  ))}
                </div>

                {/* Interactive Color Picker Tool (Full Area Clickable) */}
                <label className="relative flex items-center justify-between mt-2 p-2.5 rounded-xl bg-[#1a2332] hover:bg-[#202a3a] border border-[#2a3441] hover:border-[#fe6804]/60 transition-all cursor-pointer group shadow-sm">
                  <input
                    type="color"
                    value={sanitizeHexColor(teamForm.borderColor)}
                    onChange={(e) => setTeamForm({ ...teamForm, borderColor: e.target.value })}
                    className="sr-only"
                  />

                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg border border-white/20 shadow-sm transition-transform group-hover:scale-105 shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: sanitizeHexColor(teamForm.borderColor) }}
                    >
                      <Pipette className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-[#fe6804] transition-colors">
                        Pick Custom Color
                      </div>
                      <div className="text-[10px] text-white/50">
                        Click anywhere in box for color palette
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-white/50">Selected:</span>
                    <span
                      className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold text-white border border-white/20 shadow-sm"
                      style={{ backgroundColor: sanitizeHexColor(teamForm.borderColor) }}
                    >
                      {sanitizeHexColor(teamForm.borderColor).toUpperCase()}
                    </span>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#1a2332] shrink-0">
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/15 hover:border-white/30 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[linear-gradient(180deg,rgba(255,107,0,1)_0%,rgba(239,65,35,1)_100%)] text-white font-bold text-xs shadow-md hover:opacity-95 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingTeam ? "Update Team" : "Add Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
