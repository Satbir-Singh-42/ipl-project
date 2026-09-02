import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Plus, Trash2, Edit, Upload, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabaseService } from "@/services/supabaseService";
import type { Player } from "@/services/supabaseService";
import { formatIndianNumber } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { AUCTION_CONFIG } from "@shared/config";

export function AdminPlayers() {
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    country: "India",
    role: "Batsman",
    base_price: AUCTION_CONFIG.defaultBasePrice.toString(),
    eval_points: "0",
    t20_matches: "0",
    image_url: "",
  });

  const loadPlayers = async () => {
    const data = await supabaseService.getPlayers();
    setPlayers(data);
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
      base_price: AUCTION_CONFIG.defaultBasePrice.toString(),
      eval_points: "0",
      t20_matches: "0",
      image_url: "",
    });
    setShowAddForm(false);
    setEditingPlayer(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Player name is required", variant: "destructive" });
      return;
    }

    try {
      if (editingPlayer?.dbId) {
        await supabaseService.updatePlayer(editingPlayer.dbId, {
          name: formData.name,
          age: parseInt(formData.age) || null,
          country: formData.country,
          role: formData.role,
          base_price: parseFloat(formData.base_price) || AUCTION_CONFIG.defaultBasePrice,
          eval_points: parseInt(formData.eval_points) || 0,
          t20_matches: parseInt(formData.t20_matches) || 0,
          image_url: formData.image_url || null,
        });
        toast({ title: `Updated ${formData.name}` });
      } else {
        await supabaseService.addPlayer({
          name: formData.name,
          age: parseInt(formData.age) || null,
          country: formData.country,
          role: formData.role,
          base_price: parseFloat(formData.base_price) || AUCTION_CONFIG.defaultBasePrice,
          eval_points: parseInt(formData.eval_points) || 0,
          t20_matches: parseInt(formData.t20_matches) || 0,
          image_url: formData.image_url || null,
          status: "unsold",
          sold_price: 0,
        });
        toast({ title: `Added ${formData.name}` });
      }

      resetForm();
      await loadPlayers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: message, variant: "destructive" });
    }
  };

  const handleDelete = async (player: Player) => {
    if (!player.dbId) return;
    if (!confirm(`Delete ${player.name}? This cannot be undone.`)) return;

    try {
      await supabaseService.deletePlayer(player.dbId);
      toast({ title: `Deleted ${player.name}` });
      await loadPlayers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: message, variant: "destructive" });
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
      eval_points: player.points?.toString() || "0",
      t20_matches: player.t20Matches?.toString() || "0",
      image_url: player.images || "",
    });
    setShowAddForm(true);
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) {
      toast({ title: "CSV file is empty or has no data rows", variant: "destructive" });
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const nameIdx = headers.findIndex((h) => h.includes("name") || h.includes("player"));
    const roleIdx = headers.findIndex((h) => h.includes("role"));
    const countryIdx = headers.findIndex((h) => h.includes("country") || h.includes("nation"));
    const ageIdx = headers.findIndex((h) => h.includes("age"));
    const priceIdx = headers.findIndex((h) => h.includes("price") || h.includes("base"));
    const pointsIdx = headers.findIndex((h) => h.includes("point") || h.includes("eval"));
    const imageIdx = headers.findIndex((h) => h.includes("image"));
    const matchesIdx = headers.findIndex((h) => h.includes("match") || h.includes("t20"));

    if (nameIdx === -1) {
      toast({ title: "CSV must have a 'Player Name' column", variant: "destructive" });
      return;
    }

    const playerRows = lines.slice(1).map((line) => {
      const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      return {
        name: cols[nameIdx] || "",
        role: cols[roleIdx] || "Batsman",
        country: cols[countryIdx] || "India",
        age: parseInt(cols[ageIdx]) || undefined,
        base_price: parseFloat(cols[priceIdx]?.replace(/[₹,]/g, "")) || AUCTION_CONFIG.defaultBasePrice,
        eval_points: parseInt(cols[pointsIdx]) || 0,
        image_url: cols[imageIdx] || undefined,
        t20_matches: parseInt(cols[matchesIdx]) || 0,
      };
    }).filter((p) => p.name);

    const result = await supabaseService.bulkImportPlayers(playerRows);
    toast({
      title: `Imported ${result.inserted} players${result.errors.length > 0 ? `, ${result.errors.length} errors` : ""}`,
    });
    await loadPlayers();
    e.target.value = "";
  };

  const filteredPlayers = players.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.role.toLowerCase().includes(search.toLowerCase()) ||
      p.nation.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#0f1629] text-white p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <h1 className="text-2xl font-bold">Manage Players</h1>
            <span className="text-white/50 text-sm">({players.length} total)</span>
          </div>
          <div className="flex gap-2">
            <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00bcd4]/20 border border-[#00bcd4]/40 text-[#00bcd4] hover:bg-[#00bcd4]/30 transition-colors text-sm font-semibold cursor-pointer">
              <Upload className="w-4 h-4" />
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#fe6804]/20 border border-[#fe6804]/40 text-[#fe6804] hover:bg-[#fe6804]/30 transition-colors text-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              Add Player
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className="bg-[#18184a]/80 border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                {editingPlayer ? `Edit: ${editingPlayer.name}` : "Add New Player"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <input
                  placeholder="Player Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-2 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#fe6804]/50"
                />
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none"
                >
                  <option value="Batsman">Batsman</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All Rounder">All Rounder</option>
                  <option value="Wicket Keeper">Wicket Keeper</option>
                </select>
                <input
                  placeholder="Country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Age"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Base Price"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Eval Points"
                  value={formData.eval_points}
                  onChange={(e) => setFormData({ ...formData, eval_points: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none"
                />
                <input
                  placeholder="Image URL"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 rounded-lg bg-[#fe6804] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  {editingPlayer ? "Update" : "Add Player"}
                </button>
                <button
                  onClick={resetForm}
                  className="px-6 py-2 rounded-lg bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="search"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#fe6804]/50"
          />
        </div>

        {/* Players Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/50 text-left">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Name</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Nation</th>
                <th className="py-3 px-3">Base Price</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Sold Price</th>
                <th className="py-3 px-3">Team</th>
                <th className="py-3 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player, idx) => (
                <tr
                  key={player.name + idx}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-2.5 px-3 text-white/40">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-semibold text-white">{player.name}</td>
                  <td className="py-2.5 px-3 text-white/70">{player.role}</td>
                  <td className="py-2.5 px-3 text-white/70">{player.nation}</td>
                  <td className="py-2.5 px-3 text-white/70">
                    ₹{formatIndianNumber(player.basePrice)}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        player.status === "sold"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {player.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-white/70">
                    {player.soldPrice > 0
                      ? `₹${formatIndianNumber(player.soldPrice)}`
                      : "-"}
                  </td>
                  <td className="py-2.5 px-3 text-white/70 truncate max-w-[120px]">
                    {player.team || "-"}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(player)}
                        className="p-1.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(player)}
                        className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
