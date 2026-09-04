import { useState, useEffect, useRef } from "react";
import { useIPLData } from "@/hooks/useIPLData";
import { supabaseService, type Player, type Pool, type TeamStats } from "@/services/supabaseService";
import confetti from "canvas-confetti";
import {
  Trophy,
  Coins,
  Globe,
  Users,
  TrendingUp,
  RefreshCw,
  Search,
  X,
  Layers,
  Check,
  Shield,
} from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { AUCTION_CONFIG } from "@shared/config";
import { useToast } from "@/hooks/use-toast";
import { LoadingPage } from "@/components/LoadingPage";
import { AdminHeader } from "@/components/AdminHeader";
import { cn, formatIndianNumber } from "@/lib/utils";
import { getTeamLogo, getTeamInitials } from "@/config/teamBranding";

const backgroundImage = "/images/auction/background.png";
const unsoldStampImage = "/images/auction/unsold.png";

function PlayerImage({
  src,
  name,
  className = "",
}: {
  src?: string;
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (failed || !src) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center bg-gray-800 text-white font-bold text-xs sm:text-sm ${className}`}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={`w-full h-full object-cover object-top ${className}`}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export default function AuctionPage() {
  const { players, isLoadingPlayers, refetchPlayers, teamStats, refetchTeams } = useIPLData();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [pools, setPools] = useState<Pool[]>([]);
  const [selectedPoolTab, setSelectedPoolTab] = useState<number | "all">("all");
  const [activeCards, setActiveCards] = useState<Player[]>([]);
  const [soldCards, setSoldCards] = useState<Player[]>([]);
  const [soldFromSheetNames, setSoldFromSheetNames] = useState<Set<string>>(
    new Set(),
  );
  const [unsoldPlayerNames, setUnsoldPlayerNames] = useState<Set<string>>(
    new Set(),
  );
  const [unsoldCount, setUnsoldCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [showUnsoldStamp, setShowUnsoldStamp] = useState(false);
  const [lastAction, setLastAction] = useState<any>(null);
  const [currentBid, setCurrentBid] = useState<number>(0);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const [isSubmittingSold, setIsSubmittingSold] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPageReady, setIsPageReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    supabaseService.getPools().then(setPools).catch(() => {});
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    const img = new Image();
    img.src = backgroundImage;
  }, []);

  useEffect(() => {
    const initAuctionPlayers = async () => {
      if (players && players.length > 0) {
        // Fetch pools and unsold names together so sequencing is immediate
        const [latestPools, actualUnsoldNames] = await Promise.all([
          pools.length > 0 ? Promise.resolve(pools) : supabaseService.getPools().catch(() => []),
          supabaseService.getUnsoldPlayerNames(),
        ]);

        if (pools.length === 0 && latestPools.length > 0) {
          setPools(latestPools);
        }
        setUnsoldPlayerNames(actualUnsoldNames);

        // Build active/sold from fresh data, applying unsold flags
        const active: Player[] = [];
        const sold: Player[] = [];
        const sheetSoldNames = new Set<string>();

        players.forEach((player) => {
          const isMarkedUnsold = actualUnsoldNames.has(player.name) || player.status === "unsold";
          const playerWithUnsold = { ...player, isUnsold: isMarkedUnsold };

          if (player.status === "sold" && (player.soldPrice || 0) > 0) {
            sold.push(playerWithUnsold);
            sheetSoldNames.add(player.name);
          } else {
            active.push(playerWithUnsold);
          }
        });

        // Sort active players strictly according to pool order and auctionOrder
        const activePools = latestPools.length > 0 ? latestPools : pools;
        const poolOrderMap = new Map<number, number>();
        activePools.forEach((p, idx) => poolOrderMap.set(p.id, p.orderIndex ?? idx + 1));

        active.sort((a, b) => {
          const orderA = a.poolId ? poolOrderMap.get(a.poolId) ?? 9999 : 99999;
          const orderB = b.poolId ? poolOrderMap.get(b.poolId) ?? 9999 : 99999;
          if (orderA !== orderB) return orderA - orderB;
          const seqA = a.auctionOrder ?? 0;
          const seqB = b.auctionOrder ?? 0;
          if (seqA !== seqB) return seqA - seqB;
          return (a.dbId ?? 0) - (b.dbId ?? 0);
        });

        setActiveCards(active);
        setSoldCards(sold);
        setSoldFromSheetNames(sheetSoldNames);
        setUnsoldCount(active.filter((p) => p.isUnsold).length);
        setIsPageReady(true);
      }
    };
    initAuctionPlayers();
  }, [players, pools]);

  const filterPlayer = (player: Player, search: string) => {
    return (
      player.name.toLowerCase().includes(search) ||
      player.role.toLowerCase().includes(search) ||
      player.nation.toLowerCase().includes(search) ||
      (player.team && player.team.toLowerCase().includes(search))
    );
  };

  const poolFilteredActiveCards = activeCards.filter((player) => {
    if (selectedPoolTab === "all") return true;
    return player.poolId === selectedPoolTab;
  });

  const filteredCards = poolFilteredActiveCards.filter((player) =>
    filterPlayer(player, searchTerm.toLowerCase()),
  );

  const filteredSoldCards = soldCards.filter((player) =>
    filterPlayer(player, searchTerm.toLowerCase()),
  );

  const openViewer = (player: Player) => {
    setCurrentPlayer(player);
    setViewerOpen(true);
    setShowUnsoldStamp(false);
    setCurrentBid(player.basePrice || 0);
    setSelectedTeam(player.team && player.team !== "N/A" ? player.team : null);
    setShowTeamSelection(false);
    document.body.style.overflow = "hidden";
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setCurrentPlayer(null);
    setShowUnsoldStamp(false);
    setCurrentBid(0);
    setSelectedTeam(null);
    setShowTeamSelection(false);
    document.body.style.overflow = "auto";
  };

  const markSold = async () => {
    if (!currentPlayer || !canvasRef.current || isSubmittingSold) return;

    if (!selectedTeam) {
      toast({
        title: "Select Winning Team",
        description: "Please select an IPL team badge below before marking the player as sold.",
        variant: "destructive",
      });
      return;
    }

    const finalPrice = currentBid > 0 ? currentBid : (currentPlayer.basePrice || 0);

    setIsSubmittingSold(true);

    const myConfetti = confetti.create(canvasRef.current, {
      resize: true,
      useWorker: true,
    });

    myConfetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#28a745", "#ffd700", "#ff6b6b", "#4ecdc4", "#45b7d1"],
    });

    setTimeout(() => {
      myConfetti({
        particleCount: 100,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      myConfetti({
        particleCount: 100,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
    }, 200);

    const currentIndex = activeCards.findIndex(
      (p) => p.name === currentPlayer.name,
    );
    const soldPlayer: Player = {
      ...currentPlayer,
      team: selectedTeam,
      soldPrice: finalPrice,
      status: "sold",
      isUnsold: false,
    };
    const newActive = activeCards.filter((p) => p.name !== currentPlayer.name);
    const newSold = [...soldCards, soldPlayer];

    // Remove player from unsold Set if they were marked unsold
    if (currentPlayer.isUnsold) {
      const newUnsoldNames = new Set(unsoldPlayerNames);
      newUnsoldNames.delete(currentPlayer.name);
      setUnsoldPlayerNames(newUnsoldNames);
      setUnsoldCount((prev) => Math.max(0, prev - 1));
    }

    setLastAction({
      type: "sold",
      player: currentPlayer,
      activeIndex: currentIndex,
      wasUnsold: currentPlayer.isUnsold || false,
    });

    setActiveCards(newActive);
    setSoldCards(newSold);
    setCurrentPlayer(soldPlayer);

    // Save to Supabase database
    try {
      await supabaseService.markPlayerSold(
        currentPlayer.name,
        selectedTeam,
        finalPrice,
      );
      refetchTeams();
      refetchPlayers();
    } catch (err) {
      console.error("Failed to mark player sold in Supabase:", err);
      toast({
        title: "Database Sync Warning",
        description: "Sold locally, but failed to sync to database.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingSold(false);
    }

    setTimeout(() => {
      setIsTransitioning(true);

      setTimeout(() => {
        if (currentIndex < newActive.length) {
          const nextPlayer = newActive[currentIndex];
          setCurrentPlayer(nextPlayer);
          setCurrentBid(nextPlayer.basePrice || 0);
          setSelectedTeam(null);
          setShowTeamSelection(false);
        } else if (newActive.length > 0) {
          const nextPlayer = newActive[0];
          setCurrentPlayer(nextPlayer);
          setCurrentBid(nextPlayer.basePrice || 0);
          setSelectedTeam(null);
          setShowTeamSelection(false);
        } else {
          closeViewer();
        }

        setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
      }, 1000);
    }, 1000);
  };

  const markUnsold = () => {
    if (!currentPlayer) return;

    setShowUnsoldStamp(true);

    // Record in database auction log
    supabaseService.markPlayerUnsold(currentPlayer.name).catch((err) => {
      console.error("Failed to mark player unsold:", err);
    });

    // Add player to unsold Set
    const newUnsoldNames = new Set(unsoldPlayerNames);
    newUnsoldNames.add(currentPlayer.name);
    setUnsoldPlayerNames(newUnsoldNames);
    setUnsoldCount((prev) => prev + 1);

    const currentIndex = activeCards.findIndex(
      (p) => p.name === currentPlayer.name,
    );

    setLastAction({
      type: "unsold",
      player: currentPlayer,
      activeIndex: currentIndex,
      previousUnsoldCount: unsoldCount,
    });

    setTimeout(() => {
      setShowUnsoldStamp(false);
      setIsTransitioning(true);

      setTimeout(() => {
        const newActive = activeCards.map((p) =>
          p.name === currentPlayer.name ? { ...p, isUnsold: true } : p,
        );
        setActiveCards(newActive);

        const nonUnsoldPlayers = newActive.filter((p) => !p.isUnsold);
        if (currentIndex < newActive.length && nonUnsoldPlayers.length > 0) {
          const nextPlayer =
            newActive.slice(currentIndex + 1).find((p) => !p.isUnsold) ||
            nonUnsoldPlayers[0];
          setCurrentPlayer(nextPlayer);
          setCurrentBid(0);
        } else if (nonUnsoldPlayers.length > 0) {
          const nextPlayer = nonUnsoldPlayers[0];
          setCurrentPlayer(nextPlayer);
          setCurrentBid(0);
        } else {
          closeViewer();
        }

        setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
      }, 1000);
    }, 1000);
  };

  const restorePlayer = (player: Player, e: React.MouseEvent) => {
    e.stopPropagation();

    if (soldFromSheetNames.has(player.name)) {
      return;
    }

    const newSold = soldCards.filter((p) => p.name !== player.name);
    const newActive = [...activeCards];

    // Mark player as unsold when restoring
    const newUnsoldNames = new Set(unsoldPlayerNames);
    newUnsoldNames.add(player.name);
    setUnsoldPlayerNames(newUnsoldNames);

    const restoredPlayer = { ...player, isUnsold: true, soldPrice: 0 };

    const originalIndex = player.originalIndex ?? activeCards.length;
    const insertIndex = newActive.findIndex(
      (p) => (p.originalIndex ?? 0) > originalIndex,
    );

    if (insertIndex === -1) {
      newActive.push(restoredPlayer);
    } else {
      newActive.splice(insertIndex, 0, restoredPlayer);
    }

    setSoldCards(newSold);
    setActiveCards(newActive);
    setUnsoldCount((prev) => prev + 1);
  };

  const quickUndo = () => {
    if (!lastAction) return;

    if (lastAction.type === "sold") {
      const newSold = soldCards.filter(
        (p) => p.name !== lastAction.player.name,
      );
      const newActive = [...activeCards];
      newActive.splice(lastAction.activeIndex, 0, lastAction.player);
      setSoldCards(newSold);
      setActiveCards(newActive);
      if (lastAction.wasUnsold) {
        // Re-add player to unsold Set
        const newUnsoldNames = new Set(unsoldPlayerNames);
        newUnsoldNames.add(lastAction.player.name);
        setUnsoldPlayerNames(newUnsoldNames);
        setUnsoldCount((prev) => prev + 1);
      }
      setCurrentPlayer(lastAction.player);
      setCurrentBid(0);
      setViewerOpen(true);
    } else if (lastAction.type === "unsold") {
      // Remove player from unsold Set
      const newUnsoldNames = new Set(unsoldPlayerNames);
      newUnsoldNames.delete(lastAction.player.name);
      setUnsoldPlayerNames(newUnsoldNames);

      const newActive = activeCards.map((p) =>
        p.name === lastAction.player.name ? { ...p, isUnsold: false } : p,
      );
      setActiveCards(newActive);
      setUnsoldCount(lastAction.previousUnsoldCount);
      setCurrentPlayer(lastAction.player);
      setCurrentBid(0);
      setViewerOpen(true);
    }
    setLastAction(null);
  };

  const navigatePlayer = (direction: "prev" | "next") => {
    if (!currentPlayer) return;

    const nonUnsoldPlayers = activeCards.filter((p) => !p.isUnsold);
    let currentIndex = nonUnsoldPlayers.findIndex(
      (p) => p.name === currentPlayer.name,
    );

    // If current player is not in nonUnsoldPlayers (e.g., just marked as unsold),
    // find their position in the full activeCards list and navigate from there
    if (currentIndex === -1) {
      const fullListIndex = activeCards.findIndex(
        (p) => p.name === currentPlayer.name,
      );
      if (fullListIndex !== -1) {
        // Find the next/prev non-unsold player from the current position
        if (direction === "next") {
          const nextPlayer =
            activeCards.slice(fullListIndex + 1).find((p) => !p.isUnsold) ||
            nonUnsoldPlayers[0];
          if (nextPlayer) {
            setCurrentPlayer(nextPlayer);
            setCurrentBid(nextPlayer.basePrice || 0);
            setSelectedTeam(null);
            setShowTeamSelection(false);
            setShowUnsoldStamp(false);
          }
          return;
        } else {
          const prevPlayer =
            activeCards
              .slice(0, fullListIndex)
              .reverse()
              .find((p) => !p.isUnsold) ||
            nonUnsoldPlayers[nonUnsoldPlayers.length - 1];
          if (prevPlayer) {
            setCurrentPlayer(prevPlayer);
            setCurrentBid(prevPlayer.basePrice || 0);
            setSelectedTeam(null);
            setShowTeamSelection(false);
            setShowUnsoldStamp(false);
          }
          return;
        }
      }
      return;
    }

    let nextPlayer: Player | null = null;

    if (direction === "next" && currentIndex < nonUnsoldPlayers.length - 1) {
      nextPlayer = nonUnsoldPlayers[currentIndex + 1];
    } else if (direction === "prev" && currentIndex > 0) {
      nextPlayer = nonUnsoldPlayers[currentIndex - 1];
    }

    if (!nextPlayer) return;

    setCurrentPlayer(nextPlayer);
    setCurrentBid(nextPlayer.basePrice || 0);
    setSelectedTeam(null);
    setShowTeamSelection(false);
    setShowUnsoldStamp(false);
  };

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      navigatePlayer("next");
    } else if (isRightSwipe) {
      navigatePlayer("prev");
    }
  };

  const syncSoldPlayersFromSheet = async () => {
    if (isSyncing) return;

    setIsSyncing(true);

    try {
      const { data: freshPlayers } = await refetchPlayers();

      if (freshPlayers && freshPlayers.length > 0) {
        // Build active/sold from fresh sheet data, applying unsold flags from Set
        const active: Player[] = [];
        const sold: Player[] = [];
        const sheetSoldNames = new Set<string>();

        freshPlayers.forEach((player) => {
          const isMarkedUnsold = unsoldPlayerNames.has(player.name);
          const playerWithUnsold = { ...player, isUnsold: isMarkedUnsold };

          if (player.status === "sold") {
            sold.push(playerWithUnsold);
            sheetSoldNames.add(player.name);
          } else {
            active.push(playerWithUnsold);
          }
        });

        // Log sync results

        setActiveCards(active);
        setSoldCards(sold);
        setSoldFromSheetNames(sheetSoldNames);
        setUnsoldCount(active.filter((p) => p.isUnsold).length);

        // Update current player if viewing one
        if (currentPlayer) {
          const updatedPlayer = freshPlayers.find(
            (p) => p.name === currentPlayer.name,
          );
          if (updatedPlayer) {
            setCurrentPlayer({
              ...updatedPlayer,
              isUnsold: unsoldPlayerNames.has(updatedPlayer.name),
            });
          }
        }
      }

      setIsSyncing(false);
    } catch (error) {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const syncInterval = setInterval(() => {
      syncSoldPlayersFromSheet();
    }, 30000);

    return () => clearInterval(syncInterval);
  }, [players, soldCards]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isTyping) {
        return;
      }

      const key = e.key.toLowerCase();

      if (key === "r") {
        e.preventDefault();
        quickUndo();
        return;
      }

      if (key === "z") {
        e.preventDefault();
        syncSoldPlayersFromSheet();
        return;
      }

      if (
        viewerOpen &&
        currentPlayer &&
        !soldCards.some((p) => p.name === currentPlayer.name)
      ) {
        if (key === "s") {
          e.preventDefault();
          markSold();
          return;
        }

        if (key === "u") {
          e.preventDefault();
          markUnsold();
          return;
        }

        if (key === "escape") {
          e.preventDefault();
          closeViewer();
          return;
        }

        if (key === "arrowleft") {
          e.preventDefault();
          navigatePlayer("prev");
          return;
        }

        if (key === "arrowright") {
          e.preventDefault();
          navigatePlayer("next");
          return;
        }

        if (e.key.length === 1 || ["enter", "space"].includes(key)) {
          e.preventDefault();
          setCurrentBid((prev) =>
            prev === 0
              ? Number(currentPlayer.basePrice) || 0
              : prev + AUCTION_CONFIG.bidIncrement,
          );
        }
      } else if (viewerOpen && key === "escape") {
        e.preventDefault();
        closeViewer();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    viewerOpen,
    currentPlayer,
    activeCards,
    soldCards,
    unsoldCount,
    currentBid,
  ]);

  if (isLoadingPlayers || !players) {
    return <LoadingPage />;
  }

  if (players.length === 0) {
    return (
      <div className="bg-[#18184a] w-full min-h-screen text-white flex flex-col">
        <AdminHeader activeTab="auction" title="Player Auction" />
        <section className="w-full flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
          <div className="w-full max-w-2xl bg-wwwiplt20comconcrete-80 rounded-[16px] md:rounded-[22.47px] backdrop-blur-[28.09px] p-6 sm:p-10 shadow-2xl text-center space-y-5 border border-white/10">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#fe6804]/15 border border-[#fe6804]/40 flex items-center justify-center">
              <Users className="w-8 h-8 text-[#fe6804]" />
            </div>
            <h2 className="[font-family:'Work_Sans',Helvetica] text-2xl sm:text-3xl font-bold text-[#18184a]">
              No Players in Auction
            </h2>
            <p className="text-[#18184a]/75 text-sm sm:text-base max-w-md mx-auto">
              There are currently no players in the catalogue database. You can add players manually or bulk import via CSV from the Admin Panel to begin the auction.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-3">
              <button
                onClick={() => setLocation("/admin/players")}
                className="px-5 py-2.5 rounded-full bg-[linear-gradient(180deg,rgba(255,107,0,1)_0%,rgba(239,65,35,1)_100%)] text-white text-sm font-bold shadow-lg hover:opacity-95 transition-opacity"
              >
                Manage Players (Upload CSV)
              </button>
              <button
                onClick={() => setLocation("/admin")}
                className="px-5 py-2.5 rounded-full bg-[#18184a] text-white text-sm font-bold shadow-md hover:bg-[#18184a]/90 transition-colors"
              >
                Admin Dashboard
              </button>
              <button
                onClick={() => setLocation("/")}
                className="px-5 py-2.5 rounded-full bg-white text-[#18184a] border border-[#18184a]/20 text-sm font-bold shadow-sm hover:bg-slate-100 transition-colors"
              >
                Public View
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const SoldPlayerCard = ({
    player,
    onClick,
  }: {
    player: Player;
    onClick: () => void;
  }) => (
    <motion.div
      onClick={onClick}
      className="backdrop-blur-md bg-white/10 rounded-xl overflow-hidden shadow-lg border border-white/20 cursor-pointer"
      data-testid={`card-sold-${player.originalIndex}`}
      whileHover={{
        opacity: 1,
        scale: 1.05,
        y: -8,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.98 }}>
      <div className="relative w-full h-32 bg-gradient-to-br from-purple-900/30 to-blue-900/30">
        <PlayerImage
          src={player.images}
          name={player.name}
          className="opacity-70"
        />
      </div>

      <div className="p-2.5 space-y-1.5">
        <h3 className="text-sm font-bold text-white truncate">{player.name}</h3>

        <div className="text-xs text-white/70 truncate">
          {player.role || "N/A"} • {player.nation || "N/A"}
        </div>

        <div className="bg-green-500/20 backdrop-blur-sm border border-green-400/50 rounded px-2 py-1 text-center">
          <div className="text-green-300 font-bold text-xs">SOLD</div>
          <div className="text-white font-bold text-sm">
            ₹
            {player.soldPrice > 0
              ? formatIndianNumber(player.soldPrice)
              : "N/A"}
          </div>
        </div>

        {player.team && player.team !== "N/A" && (
          <div className="text-center py-1 bg-blue-500/20 backdrop-blur-sm border border-blue-400/50 rounded text-white text-xs font-semibold truncate">
            {player.team}
          </div>
        )}
      </div>
    </motion.div>
  );

  const PlayerCard = ({ player }: { player: Player }) => (
    <motion.div
      className="backdrop-blur-md bg-white/10 rounded-xl overflow-hidden shadow-lg border border-white/20 cursor-pointer relative"
      data-testid={`card-player-${player.originalIndex}`}
      whileHover={{
        scale: 1.05,
        y: -8,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.98 }}>
      <div className="relative w-full h-32 bg-gradient-to-br from-purple-900/30 to-blue-900/30">
        <PlayerImage src={player.images} name={player.name} />
        {player.isUnsold && (
          <img
            src={unsoldStampImage}
            alt="UNSOLD"
            className="absolute top-1 right-1 w-12 h-12 object-contain"
          />
        )}
        {player.overseas && !player.isUnsold && (
          <div className="absolute top-1 right-1 bg-blue-500/90 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-xs font-semibold flex items-center gap-0.5">
            <Globe className="w-2.5 h-2.5" />
            <span className="hidden sm:inline">OVERSEAS</span>
          </div>
        )}
      </div>

      <div className="p-2.5 space-y-1.5">
        <h3 className="text-sm font-bold text-white truncate">{player.name}</h3>

        <div className="text-xs text-white/70 truncate">
          {player.role || "N/A"} • {player.nation || "N/A"}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen text-white font-['Segoe_UI',sans-serif] relative">
      <div
        className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          zIndex: 0,
        }}
      />
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        style={{ zIndex: 1 }}></div>

      <motion.div
        className="relative z-10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: isPageReady ? 0 : 20, opacity: isPageReady ? 1 : 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}>
        <AdminHeader activeTab="auction" title="Player Auction">
          <div className="space-y-2 py-1">
            {/* Line 1: Player Dashboard and stats in the same line */}
            <div className="flex items-center justify-between gap-4">
              <h2 className="[font-family:'Work_Sans',Helvetica] font-bold text-base sm:text-lg md:text-xl text-white tracking-wide whitespace-nowrap">
                Player Dashboard
              </h2>

              <div
                className="flex items-center backdrop-blur-xl bg-black/40 px-3 py-1 rounded-full shadow-md border border-white/15 text-xs sm:text-sm font-semibold whitespace-nowrap"
                data-testid="stats-counter"
              >
                <span className="text-green-400 font-bold">
                  POOL: <span data-testid="active-count">{activeCards.length}</span>
                </span>
                <span className="text-white/30 mx-2">•</span>
                <span className="text-[#00BCD4] font-bold">
                  SOLD: <span data-testid="sold-count">{soldCards.length}</span>
                </span>
                <span className="text-white/30 mx-2">•</span>
                <span className="text-red-400 font-bold">
                  UNSOLD: <span data-testid="unsold-count">{unsoldCount}</span>
                </span>
              </div>
            </div>

            {/* Line 2: Search bar below taking the whole line */}
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                <Search className="w-4 h-4 text-[#00BCD4]" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search players..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-white/20 text-xs sm:text-sm backdrop-blur-md bg-black/40 text-white placeholder-white/50 block focus:outline-none focus:ring-2 focus:ring-[#00BCD4]/60 focus:border-[#00BCD4] transition-all shadow-inner"
                data-testid="input-search"
              />
            </div>
          </div>
        </AdminHeader>

        <main className="p-3 sm:p-5 space-y-6 sm:space-y-8 pb-20">
          <section>
            <motion.h2
              className="text-lg sm:text-xl mb-3 sm:mb-4 font-bold text-white drop-shadow-lg"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}>
              Players in Auction
            </motion.h2>

            {/* Set / Pool Tabs Filter */}
            {pools.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPoolTab("all")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    selectedPoolTab === "all"
                      ? "bg-[#fe6804] text-white shadow-md ring-2 ring-[#fe6804]"
                      : "bg-black/40 border border-white/20 text-white/80 hover:text-white hover:bg-black/60"
                  }`}
                >
                  All Sets ({activeCards.length})
                </button>
                {pools.map((p) => {
                  const countInPool = activeCards.filter((c) => c.poolId === p.id).length;
                  const isSelected = selectedPoolTab === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPoolTab(p.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-[#00BCD4] text-black shadow-md ring-2 ring-[#00BCD4]"
                          : "bg-black/40 border border-white/20 text-white/80 hover:text-white hover:bg-black/60"
                      }`}
                    >
                      <span>{p.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isSelected ? "bg-black/20 text-black" : "bg-white/20 text-white"
                        }`}
                      >
                        {countInPool}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3"
              initial="hidden"
              animate={isPageReady ? "visible" : "hidden"}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.08,
                    delayChildren: 0.2,
                  },
                },
              }}>
              {filteredCards.map((player, index) => (
                <motion.div
                  key={player.name}
                  onClick={() => openViewer(player)}
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.9 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: { duration: 0.4, ease: "easeOut" },
                    },
                  }}>
                  <PlayerCard player={player} />
                </motion.div>
              ))}
            </motion.div>
            {filteredCards.length === 0 && (
              <motion.div
                className="text-center py-12 text-white/60"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}>
                <Users className="w-16 h-16 mx-auto mb-4 opacity-40" />
                <p className="text-lg">No players in auction</p>
              </motion.div>
            )}
          </section>

          {filteredSoldCards.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}>
              <motion.h2
                className="text-lg sm:text-xl mb-3 sm:mb-4 font-bold text-white drop-shadow-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}>
                Sold Players
              </motion.h2>
              <motion.div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3"
                initial="hidden"
                animate={isPageReady ? "visible" : "hidden"}
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.08,
                      delayChildren: 0.2,
                    },
                  },
                }}>
                {filteredSoldCards.map((player, idx) => (
                  <motion.div
                    key={player.name}
                    className="relative"
                    variants={{
                      hidden: { opacity: 0, y: 20, scale: 0.9 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: { duration: 0.4, ease: "easeOut" },
                      },
                    }}>
                    <SoldPlayerCard
                      player={player}
                      onClick={() => openViewer(player)}
                    />
                    {!soldFromSheetNames.has(player.name) && (
                      <motion.button
                        onClick={(e) => restorePlayer(player, e)}
                        className="mt-1.5 w-full px-2 py-1.5 text-xs backdrop-blur-md bg-blue-600/80 text-white border border-white/30 rounded-lg cursor-pointer font-semibold shadow-lg"
                        data-testid={`button-restore-${idx}`}
                        whileHover={{
                          scale: 1.05,
                          backgroundColor: "rgba(29, 78, 216, 0.9)",
                          transition: { duration: 0.2 },
                        }}
                        whileTap={{ scale: 0.95 }}>
                        Restore to Active
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </motion.section>
          )}
        </main>

        <AnimatePresence>
          {viewerOpen && currentPlayer && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-[1000] p-3 md:p-4"
              style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center center",
              }}
              data-testid="viewer-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}>
              <motion.div
                className="absolute inset-0 bg-black/40 backdrop-blur-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}></motion.div>

              <canvas
                ref={canvasRef}
                className="fixed top-0 left-0 w-full h-full pointer-events-none z-[9999]"
              />

              <AnimatePresence>
                {showUnsoldStamp && (
                  <motion.img
                    src={unsoldStampImage}
                    alt="UNSOLD"
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 object-contain z-[9998] pointer-events-none"
                    initial={{
                      opacity: 0,
                      scale: 0,
                      rotate: -45,
                      x: "-50%",
                      y: "-50%",
                    }}
                    animate={{
                      opacity: 0.9,
                      scale: 1,
                      rotate: -5,
                      x: "-50%",
                      y: "-50%",
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.8,
                      x: "-50%",
                      y: "-50%",
                    }}
                    transition={{
                      duration: 0.6,
                      ease: [0.34, 1.56, 0.64, 1],
                    }}
                  />
                )}
              </AnimatePresence>

              <motion.div
                className="relative max-w-4xl w-full backdrop-blur-xl bg-white/5 rounded-2xl overflow-hidden shadow-2xl border border-white/30 z-[1001] max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{
                  scale: isTransitioning ? 0.95 : 1,
                  opacity: isTransitioning ? 0.3 : 1,
                  y: 0,
                }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}>
                <div className="grid md:grid-cols-2 gap-4 md:gap-6 p-4 md:p-6">
                  <div className="relative">
                    {currentPlayer.images ? (
                      <img
                        src={currentPlayer.images}
                        alt={currentPlayer.name}
                        className="w-full h-auto max-h-[35vh] md:max-h-[60vh] object-contain rounded-xl shadow-2xl"
                        data-testid="viewer-image"
                      />
                    ) : (
                      <div className="w-full h-48 md:h-80 bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-md rounded-xl flex items-center justify-center text-5xl md:text-7xl font-bold text-white border border-white/20">
                        {currentPlayer.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 md:space-y-4">
                    <div>
                      <h2
                        className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2 drop-shadow-lg"
                        data-testid="viewer-name">
                        {currentPlayer.name}
                      </h2>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-sm md:text-lg text-white/90">
                          {currentPlayer.nation} - {currentPlayer.role}
                        </p>
                        {currentPlayer.overseas && (
                          <div className="inline-flex items-center gap-1 bg-blue-500/80 backdrop-blur-sm text-white px-2 py-0.5 rounded text-xs font-semibold">
                            <Globe className="w-3 h-3" />
                            <span className="hidden md:inline">OVERSEAS</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {!showTeamSelection && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="backdrop-blur-md bg-white/10 rounded-lg p-2 border border-white/20">
                          <div className="text-white/80 text-xs mb-0.5">Age</div>
                          <div
                            className="text-white text-base md:text-lg font-semibold"
                            data-testid="viewer-age">
                            {currentPlayer.age || "N/A"}
                          </div>
                        </div>
                        <div className="backdrop-blur-md bg-white/10 rounded-lg p-2 border border-white/20">
                          <div className="text-white/80 text-xs mb-0.5">
                            T20 Matches
                          </div>
                          <div
                            className="text-white text-base md:text-lg font-semibold"
                            data-testid="viewer-t20">
                            {currentPlayer.t20Matches || 0}
                          </div>
                        </div>
                        <div className="backdrop-blur-md bg-white/10 rounded-lg p-2 border border-white/20">
                          <div className="text-white/80 text-xs mb-0.5 flex items-center gap-1">
                            <Coins className="w-3 h-3" />
                            Base Price
                          </div>
                          <div
                            className="text-white text-base md:text-lg font-bold"
                            data-testid="viewer-base-price">
                            ₹{formatIndianNumber(currentPlayer.basePrice || 0)}
                          </div>
                        </div>
                        <div className="backdrop-blur-md bg-white/10 rounded-lg p-2 border border-white/20">
                          <div className="text-white/80 text-xs mb-0.5 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Points
                          </div>
                          <div
                            className="text-white text-base md:text-lg font-bold"
                            data-testid="viewer-points">
                            {currentPlayer.points || 0}
                          </div>
                        </div>
                      </div>
                    )}

                    {!soldCards.some((p) => p.name === currentPlayer.name) && (
                      <div className="space-y-3">
                        {!showTeamSelection ? (
                          <>
                            {/* Current Bid Display */}
                            <motion.div
                              onClick={
                                isMobile
                                  ? () =>
                                      setCurrentBid((prev) =>
                                        prev === 0
                                          ? Number(currentPlayer.basePrice) || 0
                                          : prev + AUCTION_CONFIG.bidIncrement,
                                      )
                                  : undefined
                              }
                              className={`backdrop-blur-xl bg-blue-600/10 rounded-xl p-3 md:p-3.5 border-2 border-blue-400/30 select-none transition-transform ${isMobile ? "cursor-pointer active:scale-95" : ""}`}
                              data-testid="bid-increment-area"
                              whileHover={
                                isMobile
                                  ? {
                                      scale: 1.02,
                                      borderColor: "rgba(96, 165, 250, 0.6)",
                                      backgroundColor: "rgba(37, 99, 235, 0.15)",
                                    }
                                  : undefined
                              }
                              whileTap={isMobile ? { scale: 0.98 } : undefined}>
                              <div className="text-blue-300 text-xs md:text-sm mb-1 font-semibold flex items-center justify-between">
                                <span>Current Bid</span>
                                {isMobile && (
                                  <span className="text-[10px] md:text-xs bg-blue-500/30 px-2 py-0.5 rounded font-bold">
                                    TAP TO INCREMENT
                                  </span>
                                )}
                              </div>
                              <div
                                className="text-white text-2xl md:text-3xl font-bold"
                                data-testid="viewer-current-bid">
                                {currentBid > 0
                                  ? `₹${formatIndianNumber(currentBid)}`
                                  : "Bid to Start"}
                              </div>
                            </motion.div>

                            {/* Quick Bid Increment Buttons */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              {[
                                { label: "+20L", val: 2000000 },
                                { label: "+50L", val: 5000000 },
                                { label: "+1Cr", val: 10000000 },
                                { label: "+2Cr", val: 20000000 },
                              ].map((inc) => (
                                <button
                                  key={inc.label}
                                  type="button"
                                  onClick={() => {
                                    setCurrentBid((prev) => {
                                      const base = prev === 0 ? (currentPlayer.basePrice || 0) : prev;
                                      return base + inc.val;
                                    });
                                  }}
                                  className="flex-1 min-w-[50px] py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-xs font-bold text-white transition-all text-center"
                                >
                                  {inc.label}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => setCurrentBid(currentPlayer.basePrice || 0)}
                                className="py-1.5 px-2.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 active:scale-95 border border-orange-400/40 text-xs font-bold text-orange-300 transition-all"
                                title="Reset to Base Price"
                              >
                                Reset
                              </button>
                            </div>

                            {/* Action Buttons */}
                            <motion.div
                              className="flex flex-col md:flex-row gap-2.5 pt-1"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.1 }}>
                              <motion.button
                                onClick={() => setShowTeamSelection(true)}
                                className="flex-1 px-4 py-3 text-base font-bold border-none rounded-xl cursor-pointer shadow-lg backdrop-blur-md bg-green-600/90 text-white min-h-[48px] touch-manipulation transition-all"
                                data-testid="button-sold"
                                whileHover={{
                                  scale: 1.03,
                                  backgroundColor: "rgba(22, 163, 74, 1)",
                                  boxShadow: "0 0 20px rgba(34, 197, 94, 0.5)",
                                }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ duration: 0.2 }}>
                                ✓ Sold
                              </motion.button>
                              <motion.button
                                onClick={markUnsold}
                                className="flex-1 px-4 py-3 text-base font-bold border-none rounded-xl cursor-pointer shadow-lg backdrop-blur-md bg-red-600/90 text-white min-h-[48px] touch-manipulation"
                                data-testid="button-unsold"
                                whileHover={{
                                  scale: 1.03,
                                  backgroundColor: "rgba(220, 38, 38, 1)",
                                  boxShadow: "0 0 20px rgba(239, 68, 68, 0.5)",
                                }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ duration: 0.2 }}>
                                ✗ Unsold
                              </motion.button>
                              <motion.button
                                onClick={closeViewer}
                                className="px-4 py-3 text-base font-semibold border-none rounded-xl cursor-pointer shadow-lg backdrop-blur-md bg-gray-600/90 text-white min-h-[48px] touch-manipulation"
                                data-testid="button-close"
                                whileHover={{
                                  scale: 1.03,
                                  backgroundColor: "rgba(75, 85, 99, 1)",
                                }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ duration: 0.2 }}>
                                Cancel
                              </motion.button>
                            </motion.div>
                          </>
                        ) : (
                          /* Team Selection Step: Only visible after clicking Sold, displays only team icons */
                          <div className="space-y-3 p-3.5 rounded-2xl bg-black/50 border border-white/15 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
                            <div className="text-center">
                              <div className="text-xs text-[#00BCD4] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                                <Shield className="w-3.5 h-3.5" />
                                Select Winning Team
                              </div>
                              <div className="text-white text-base sm:text-lg font-bold mt-0.5">
                                Final Price: <span className="text-green-400 font-extrabold">₹{formatIndianNumber(currentBid > 0 ? currentBid : (currentPlayer.basePrice || 0))}</span>
                              </div>
                            </div>

                            {/* Only Team Icons - 10 teams in a clean grid */}
                            <div className="grid grid-cols-5 gap-3 sm:gap-4 py-2 justify-items-center">
                              {(teamStats || []).map((team) => {
                                const isSelected = selectedTeam === team.teamName;
                                const currentPrice = currentBid > 0 ? currentBid : (currentPlayer.basePrice || 0);
                                const cannotAfford = team.fundsRemaining < currentPrice;
                                const isSquadFull = team.playersCount >= AUCTION_CONFIG.maxPlayers;
                                const isOverseasFull = currentPlayer.overseas && (team.overseasCount >= AUCTION_CONFIG.maxOverseasPlayers);
                                const isDisabled = cannotAfford || isSquadFull || isOverseasFull;

                                const teamLogo = team.logoUrl || getTeamLogo(team.teamName);
                                const isImageLogo = teamLogo && (teamLogo.startsWith('/') || teamLogo.startsWith('http'));

                                let disabledReason = "";
                                if (cannotAfford) disabledReason = "Insufficient Funds";
                                else if (isSquadFull) disabledReason = "Squad Full (15/15)";
                                else if (isOverseasFull) disabledReason = "Overseas Full (7/7)";

                                return (
                                  <button
                                    key={team.teamId || team.teamName}
                                    type="button"
                                    disabled={isDisabled}
                                    onClick={() => setSelectedTeam(team.teamName)}
                                    title={`${team.teamName} (Purse: ₹${formatIndianNumber(team.fundsRemaining)})${disabledReason ? ` - ${disabledReason}` : ''}`}
                                    className={cn(
                                      "relative w-12 h-12 sm:w-14 sm:h-14 rounded-full p-0.5 border-2 transition-all duration-200 flex items-center justify-center flex-shrink-0 cursor-pointer",
                                      isSelected
                                        ? "border-[#00BCD4] bg-[#00BCD4]/25 scale-110 shadow-lg shadow-[#00BCD4]/40 ring-4 ring-[#00BCD4]/30"
                                        : isDisabled
                                        ? "border-white/10 opacity-30 cursor-not-allowed grayscale"
                                        : "border-white/25 bg-black/60 hover:border-[#00BCD4] hover:scale-105 active:scale-95"
                                    )}
                                  >
                                    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-black/40">
                                      {isImageLogo ? (
                                        <img
                                          src={teamLogo}
                                          alt={team.teamName}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLElement).style.display = "none";
                                          }}
                                        />
                                      ) : (
                                        <span className="text-[10px] sm:text-xs font-bold text-white">
                                          {getTeamInitials(team.teamName)}
                                        </span>
                                      )}
                                    </div>

                                    {isSelected && (
                                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#00BCD4] text-black flex items-center justify-center shadow-md">
                                        <Check className="w-3 h-3 stroke-[3]" />
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Selected Team Label */}
                            {selectedTeam ? (
                              <div className="text-center text-xs font-bold text-white">
                                Selected: <span className="text-[#00BCD4]">{selectedTeam}</span>
                              </div>
                            ) : (
                              <div className="text-center text-[11px] text-white/50 italic">
                                Click a team icon above to assign
                              </div>
                            )}

                            {/* Confirm / Back Buttons */}
                            <div className="flex gap-2 pt-1">
                              <motion.button
                                onClick={markSold}
                                disabled={!selectedTeam || isSubmittingSold}
                                className={cn(
                                  "flex-1 px-4 py-2.5 text-sm font-bold border-none rounded-xl cursor-pointer shadow-lg backdrop-blur-md text-white min-h-[44px] touch-manipulation transition-all",
                                  selectedTeam && !isSubmittingSold
                                    ? "bg-green-600/90 hover:bg-green-600 shadow-green-500/30 cursor-pointer"
                                    : "bg-gray-600/40 opacity-50 cursor-not-allowed"
                                )}
                                whileHover={selectedTeam && !isSubmittingSold ? { scale: 1.02 } : undefined}
                                whileTap={selectedTeam && !isSubmittingSold ? { scale: 0.98 } : undefined}>
                                {isSubmittingSold
                                  ? "Saving..."
                                  : selectedTeam
                                  ? `✓ Confirm Sold to ${selectedTeam}`
                                  : "Select Team Above"}
                              </motion.button>
                              <motion.button
                                onClick={() => {
                                  setShowTeamSelection(false);
                                  setSelectedTeam(null);
                                }}
                                className="px-4 py-2.5 text-sm font-semibold border-none rounded-xl cursor-pointer shadow-lg backdrop-blur-md bg-gray-600/90 text-white min-h-[44px] touch-manipulation"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}>
                                Back
                              </motion.button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {soldCards.some((p) => p.name === currentPlayer.name) && (
                      <div className="bg-green-500/20 backdrop-blur-sm border border-green-400/50 rounded-xl p-4 text-center space-y-2">
                        <div className="text-green-300 font-bold text-xs uppercase tracking-wider">
                          SOLD IN AUCTION
                        </div>
                        <div className="text-white font-bold text-2xl md:text-3xl">
                          {currentPlayer.soldPrice > 0
                            ? `₹${formatIndianNumber(currentPlayer.soldPrice)}`
                            : "N/A"}
                        </div>
                        {currentPlayer.team && currentPlayer.team !== "N/A" && (
                          <div className="inline-flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/20">
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-black/40 border border-white/20 flex items-center justify-center">
                              <img
                                src={getTeamLogo(currentPlayer.team)}
                                alt={currentPlayer.team}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            </div>
                            <span className="text-white text-sm font-bold">
                              {currentPlayer.team}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {soldCards.some((p) => p.name === currentPlayer.name) && (
                  <div className="flex justify-center px-4 md:px-6 pb-4">
                    <motion.button
                      onClick={closeViewer}
                      className="w-full md:w-auto px-6 py-4 md:py-2 text-base md:text-sm font-semibold border-none rounded-lg cursor-pointer shadow-lg backdrop-blur-md bg-gray-600/90 text-white min-h-[48px] touch-manipulation"
                      data-testid="button-close-sold"
                      whileHover={{
                        scale: 1.05,
                        backgroundColor: "rgba(75, 85, 99, 1)",
                      }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2 }}>
                      Close
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
