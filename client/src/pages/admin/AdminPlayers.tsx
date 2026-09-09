import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Plus,
  Trash2,
  Edit,
  Upload,
  Search,
  Download,
  AlertTriangle,
  ChevronDown,
  Check,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabaseService } from "@/services/supabaseService";
import type { Player } from "@/services/supabaseService";
import { formatIndianNumber } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuctionRules } from "@/hooks/useAuctionRules";
import { AdminHeader } from "@/components/AdminHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CustomDropdown } from "@/components/CustomDropdown";
import { queryClient } from "@/lib/queryClient";

const ROLE_OPTIONS = [
  {
    value: "Batsman",
    label: "Batsman",
    desc: "Top order / specialist batter",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  {
    value: "Bowler",
    label: "Bowler",
    desc: "Pace / spin specialist bowler",
    badgeColor: "bg-green-500/20 text-green-300 border-green-500/30",
  },
  {
    value: "All Rounder",
    label: "All Rounder",
    desc: "Dual capability batting & bowling",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
  {
    value: "Wicket Keeper",
    label: "Wicket Keeper",
    desc: "Gloveman & dynamic batsman",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
];

const CardPreviewImage = ({
  src,
  name,
}: {
  src?: string;
  name?: string;
}) => {
  const [hasError, setHasError] = useState(false);
  const trimmedSrc = src?.trim() || "";

  useEffect(() => {
    setHasError(false);
  }, [trimmedSrc]);

  if (!trimmedSrc || hasError) {
    const initial = name && name.trim() ? name.trim().charAt(0).toUpperCase() : "?";
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1e293b] to-[#0f1629] text-white/70 font-bold select-none">
        <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/15 flex items-center justify-center text-2xl font-extrabold shadow-inner text-[#00BCD4]">
          {initial}
        </div>
      </div>
    );
  }

  return (
    <img
      key={trimmedSrc}
      src={trimmedSrc}
      alt={name || "Player Preview"}
      className="w-full h-full object-cover object-top"
      onError={() => setHasError(true)}
    />
  );
};

export function AdminPlayers() {
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    total: number;
    inserted: number;
    errors: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSeedingDefault, setIsSeedingDefault] = useState(false);
  const defaultPlayerCount = supabaseService.getDefaultPlayerCount();

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

  const { rules } = useAuctionRules();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    country: "India",
    role: "Batsman",
    base_price: (rules.defaultBasePrice || 400000).toString(),
    eval_points: "",
    t20_matches: "",
    runs: "",
    batting_sr: "",
    wickets: "",
    economy: "",
    image_url: "",
  });

  const [isClearingUnsold, setIsClearingUnsold] = useState(false);

  const loadPlayers = async () => {
    setIsLoading(true);
    try {
      const data = await supabaseService.getPlayers();
      setPlayers(data);
    } catch (err: unknown) {
      console.error("Failed to load players:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearUnsold = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Reset Unsold to Available",
      description: "Are you sure you want to remove the UNSOLD status from all unauctioned players and make them Available in the pool?",
      confirmText: "Reset to Available",
      variant: "warning",
      onConfirm: async () => {
        setIsClearingUnsold(true);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          const count = await supabaseService.clearAllUnsold();
          toast({
            title: "Unsold Status Cleared",
            description: `${count} players are now marked available in the auction pool.`,
          });
          await loadPlayers();
          queryClient.invalidateQueries({ queryKey: ["players"] });
          queryClient.invalidateQueries({ queryKey: ["unsoldPlayers"] });
          queryClient.invalidateQueries({ queryKey: ["teamStats"] });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Failed to clear unsold status";
          toast({ title: message, variant: "destructive" });
        } finally {
          setIsClearingUnsold(false);
        }
      },
    });
  };

  const handleLoadDefaultPlayers = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Load Default IPL Player Template",
      description: `This will add all ${defaultPlayerCount} default IPL 2025 players from the shared template into this tournament room. Players with the same name already present will be skipped. Images are copied into your storage bucket so the roster stays self-contained.`,
      confirmText: `Load ${defaultPlayerCount} Players`,
      variant: "primary",
      onConfirm: async () => {
        setIsSeedingDefault(true);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          const result = await supabaseService.seedDefaultPlayers();
          const msg =
            result.inserted > 0
              ? `${result.inserted} player${result.inserted > 1 ? "s" : ""} loaded from the default IPL template`
              : "All default players already exist in this room";
          const skipMsg =
            result.skipped > 0 ? ` · ${result.skipped} already present` : "";
          toast({
            title: "Default Player Template Loaded",
            description: `${msg}${skipMsg}`,
          });

          if (result.errors.length > 0) {
            setImportStatus({
              total: result.inserted + result.errors.length,
              inserted: result.inserted,
              errors: result.errors.slice(0, 20),
            });
          }

          await loadPlayers();
          queryClient.invalidateQueries({ queryKey: ["players"] });
          queryClient.invalidateQueries({ queryKey: ["unsoldPlayers"] });
          queryClient.invalidateQueries({ queryKey: ["teamStats"] });
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Failed to load default players";
          toast({ title: message, variant: "destructive" });
        } finally {
          setIsSeedingDefault(false);
        }
      },
    });
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      age: "",
      country: "India",
      role: "Batsman",
      base_price: (rules.defaultBasePrice || 400000).toString(),
      eval_points: "",
      t20_matches: "",
      runs: "",
      batting_sr: "",
      wickets: "",
      economy: "",
      image_url: "",
    });
    setEditingPlayer(null);
    setShowAddForm(false);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Player name is required", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      let finalImageUrl = formData.image_url.trim();
      if (finalImageUrl && (finalImageUrl.startsWith("http://") || finalImageUrl.startsWith("https://"))) {
        finalImageUrl = await supabaseService.uploadImageFromUrl("player-images", finalImageUrl);
      }

      const playerPayload = {
        name: formData.name.trim(),
        age: formData.age ? parseInt(formData.age) : null,
        country: formData.country.trim() || "India",
        role: formData.role,
        base_price: parseFloat(formData.base_price) || rules.defaultBasePrice || 400000,
        eval_points: parseInt(formData.eval_points) || 0,
        t20_matches: parseInt(formData.t20_matches) || 0,
        runs: formData.runs ? parseInt(formData.runs) : null,
        batting_sr: formData.batting_sr ? parseFloat(formData.batting_sr) : null,
        wickets: formData.wickets ? parseInt(formData.wickets) : null,
        economy: formData.economy ? parseFloat(formData.economy) : null,
        image_url: finalImageUrl || null,
      };

      if (editingPlayer && editingPlayer.dbId) {
        await supabaseService.updatePlayer(editingPlayer.dbId, playerPayload);
        toast({ title: `Updated ${formData.name}` });
      } else {
        await supabaseService.addPlayer({
          ...playerPayload,
          status: "pending",
        });
        toast({ title: `Added ${formData.name}` });
      }

      resetForm();
      await loadPlayers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save player";
      toast({ title: message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (player: Player) => {
    if (!player.dbId) return;

    setConfirmDialog({
      isOpen: true,
      title: "Delete Player",
      description: `Are you sure you want to delete ${player.name}? This will remove them permanently from the catalogue and live auction database.`,
      confirmText: "Delete Player",
      variant: "danger",
      onConfirm: async () => {
        try {
          await supabaseService.deletePlayer(player.dbId!);
          toast({ title: `Deleted ${player.name} from database` });
          await loadPlayers();
          queryClient.invalidateQueries({ queryKey: ["players"] });
          queryClient.invalidateQueries({ queryKey: ["unsoldPlayers"] });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Failed to delete player";
          toast({ title: message, variant: "destructive" });
        }
      },
    });
  };

  const handleReturnToAvailable = (player: Player) => {
    setConfirmDialog({
      isOpen: true,
      title: "Return to Available Pool",
      description: `Return ${player.name} to available status? This removes any unsold/sold log history and returns the player to the active auction pool.`,
      confirmText: "Make Available",
      variant: "warning",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          await supabaseService.returnPlayerToAvailable(player.dbId || player.name);
          toast({
            title: "Player Returned to Available",
            description: `${player.name} is now available in the auction pool and logs are synchronized.`,
          });
          await loadPlayers();
          queryClient.invalidateQueries({ queryKey: ["players"] });
          queryClient.invalidateQueries({ queryKey: ["unsoldPlayers"] });
          queryClient.invalidateQueries({ queryKey: ["teamStats"] });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Failed to return player to available";
          toast({ title: message, variant: "destructive" });
        }
      },
    });
  };

  const handlePlayerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const publicUrl = await supabaseService.uploadImage("player-images", file);
      setFormData((prev) => ({ ...prev, image_url: publicUrl }));
      toast({ title: "Player photo uploaded to Storage" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload image";
      toast({ title: message, variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      age: player.age?.toString() || "",
      country: player.nation,
      role: player.role,
      base_price: player.basePrice.toString(),
      eval_points: player.points?.toString() || "",
      t20_matches: player.t20Matches?.toString() || "",
      runs: player.runs?.toString() || "",
      batting_sr: player.battingSr?.toString() || "",
      wickets: player.wickets?.toString() || "",
      economy: player.economy?.toString() || "",
      image_url: player.images || "",
    });
    setShowAddForm(true);
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      "name,role,country,age,t20_matches,runs,batting_sr,wickets,economy,eval_points,base_price,image_url\n" +
      "Virat Kohli,Batsman,India,35,120,4008,137.96,4,8.12,95,20000000,\n" +
      "Jasprit Bumrah,Bowler,India,30,90,62,68.88,145,6.85,98,20000000,\n" +
      "Glenn Maxwell,All Rounder,Australia,35,110,2719,150.40,43,8.25,88,15000000,\n" +
      "Heinrich Klaasen,Wicket Keeper,South Africa,32,85,1520,165.20,0,0,90,15000000,\n" +
      "Rohit Sharma,Batsman,India,37,150,3974,139.97,1,8.00,92,20000000,";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "ipl_players_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "CSV template downloaded matching database schema" });
  };

  const parseCSVLine = (text: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
    return result;
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim());
      if (lines.length < 2) {
        toast({
          title: "CSV file is empty or has no data rows",
          description: "Download the CSV Template to see the expected structure.",
          variant: "destructive",
        });
        return;
      }

      const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
      const nameIdx = headers.findIndex((h) => h.includes("name") || h.includes("player"));
      const roleIdx = headers.findIndex(
        (h) => h.includes("role") || h.includes("specialism") || h.includes("type") || h.includes("cat")
      );
      const countryIdx = headers.findIndex(
        (h) => h.includes("country") || h.includes("nation") || h.includes("nationality")
      );
      const ageIdx = headers.findIndex((h) => h.includes("age"));
      const matchesIdx = headers.findIndex((h) => h.includes("match") || h.includes("t20"));
      const runsIdx = headers.findIndex((h) => h === "runs" || h.includes("run"));
      const srIdx = headers.findIndex((h) => h === "batting_sr" || h.includes("strike") || h === "sr");
      const wicketsIdx = headers.findIndex((h) => h === "wickets" || h.includes("wkt") || h.includes("wick"));
      const econIdx = headers.findIndex((h) => h === "economy" || h.includes("econ") || h === "eco");
      const pointsIdx = headers.findIndex(
        (h) => h.includes("point") || h.includes("eval") || h.includes("rating")
      );
      const priceIdx = headers.findIndex(
        (h) => h.includes("price") || h.includes("base") || h.includes("cost") || h.includes("reserve")
      );
      const imageIdx = headers.findIndex(
        (h) => h.includes("image") || h.includes("photo") || h.includes("img")
      );

      if (nameIdx === -1) {
        toast({
          title: "Missing 'Name' column",
          description:
            "Headers found: " +
            headers.slice(0, 5).join(", ") +
            "... Click 'CSV Template' to download the correct format.",
          variant: "destructive",
        });
        return;
      }

      const playerRows = lines
        .slice(1)
        .map((line) => {
          const cols = parseCSVLine(line);
          const rawPrice = cols[priceIdx] || "";
          const cleanPrice = parseFloat(rawPrice.replace(/[^0-9.]/g, ""));
          const rawRuns = runsIdx !== -1 ? parseInt(cols[runsIdx]) : undefined;
          const rawBattingSr = srIdx !== -1 ? parseFloat(cols[srIdx]) : undefined;
          const rawWickets = wicketsIdx !== -1 ? parseInt(cols[wicketsIdx]) : undefined;
          const rawEconomy = econIdx !== -1 ? parseFloat(cols[econIdx]) : undefined;

          return {
            name: cols[nameIdx] || "",
            role: cols[roleIdx] || "Batsman",
            country: cols[countryIdx] || "India",
            age: parseInt(cols[ageIdx]) || undefined,
            base_price:
              !isNaN(cleanPrice) && cleanPrice > 0
                ? cleanPrice
                : rules.defaultBasePrice || 400000,
            eval_points: parseInt(cols[pointsIdx]) || 0,
            image_url: cols[imageIdx] || undefined,
            t20_matches: parseInt(cols[matchesIdx]) || 0,
            runs: !isNaN(rawRuns as number) ? rawRuns : undefined,
            batting_sr: !isNaN(rawBattingSr as number) ? rawBattingSr : undefined,
            wickets: !isNaN(rawWickets as number) ? rawWickets : undefined,
            economy: !isNaN(rawEconomy as number) ? rawEconomy : undefined,
          };
        })
        .filter((p) => p.name.trim());

      if (playerRows.length === 0) {
        toast({
          title: "No valid player rows found",
          description: "Ensure the CSV contains player names.",
          variant: "destructive",
        });
        return;
      }

      const result = await supabaseService.bulkImportPlayers(playerRows);
      setImportStatus({
        total: playerRows.length,
        inserted: result.inserted,
        errors: result.errors,
      });

      if (result.inserted > 0) {
        toast({
          title: `Imported ${result.inserted} player${result.inserted > 1 ? "s" : ""} successfully`,
        });
      }

      if (result.errors.length > 0) {
        toast({
          title: `${result.errors.length} player(s) could not be imported`,
          description: result.errors[0],
          variant: "destructive",
        });
      }

      await loadPlayers();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to parse CSV file";
      toast({
        title: "CSV Import Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      e.target.value = "";
    }
  };

  const filteredPlayers = players.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.role.toLowerCase().includes(search.toLowerCase()) ||
      p.nation.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="bg-[#18184a] w-full min-h-screen text-white flex flex-col">
      <AdminHeader activeTab="players" />
      <section className="w-full bg-[#18184a] p-2 sm:p-4 md:p-6 py-3 sm:py-5 flex-1">
        <div className="w-full bg-wwwiplt20comconcrete-80 rounded-xl md:rounded-2xl backdrop-blur-[28.09px] p-2.5 sm:p-4 md:p-5">
          {/* Add/Edit Form Modal */}
          {showAddForm && (
            <Card className="w-full bg-[#0f1629] border-[#1a2332] mb-6 shadow-2xl">
              <CardHeader className="p-4 md:p-6 border-b border-[#1a2332] flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-white font-bold [font-family:'Work_Sans',Helvetica]">
                  {editingPlayer ? `Edit: ${editingPlayer.name}` : "Add New Player"}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#00BCD4]/10 text-[#00BCD4] border border-[#00BCD4]/30">
                    Live Preview
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  {/* FORM FIELDS (8 cols on XL) */}
                  <div className="xl:col-span-8 space-y-6">
                    {/* Section 1: Basic Profile */}
                    <div>
                      <div className="flex items-center gap-2 pb-2 mb-3 border-b border-[#1a2332]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#fe6804]" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Basic Player Profile
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="col-span-1 sm:col-span-2">
                          <label className="block text-xs font-semibold text-white/80 mb-1">
                            Player Full Name *
                          </label>
                          <input
                            placeholder="e.g. Virat Kohli"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-[#1a2332] border border-[#2a3441] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#fe6804]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-white/80 mb-1">
                            Role / Specialism *
                          </label>
                          <CustomDropdown
                            value={formData.role}
                            onChange={(val) => setFormData({ ...formData, role: val })}
                            options={ROLE_OPTIONS.map((opt) => ({
                              value: opt.value,
                              label: opt.label,
                              description: opt.desc,
                              badge: opt.label,
                              badgeColor: opt.badgeColor,
                            }))}
                            placeholder="Select role..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-white/80 mb-1">
                            Country / Nationality
                          </label>
                          <input
                            placeholder="e.g. India"
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-[#1a2332] border border-[#2a3441] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#fe6804]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-white/80 mb-1">
                            Age
                          </label>
                          <input
                            type="number"
                            placeholder="e.g. 35"
                            value={formData.age}
                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-[#1a2332] border border-[#2a3441] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#fe6804]"
                          />
                        </div>

                        <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                          <label className="block text-xs font-semibold text-white/80 mb-1">
                            Profile Image URL
                          </label>
                          <div className="flex gap-2 items-center">
                            <input
                              placeholder="https://... or upload a photo"
                              value={formData.image_url}
                              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg bg-[#1a2332] border border-[#2a3441] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#fe6804]"
                            />
                            <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1a2332] hover:bg-[#2a3441] border border-[#2a3441] text-white text-xs font-semibold cursor-pointer shrink-0 transition-colors">
                              <Upload className="w-3.5 h-3.5 text-[#00BCD4]" />
                              {isUploadingImage ? "Uploading..." : "Upload Photo"}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handlePlayerImageUpload}
                                disabled={isUploadingImage}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Auction Pricing & Rating */}
                    <div>
                      <div className="flex items-center gap-2 pb-2 mb-3 border-b border-[#1a2332]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#00BCD4]" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Auction Valuation & Rating
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-white/80 mb-1">
                            Base Reserve Price (₹) *
                          </label>
                          <input
                            type="number"
                            placeholder="e.g. 400000"
                            value={formData.base_price}
                            onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-[#1a2332] border border-[#2a3441] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#fe6804]"
                          />
                          <p className="text-[11px] text-white/50 mt-1">
                            Starting bid: {formData.base_price ? `₹${formatIndianNumber(parseFloat(formData.base_price) || 0)}` : "None"}
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-white/80 mb-1">
                            Evaluation Rating Points (0-100)
                          </label>
                          <input
                            type="number"
                            placeholder="e.g. 85"
                            value={formData.eval_points}
                            onChange={(e) => setFormData({ ...formData, eval_points: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-[#1a2332] border border-[#2a3441] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#fe6804]"
                          />
                          <p className="text-[11px] text-white/50 mt-1">Player skill score</p>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Career T20 Statistics */}
                    <div>
                      <div className="flex items-center gap-2 pb-2 mb-3 border-b border-[#1a2332]">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Career Cricket Statistics (Optional)
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-white/80 mb-1">
                            T20 Matches
                          </label>
                          <input
                            type="number"
                            placeholder="e.g. 115"
                            value={formData.t20_matches}
                            onChange={(e) => setFormData({ ...formData, t20_matches: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-[#1a2332] border border-[#2a3441] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#fe6804]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-white/80 mb-1">
                            Total Runs
                          </label>
                          <input
                            type="number"
                            placeholder="e.g. 4008"
                            value={formData.runs}
                            onChange={(e) => setFormData({ ...formData, runs: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-[#1a2332] border border-[#2a3441] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#fe6804]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-white/80 mb-1">
                            Batting Strike Rate
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 137.96"
                            value={formData.batting_sr}
                            onChange={(e) => setFormData({ ...formData, batting_sr: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-[#1a2332] border border-[#2a3441] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#fe6804]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-white/80 mb-1">
                            Total Wickets
                          </label>
                          <input
                            type="number"
                            placeholder="e.g. 4"
                            value={formData.wickets}
                            onChange={(e) => setFormData({ ...formData, wickets: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-[#1a2332] border border-[#2a3441] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#fe6804]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-white/80 mb-1">
                            Bowling Economy
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 7.45"
                            value={formData.economy}
                            onChange={(e) => setFormData({ ...formData, economy: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-[#1a2332] border border-[#2a3441] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#fe6804]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-[#1a2332]">
                      <button
                        disabled={isSaving}
                        onClick={handleSubmit}
                        className="px-6 py-2 rounded-lg bg-[#fe6804] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                      >
                        {isSaving && <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                        {isSaving ? "Saving..." : editingPlayer ? "Update Player" : "Add Player"}
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/15 hover:border-white/30 transition-all active:scale-95"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  {/* LIVE PREVIEW PANEL (4 cols on XL) */}
                  <div className="xl:col-span-4 border-t xl:border-t-0 xl:border-l border-[#1a2332] pt-6 xl:pt-0 xl:pl-6 flex flex-col items-center">
                    <div className="w-full text-xs font-bold uppercase tracking-wider text-[#fe6804] mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#fe6804]" />
                      Live Auction Card Preview
                    </div>

                    <div className="sticky top-6 w-full max-w-xs rounded-2xl bg-[#141c2e] border border-white/15 overflow-hidden shadow-2xl p-4 space-y-3">
                      {/* Image / Avatar Header */}
                      <div className="relative w-full h-44 rounded-xl bg-gradient-to-br from-[#1e293b] to-[#0b2a7d]/40 overflow-hidden flex items-center justify-center border border-white/10">
                        <CardPreviewImage src={formData.image_url} name={formData.name} />

                        {/* Top-right badges */}
                        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                          {formData.country && formData.country.toLowerCase().trim() !== "india" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white shadow">
                              OVERSEAS
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/20">
                            {formData.role}
                          </span>
                        </div>

                        {/* Age badge bottom left */}
                        {formData.age && (
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/70 text-white/90">
                            Age: {formData.age}
                          </span>
                        )}
                      </div>

                      {/* Name & Origin */}
                      <div>
                        <h3 className="text-base font-bold text-white truncate">
                          {formData.name.trim() || "Player Name"}
                        </h3>
                        <p className="text-xs text-white/60">
                          {formData.country.trim() || "Country"} • {formData.role}
                        </p>
                      </div>

                      {/* Valuation & Rating Block */}
                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[#0f1629] border border-white/10">
                        <div>
                          <div className="text-[10px] font-semibold text-white/50 uppercase">Base Price</div>
                          <div className="text-xs font-bold text-green-400 truncate">
                            ₹{formatIndianNumber(parseFloat(formData.base_price) || rules.defaultBasePrice || 400000)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold text-white/50 uppercase">Rating</div>
                          <div className="text-xs font-bold text-[#00BCD4]">
                            {formData.eval_points ? `${formData.eval_points} / 100` : "Unrated"}
                          </div>
                        </div>
                      </div>

                      {/* Career Stats Pills */}
                      {(formData.t20_matches || formData.runs || formData.wickets || formData.batting_sr || formData.economy) ? (
                        <div className="p-2.5 rounded-xl bg-[#0f1629] border border-white/10 space-y-1.5">
                          <div className="text-[10px] font-bold text-white/50 uppercase">Career Stats</div>
                          <div className="flex flex-wrap gap-1.5 text-[10px]">
                            {formData.t20_matches && (
                              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/80">
                                Matches: <b className="text-white">{formData.t20_matches}</b>
                              </span>
                            )}
                            {formData.runs && (
                              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/80">
                                Runs: <b className="text-white">{formData.runs}</b>
                              </span>
                            )}
                            {formData.batting_sr && (
                              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/80">
                                SR: <b className="text-white">{formData.batting_sr}</b>
                              </span>
                            )}
                            {formData.wickets && (
                              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/80">
                                Wkts: <b className="text-white">{formData.wickets}</b>
                              </span>
                            )}
                            {formData.economy && (
                              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/80">
                                Econ: <b className="text-white">{formData.economy}</b>
                              </span>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="w-full bg-[#0f1629] border-[#1a2332]">
            <CardHeader className="p-3 sm:p-4 md:p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className="text-white text-base sm:text-lg md:text-xl font-bold [font-family:'Work_Sans',Helvetica]">
                  Manage Players ({filteredPlayers.length})
                </CardTitle>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-[#1a2332] hover:bg-[#2a3441] border border-[#2a3441] text-white text-xs font-semibold shadow-md transition-colors"
                    title="Download Sample CSV Template"
                  >
                    <Download className="w-3.5 h-3.5 text-[#00BCD4]" />
                    CSV Template
                  </button>
                  <button
                    onClick={handleLoadDefaultPlayers}
                    disabled={isSeedingDefault}
                    className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[linear-gradient(180deg,rgba(0,188,212,1)_0%,rgba(0,150,170,1)_100%)] text-white hover:opacity-90 shadow-md transition-opacity text-xs font-semibold disabled:opacity-50"
                    title={`Load the shared ${defaultPlayerCount}-player default IPL template into this room`}
                  >
                    {isSeedingDefault ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    {isSeedingDefault ? "Loading..." : `Load Default (${defaultPlayerCount})`}
                  </button>
                  <label className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[linear-gradient(180deg,rgba(255,107,0,1)_0%,rgba(239,65,35,1)_100%)] text-white hover:opacity-90 shadow-md transition-opacity text-xs font-semibold cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    Import CSV
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleCSVUpload}
                    />
                  </label>
                  <button
                    onClick={() => {
                      resetForm();
                      setShowAddForm(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#1a2332] hover:bg-[#2a3441] border border-[#2a3441] text-white text-xs font-semibold shadow-md transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Player
                  </button>
                  <button
                    onClick={handleClearUnsold}
                    disabled={isClearingUnsold}
                    className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-[#1a2332] hover:bg-[#2a3441] border border-[#2a3441] text-white text-xs font-semibold shadow-md transition-colors disabled:opacity-50"
                    title="Remove UNSOLD stamps and mark all unauctioned players as Available in Auction"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isClearingUnsold ? "animate-spin" : ""}`} />
                    Reset to Available
                  </button>
                </div>
              </div>

              {/* Search Box */}
              <div className="mt-3 relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search players by name, role, nation..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 sm:h-10 text-xs sm:text-sm bg-[#1a2332] border-[#2a3441] text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[#fe6804] focus:border-[#fe6804]"
                  />
                </div>
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Import Progress Banner */}
              {isImporting && (
                <div className="mt-3 p-3 sm:p-4 rounded-xl bg-[#1a2332] border border-[#00BCD4] flex items-center gap-3 text-white">
                  <div className="w-5 h-5 rounded-full border-2 border-[#00BCD4] border-t-transparent animate-spin shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-white">Importing Players into Database...</div>
                    <div className="text-xs text-white/60">Parsing records and updating database. Please wait.</div>
                  </div>
                </div>
              )}

              {/* Default Template Loading Progress Banner */}
              {isSeedingDefault && (
                <div className="mt-3 p-3 sm:p-4 rounded-xl bg-[#0b2a7d] border border-[#00BCD4] flex items-center gap-3 text-white animate-in fade-in">
                  <div className="w-5 h-5 rounded-full border-2 border-[#00BCD4] border-t-transparent animate-spin shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-white">
                      Loading Default IPL Player Template...
                    </div>
                    <div className="text-xs text-white/60">
                      Copying player headshots into your storage bucket so the roster is self-contained.
                    </div>
                  </div>
                </div>
              )}

              {/* Import Warning/Status Banner */}
              {importStatus && importStatus.errors.length > 0 && (
                <div className="mt-3 p-3 sm:p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      Import Warnings: {importStatus.inserted} successful, {importStatus.errors.length} failed
                    </span>
                    <button
                      onClick={() => setImportStatus(null)}
                      className="text-white/60 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1">
                    {importStatus.errors.map((err, i) => (
                      <div key={i} className="text-[11px] text-red-300 font-mono">
                        {err}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto scrollbar-hide">
                <div className="max-h-[70vh] overflow-y-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="sticky top-0 bg-[#0a1120] border-b border-[#1a2332] z-10">
                      <tr>
                        <th className="px-3 py-2.5 sm:px-3.5 sm:py-3 text-white font-semibold whitespace-nowrap">Player Name</th>
                        <th className="px-2.5 py-2.5 sm:px-3 sm:py-3 text-white font-semibold whitespace-nowrap">Role</th>
                        <th className="px-2.5 py-2.5 sm:px-3 sm:py-3 text-white font-semibold whitespace-nowrap">Nation</th>
                        <th className="px-2 py-2.5 sm:px-2.5 sm:py-3 text-center text-white font-semibold whitespace-nowrap">Age</th>
                        <th className="px-2.5 py-2.5 sm:px-3 sm:py-3 text-white font-semibold whitespace-nowrap">Base Price</th>
                        <th className="px-2.5 py-2.5 sm:px-3 sm:py-3 text-white font-semibold whitespace-nowrap">Status</th>
                        <th className="px-2.5 py-2.5 sm:px-3 sm:py-3 text-white font-semibold whitespace-nowrap">Sold Price</th>
                        <th className="px-2.5 py-2.5 sm:px-3 sm:py-3 text-white font-semibold whitespace-nowrap">Team</th>
                        <th className="px-2 py-2.5 sm:px-3 sm:py-3 text-center text-white font-semibold whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a2332]">
                      {isLoading ? (
                        <tr>
                          <td colSpan={9} className="text-center py-20">
                            <div className="flex flex-col items-center justify-center gap-3 text-white/70">
                              <div className="w-8 h-8 rounded-full border-2 border-[#fe6804] border-t-transparent animate-spin" />
                              <span className="text-sm font-semibold">Loading players from database...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredPlayers.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center py-12 text-gray-400">
                            No players found
                          </td>
                        </tr>
                      ) : (
                        filteredPlayers.map((player, idx) => (
                          <tr
                            key={player.name + idx}
                            className="hover:bg-[#1a2332]/50 transition-colors"
                          >
                            <td className="px-3 py-2.5 sm:px-3.5 sm:py-3 font-semibold text-white whitespace-nowrap">{player.name}</td>
                            <td className="px-2.5 py-2.5 sm:px-3 sm:py-3 text-white/80 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-white/5 border border-white/10">
                                {player.role}
                              </span>
                            </td>
                            <td className="px-2.5 py-2.5 sm:px-3 sm:py-3 text-white/80 whitespace-nowrap">{player.nation}</td>
                            <td className="px-2 py-2.5 sm:px-2.5 sm:py-3 text-center text-white/80 whitespace-nowrap">{player.age || "-"}</td>
                            <td className="px-2.5 py-2.5 sm:px-3 sm:py-3 text-white/90 font-medium whitespace-nowrap">
                              ₹{formatIndianNumber(player.basePrice)}
                            </td>
                            <td className="px-2.5 py-2.5 sm:px-3 sm:py-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                  player.status === "sold"
                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                    : player.status === "unsold"
                                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                    : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                }`}
                              >
                                {player.status === "sold"
                                  ? "SOLD"
                                  : player.status === "unsold"
                                  ? "UNSOLD"
                                  : "IN AUCTION"}
                              </span>
                            </td>
                            <td className="px-2.5 py-2.5 sm:px-3 sm:py-3 text-white/90 font-medium whitespace-nowrap">
                              {player.soldPrice > 0 ? `₹${formatIndianNumber(player.soldPrice)}` : "-"}
                            </td>
                            <td className="px-2.5 py-2.5 sm:px-3 sm:py-3 text-white/80 truncate max-w-[130px] whitespace-nowrap">
                              {player.team || "-"}
                            </td>
                            <td className="px-2 py-2.5 sm:px-3 sm:py-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                {(player.status === "unsold" || player.status === "sold") && (
                                  <button
                                    onClick={() => handleReturnToAvailable(player)}
                                    className="p-1.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors"
                                    title="Return to Available (Clears Unsold/Sold status & logs)"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleEdit(player)}
                                  className="p-1.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                                  title="Edit player"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(player)}
                                  className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                  title="Delete player"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Custom Confirmation Modal */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
      />
    </div>
  );
}
