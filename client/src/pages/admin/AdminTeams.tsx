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
  ExternalLink,
  Coins,
  TrendingUp,
  Crown,
  Medal,
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
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  getAuctionRules,
  fetchAuctionRules,
  subscribeToRulesUpdate,
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

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info" | "primary";
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

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
    // Load fresh dynamic rules from Supabase and subscribe
    fetchAuctionRules().then((fresh) => setRules(fresh));
    const unsub = subscribeToRulesUpdate((updated) => setRules(updated));
    return unsub;
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

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name.trim()) {
      toast({ title: "Team name is required", variant: "destructive" });
      return;
    }

    const startingBudgetNum = parseFloat(teamForm.startingBudget) || rules.startingBudget || 10000000;
    const cleanBorder = sanitizeHexColor(teamForm.borderColor);

    setIsSubmitting(true);
    try {
      if (editingTeam) {
        // UPDATE existing team
        const { error } = await supabase
          .from("teams")
          .update({
            name: teamForm.name.trim(),
            logo_url: teamForm.logoUrl,
            border_color: cleanBorder,
            starting_budget: startingBudgetNum,
          })
          .eq("slug", editingTeam.teamId);

        if (error) throw error;
        toast({ title: `Franchise "${teamForm.name}" updated successfully` });
      } else {
        // CREATE new team
        const slug =
          teamForm.slug.trim() ||
          teamForm.name
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");

        const { error } = await supabase.from("teams").insert({
          name: teamForm.name.trim(),
          slug: slug,
          logo_url: teamForm.logoUrl,
          border_color: cleanBorder,
          starting_budget: startingBudgetNum,
        });

        if (error) throw error;
        toast({ title: `Franchise "${teamForm.name}" created successfully` });
      }

      setShowTeamModal(false);
      await loadTeams();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save team";
      toast({ title: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeam = (team: TeamStats) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete franchise",
      description:
        team.playersCount > 0
          ? `This will delete ${team.teamName}.\n\nWarning: ${team.playersCount} players assigned to this franchise will be reset back to the auction pool.`
          : `This will permanently delete ${team.teamName} from the database.`,
      confirmText: "Delete",
      variant: "danger",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
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
      },
    });
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

  const handleApplyBudgetToAll = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Update all team budgets",
      description: `This will update the starting purse of all ${teams.length} franchises to ₹${formatIndianNumber(
        rules.startingBudget
      )}.`,
      confirmText: "Update",
      variant: "primary",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
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
      },
    });
  };

  const handleSaveRulesSubmit = async (e: React.FormEvent) => {
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
    if (rules.enableCaptainMultiplier) {
      if (rules.captainMultiplier <= 0 || rules.viceCaptainMultiplier <= 0) {
        toast({ title: "Multipliers must be greater than zero", variant: "destructive" });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const result = await saveAuctionRules(rules);
      if (result.success) {
        toast({ title: "Auction and squad rules saved and synced to database" });
      } else {
        toast({
          title: "Rules saved locally",
          description: result.error,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetRulesClick = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Reset Rules",
      description: "Reset all auction rules to system defaults?",
      confirmText: "Reset",
      variant: "warning",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        const defaultRules = await resetAuctionRules();
        setRules(defaultRules);
        toast({ title: "Auction rules reset to defaults" });
      },
    });
  };

  return (
    <div className="bg-[#18184a] w-full min-h-screen text-white flex flex-col">
      <AdminHeader activeTab="teams" />

      <ConfirmDialog 
        {...confirmDialog} 
        onClose={() => setConfirmDialog(prev => ({...prev, isOpen: false}))} 
      />

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

                  {/* Teams Cards Grid (Matching IPL Teams Cards) */}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 content-start">
                      {teams.map((team) => {
                        const borderColor =
                          team.borderColor || supabaseService.getTeamBorderColor(team.teamName);
                        const bgGradient =
                          team.bgGradient || supabaseService.getTeamGradient(team.teamName);

                        return (
                          <div
                            key={team.teamId}
                            className={`h-full min-w-0 flex flex-col items-center justify-between gap-4 p-3.5 rounded-3xl overflow-hidden border-2 border-solid ${borderColor} ${bgGradient} shadow-xl hover:ring-2 hover:ring-white/20 transition-all duration-200 relative group`}
                          >
                            {/* Team Logo and Name Header */}
                            <div className="flex flex-col items-center gap-2 pt-1 w-full">
                              <div className="flex w-20 h-20 items-center justify-center rounded-full overflow-hidden border-2 border-white/20 bg-black/40 shadow-inner shrink-0">
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
                                  <span className="text-2xl font-bold text-white uppercase">
                                    {supabaseService.getTeamInitials(team.teamName)}
                                  </span>
                                )}
                              </div>
                              <div className="text-center px-1">
                                <span className="[font-family:'Work_Sans',Helvetica] font-semibold text-white text-sm sm:text-base tracking-[0] leading-5 line-clamp-1">
                                  {team.teamName}
                                </span>
                              </div>
                            </div>

                            {/* Stats Content Box matching IPL Teams exact layout */}
                            <div className="flex flex-col items-start w-full bg-wwwiplt20comblack-3 p-0 flex-1 rounded-2xl overflow-hidden border border-[#ffffff1a]">
                              {/* Funds Remaining */}
                              <div className="flex flex-col items-start pb-3 w-full border-b border-solid border-[#ffffff1a]">
                                <div className="flex flex-col items-center py-2 w-full">
                                  <span className="[font-family:'Work_Sans',Helvetica] font-normal text-wwwiplt-2-0comwhite text-sm text-center tracking-[0] leading-6">
                                    Funds Remaining
                                  </span>
                                </div>
                                <div className="flex flex-col items-center w-full">
                                  <span className="[font-family:'Work_Sans',Helvetica] font-bold text-wwwiplt-2-0comwhite text-lg text-center tracking-[0] leading-7">
                                    ₹{formatIndianNumber(team.fundsRemaining)}
                                  </span>
                                </div>
                              </div>

                              {/* Overseas Players & Total Players */}
                              <div className="flex items-stretch justify-center w-full flex-1">
                                <div className="pr-2 border-r border-solid border-[#ffffff1a] flex flex-col justify-between flex-1">
                                  <div className="flex flex-col items-center py-2 w-full">
                                    <span className="[font-family:'Work_Sans',Helvetica] font-normal text-wwwiplt-2-0comwhite text-sm text-center tracking-[0] leading-6">
                                      Overseas Players
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-center pb-2 w-full">
                                    <span className="[font-family:'Work_Sans',Helvetica] font-bold text-wwwiplt-2-0comwhite text-lg text-center tracking-[0] leading-7">
                                      {team.overseasCount || 0}
                                    </span>
                                  </div>
                                </div>

                                <div className="pl-2 flex flex-col justify-between flex-1">
                                  <div className="flex flex-col items-center py-2 w-full">
                                    <span className="[font-family:'Work_Sans',Helvetica] font-normal text-wwwiplt-2-0comwhite text-sm text-center tracking-[0] leading-6">
                                      Total Players
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-center pb-2 w-full">
                                    <span className="[font-family:'Work_Sans',Helvetica] font-bold text-wwwiplt-2-0comwhite text-lg text-center tracking-[0] leading-7">
                                      {team.playersCount || 0}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Admin Action Controls: Roster and Edit */}
                            <div className="grid grid-cols-2 gap-2 w-full pt-1">
                              <Link
                                href={`/team/${team.teamId}`}
                                title="View Public Roster & Dashboard"
                                className="h-8.5 py-1.5 px-3 rounded-xl bg-black/40 hover:bg-black/60 text-white/90 hover:text-white border border-white/20 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm text-center select-none"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-[#00BCD4] shrink-0" />
                                <span>Roster</span>
                              </Link>
                              <button
                                type="button"
                                onClick={() => openEditModal(team)}
                                title="Edit Franchise Details, Budget & Colors"
                                className="h-8.5 py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white border border-white/20 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm text-center select-none"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-white/80 shrink-0" />
                                <span>Edit</span>
                              </button>
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

                  {/* Section 4: Playing XI Roster Composition Requirements */}
                  <div className="bg-[#1a2332] border border-[#2a3441] rounded-xl p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-[#2a3441] pb-3">
                      <Shield className="w-5 h-5 text-[#00BCD4]" />
                      <h4 className="font-bold text-sm text-white uppercase tracking-wider">
                        Playing XI Composition Rules
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-white/80 mb-1">
                          Total Players in Playing XI
                        </label>
                        <Input
                          type="number"
                          value={rules.playingXITotal}
                          onChange={(e) =>
                            setRules({
                              ...rules,
                              playingXITotal: parseInt(e.target.value) || 0,
                            })
                          }
                          className="bg-[#0f1629] border-[#2a3441] text-white focus:ring-[#fe6804]"
                        />
                        <p className="text-[11px] text-white/50 mt-1">
                          Standard cricket team match lineup (default: 11).
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-white/80 mb-1">
                          Batsmen Range (Min - Max)
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={rules.batsmenMin}
                            onChange={(e) =>
                              setRules({
                                ...rules,
                                batsmenMin: parseInt(e.target.value) || 0,
                              })
                            }
                            className="bg-[#0f1629] border-[#2a3441] text-white focus:ring-[#fe6804]"
                          />
                          <span className="text-white/40 text-xs">to</span>
                          <Input
                            type="number"
                            placeholder="Max"
                            value={rules.batsmenMax}
                            onChange={(e) =>
                              setRules({
                                ...rules,
                                batsmenMax: parseInt(e.target.value) || 0,
                              })
                            }
                            className="bg-[#0f1629] border-[#2a3441] text-white focus:ring-[#fe6804]"
                          />
                        </div>
                        <p className="text-[11px] text-white/50 mt-1">
                          Specialist batsmen required in starting XI (default: 2 to 5).
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-white/80 mb-1">
                          Wicket-Keepers (Min - Max)
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={rules.wkMin}
                            onChange={(e) =>
                              setRules({
                                ...rules,
                                wkMin: parseInt(e.target.value) || 0,
                              })
                            }
                            className="bg-[#0f1629] border-[#2a3441] text-white focus:ring-[#fe6804]"
                          />
                          <span className="text-white/40 text-xs">to</span>
                          <Input
                            type="number"
                            placeholder="Max"
                            value={rules.wkMax}
                            onChange={(e) =>
                              setRules({
                                ...rules,
                                wkMax: parseInt(e.target.value) || 0,
                              })
                            }
                            className="bg-[#0f1629] border-[#2a3441] text-white focus:ring-[#fe6804]"
                          />
                        </div>
                        <p className="text-[11px] text-white/50 mt-1">
                          Designated wicket-keepers required (default: 1 to 3).
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-white/80 mb-1">
                          Min All-Rounders
                        </label>
                        <Input
                          type="number"
                          value={rules.allRoundersMin}
                          onChange={(e) =>
                            setRules({
                              ...rules,
                              allRoundersMin: parseInt(e.target.value) || 0,
                            })
                          }
                          className="bg-[#0f1629] border-[#2a3441] text-white focus:ring-[#fe6804]"
                        />
                        <p className="text-[11px] text-white/50 mt-1">
                          Minimum all-rounders required (default: 1).
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-white/80 mb-1">
                          Min Specialist Bowlers
                        </label>
                        <Input
                          type="number"
                          value={rules.bowlersMin}
                          onChange={(e) =>
                            setRules({
                              ...rules,
                              bowlersMin: parseInt(e.target.value) || 0,
                            })
                          }
                          className="bg-[#0f1629] border-[#2a3441] text-white focus:ring-[#fe6804]"
                        />
                        <p className="text-[11px] text-white/50 mt-1">
                          Minimum bowlers in match lineup (default: 2).
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-white/80 mb-1">
                          Playoff Qualifying Teams
                        </label>
                        <Input
                          type="number"
                          value={rules.teamsQualifying}
                          onChange={(e) =>
                            setRules({
                              ...rules,
                              teamsQualifying: parseInt(e.target.value) || 0,
                            })
                          }
                          className="bg-[#0f1629] border-[#2a3441] text-white focus:ring-[#fe6804]"
                        />
                        <p className="text-[11px] text-white/50 mt-1">
                          Top N teams highlighted for tournament progression (default: 8).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section 5: Captain & Vice-Captain Multipliers */}
                  <div className="bg-[#1a2332] border border-[#2a3441] rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#2a3441] pb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Crown className="w-5 h-5 text-amber-400" />
                        <h4 className="font-bold text-sm text-white uppercase tracking-wider">
                          Captain & Vice-Captain Points Multipliers
                        </h4>
                      </div>

                      {/* Enable/Disable Toggle Switch */}
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <span className="text-xs font-semibold text-white/80">
                          {rules.enableCaptainMultiplier ? "Feature Enabled" : "Feature Disabled"}
                        </span>
                        <div className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rules.enableCaptainMultiplier}
                            onChange={(e) =>
                              setRules({
                                ...rules,
                                enableCaptainMultiplier: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-[#0f1629] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[linear-gradient(180deg,rgba(255,107,0,1)_0%,rgba(239,65,35,1)_100%)] border border-[#2a3441]"></div>
                        </div>
                      </label>
                    </div>

                    <p className="text-xs text-white/60">
                      When enabled, managers can designate a Captain and Vice-Captain in their Playing XI to receive boosted match evaluation points. When disabled, Captain selection buttons, badges, and multipliers are hidden.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div className={rules.enableCaptainMultiplier ? "" : "opacity-40 pointer-events-none"}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Crown className="w-3.5 h-3.5 text-amber-400" />
                          <label className="text-xs font-semibold text-white/80">
                            Captain Point Multiplier (x)
                          </label>
                        </div>
                        <Input
                          type="number"
                          step="0.1"
                          min="1"
                          disabled={!rules.enableCaptainMultiplier}
                          value={rules.captainMultiplier}
                          onChange={(e) =>
                            setRules({
                              ...rules,
                              captainMultiplier: parseFloat(e.target.value) || 1,
                            })
                          }
                          className="bg-[#0f1629] border-[#2a3441] text-white focus:ring-[#fe6804]"
                        />
                        <p className="text-[11px] text-white/50 mt-1">
                          Multiplier applied to Captain evaluation points (standard: 2.0x).
                        </p>
                      </div>

                      <div className={rules.enableCaptainMultiplier ? "" : "opacity-40 pointer-events-none"}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Medal className="w-3.5 h-3.5 text-slate-300" />
                          <label className="text-xs font-semibold text-white/80">
                            Vice-Captain Point Multiplier (x)
                          </label>
                        </div>
                        <Input
                          type="number"
                          step="0.1"
                          min="1"
                          disabled={!rules.enableCaptainMultiplier}
                          value={rules.viceCaptainMultiplier}
                          onChange={(e) =>
                            setRules({
                              ...rules,
                              viceCaptainMultiplier: parseFloat(e.target.value) || 1,
                            })
                          }
                          className="bg-[#0f1629] border-[#2a3441] text-white focus:ring-[#fe6804]"
                        />
                        <p className="text-[11px] text-white/50 mt-1">
                          Multiplier applied to Vice-Captain evaluation points (standard: 1.5x).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section 6: Auction Automation Timers */}
                  <div className="bg-[#1a2332] border border-[#2a3441] rounded-xl p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-[#2a3441] pb-3">
                      <RefreshCw className="w-5 h-5 text-purple-400" />
                      <h4 className="font-bold text-sm text-white uppercase tracking-wider">
                        Live Auction Automation Timers
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-white/80 mb-1">
                          Auto-Advance Delay after Sold/Unsold (ms)
                        </label>
                        <Input
                          type="number"
                          value={rules.autoAdvanceDelayMs}
                          onChange={(e) =>
                            setRules({
                              ...rules,
                              autoAdvanceDelayMs: parseInt(e.target.value) || 0,
                            })
                          }
                          className="bg-[#0f1629] border-[#2a3441] text-white focus:ring-[#fe6804]"
                        />
                        <p className="text-[11px] text-white/50 mt-1">
                          Milliseconds before automatically opening the next player modal (1000ms = 1 sec).
                        </p>
                      </div>
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
                      disabled={isSubmitting}
                      className="px-6 bg-[linear-gradient(180deg,rgba(255,107,0,1)_0%,rgba(239,65,35,1)_100%)] text-white hover:opacity-90 font-bold shadow-lg"
                    >
                      {isSubmitting ? "Saving..." : "Save Rules & Limits"}
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

            <form onSubmit={handleSaveTeam} className="flex-1 overflow-y-auto pr-1 mt-3 space-y-3.5">
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
              <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-[#1a2332] shrink-0">
                {editingTeam ? (
                  <button
                    type="button"
                    onClick={() => {
                      const teamToDelete = editingTeam;
                      setShowTeamModal(false);
                      handleDeleteTeam(teamToDelete);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 font-semibold text-xs border border-red-500/30 hover:border-red-500/50 transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>Delete Franchise</span>
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
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
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
