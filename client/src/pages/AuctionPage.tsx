import { useState, useEffect, useRef } from "react";
import { useIPLData } from "@/hooks/useIPLData";
import type { Player } from "@/services/supabaseService";
import confetti from "canvas-confetti";
import {
  Trophy,
  Coins,
  Globe,
  Users,
  TrendingUp,
  RefreshCw,
  Home,
  AlertTriangle,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { AUCTION_CONFIG } from "@shared/config";
import { useToast } from "@/hooks/use-toast";
import { LoadingPage } from "@/components/LoadingPage";
import { formatIndianNumber } from "@/lib/utils";

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
    .toUpperCase();

  if (!src || failed) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center text-3xl font-bold text-white ${className}`}>
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
  const { players, refetchPlayers } = useIPLData();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [showResetWarning, setShowResetWarning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPageReady, setIsPageReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
    if (players && players.length > 0) {
      // Derive unsold player names from player status
      const initialUnsoldNames = new Set(
        players.filter((p) => p.status === "unsold").map((p) => p.name),
      );

      setUnsoldPlayerNames(initialUnsoldNames);

      // Build active/sold from fresh data, applying unsold flags
      const active: Player[] = [];
      const sold: Player[] = [];
      const sheetSoldNames = new Set<string>();

      players.forEach((player) => {
        const isMarkedUnsold = player.status === "unsold" || initialUnsoldNames.has(player.name);
        const playerWithUnsold = { ...player, isUnsold: isMarkedUnsold };

        if (player.status === "sold") {
          sold.push(playerWithUnsold);
          sheetSoldNames.add(player.name);
        } else {
          active.push(playerWithUnsold);
        }
      });

      setActiveCards(active);
      setSoldCards(sold);
      setSoldFromSheetNames(sheetSoldNames);
      setUnsoldCount(active.filter((p) => p.isUnsold).length);
      setIsPageReady(true);
    }
  }, [players]);

  const filterPlayer = (player: Player, search: string) => {
    return (
      player.name.toLowerCase().includes(search) ||
      player.role.toLowerCase().includes(search) ||
      player.nation.toLowerCase().includes(search) ||
      (player.team && player.team.toLowerCase().includes(search))
    );
  };

  const filteredCards = activeCards.filter((player) =>
    filterPlayer(player, searchTerm.toLowerCase()),
  );

  const filteredSoldCards = soldCards.filter((player) =>
    filterPlayer(player, searchTerm.toLowerCase()),
  );

  const openViewer = (player: Player) => {
    setCurrentPlayer(player);
    setViewerOpen(true);
    setShowUnsoldStamp(false);
    setCurrentBid(0);
    document.body.style.overflow = "hidden";
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setCurrentPlayer(null);
    setShowUnsoldStamp(false);
    setCurrentBid(0);
    document.body.style.overflow = "auto";
  };

  const markSold = () => {
    if (!currentPlayer || !canvasRef.current) return;

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
    const soldPlayer = {
      ...currentPlayer,
      soldPrice: currentBid,
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

    setTimeout(() => {
      setIsTransitioning(true);

      setTimeout(() => {
        if (currentIndex < newActive.length) {
          const nextPlayer = newActive[currentIndex];
          setCurrentPlayer(nextPlayer);
          setCurrentBid(0);
        } else if (newActive.length > 0) {
          const nextPlayer = newActive[0];
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

  const markUnsold = () => {
    if (!currentPlayer) return;

    setShowUnsoldStamp(true);

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
            setCurrentBid(0);
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
            setCurrentBid(0);
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
    setCurrentBid(0);
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

  const confirmReset = () => {
    setUnsoldPlayerNames(new Set());
    window.location.reload();
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

  if (!players || players.length === 0) {
    return <LoadingPage />;
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
        <div
          className="fixed top-2 right-2 sm:top-3 sm:right-3 backdrop-blur-xl bg-black/20 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-lg border border-white/20 z-[10001] text-xs sm:text-sm font-semibold"
          data-testid="stats-counter">
          <div className="flex flex-col sm:flex-row gap-1 sm:gap-0">
            <span className="text-green-400 sm:mx-2">
              A: <span data-testid="active-count">{activeCards.length}</span>
            </span>
            <span className="text-white mx-1 hidden sm:inline">|</span>
            <span className="text-blue-400 sm:mx-2">
              S: <span data-testid="sold-count">{soldCards.length}</span>
            </span>
            <span className="text-white mx-1 hidden sm:inline">|</span>
            <span className="text-red-400 sm:mx-2">
              U: <span data-testid="unsold-count">{unsoldCount}</span>
            </span>
          </div>
        </div>

        <header className="backdrop-blur-md bg-black/40 p-4 sm:p-6 text-center shadow-lg border-b border-white/20">
          <h1 className="text-xl sm:text-2xl md:text-3xl my-2 font-bold text-white drop-shadow-lg">
            Player Dashboard
          </h1>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search players..."
            className="my-3 mx-auto p-2.5 w-full max-w-[320px] rounded-lg border border-white/30 text-base backdrop-blur-md bg-black/30 text-white placeholder-white/50 block focus:outline-none focus:ring-2 focus:ring-green-500/50"
            data-testid="input-search"
          />
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center">
            <motion.button
              onClick={() => setLocation("/")}
              className="w-full sm:w-auto my-2 px-5 py-2.5 text-sm backdrop-blur-md bg-blue-600/90 text-white border-none rounded-lg cursor-pointer font-semibold shadow-lg flex items-center justify-center gap-2"
              data-testid="button-home"
              whileHover={{
                scale: 1.05,
                backgroundColor: "rgba(29, 78, 216, 1)",
                transition: { duration: 0.2 },
              }}
              whileTap={{ scale: 0.95 }}>
              <Home className="w-4 h-4" />
              Home
            </motion.button>
            <motion.button
              onClick={() => setShowResetWarning(true)}
              className="w-full sm:w-auto my-2 px-5 py-2.5 text-sm backdrop-blur-md bg-green-600/90 text-white border-none rounded-lg cursor-pointer font-semibold shadow-lg"
              data-testid="button-reset"
              whileHover={{
                scale: 1.05,
                backgroundColor: "rgba(22, 163, 74, 1)",
                transition: { duration: 0.2 },
              }}
              whileTap={{ scale: 0.95 }}>
              Reset View
            </motion.button>
          </div>
        </header>

        <main className="p-3 sm:p-5 space-y-6 sm:space-y-8 pb-20">
          <section>
            <motion.h2
              className="text-lg sm:text-xl mb-3 sm:mb-4 font-bold text-white drop-shadow-lg"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}>
              Players in Auction
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

                    {!soldCards.some((p) => p.name === currentPlayer.name) && (
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
                        className={`backdrop-blur-xl bg-blue-600/10 rounded-lg p-3 md:p-4 border-2 border-blue-400/30 select-none transition-transform ${isMobile ? "cursor-pointer active:scale-95" : ""}`}
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
                            <span className="text-[10px] md:text-xs bg-blue-500/30 px-2 py-0.5 rounded">
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
                    )}

                    {!soldCards.some((p) => p.name === currentPlayer.name) && (
                      <motion.div
                        className="flex flex-col md:flex-row gap-3 md:gap-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}>
                        <motion.button
                          onClick={markSold}
                          className="flex-1 px-4 py-4 md:py-2.5 text-base md:text-base font-bold border-none rounded-xl cursor-pointer shadow-lg backdrop-blur-md bg-green-600/90 text-white min-h-[48px] touch-manipulation"
                          data-testid="button-sold"
                          whileHover={{
                            scale: 1.05,
                            backgroundColor: "rgba(22, 163, 74, 1)",
                            boxShadow: "0 0 20px rgba(34, 197, 94, 0.5)",
                          }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ duration: 0.2 }}>
                          ✓ Sold
                        </motion.button>
                        <motion.button
                          onClick={markUnsold}
                          className="flex-1 px-4 py-4 md:py-2.5 text-base md:text-base font-bold border-none rounded-xl cursor-pointer shadow-lg backdrop-blur-md bg-red-600/90 text-white min-h-[48px] touch-manipulation"
                          data-testid="button-unsold"
                          whileHover={{
                            scale: 1.05,
                            backgroundColor: "rgba(220, 38, 38, 1)",
                            boxShadow: "0 0 20px rgba(239, 68, 68, 0.5)",
                          }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ duration: 0.2 }}>
                          ✗ Unsold
                        </motion.button>
                        <motion.button
                          onClick={closeViewer}
                          className="px-4 py-4 md:py-2.5 text-base md:text-base font-semibold border-none rounded-xl cursor-pointer shadow-lg backdrop-blur-md bg-gray-600/90 text-white min-h-[48px] touch-manipulation"
                          data-testid="button-close"
                          whileHover={{
                            scale: 1.05,
                            backgroundColor: "rgba(75, 85, 99, 1)",
                          }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ duration: 0.2 }}>
                          Cancel
                        </motion.button>
                      </motion.div>
                    )}

                    {soldCards.some((p) => p.name === currentPlayer.name) && (
                      <div className="bg-green-500/20 backdrop-blur-sm border border-green-400/50 rounded-lg px-4 py-3 text-center">
                        <div className="text-green-300 font-bold text-sm mb-1">
                          SOLD
                        </div>
                        <div className="text-white font-bold text-xl md:text-2xl">
                          {currentPlayer.soldPrice > 0
                            ? `₹${formatIndianNumber(currentPlayer.soldPrice)}`
                            : "N/A"}
                        </div>
                        {currentPlayer.team && currentPlayer.team !== "N/A" && (
                          <div className="text-white text-sm font-semibold mt-2">
                            {currentPlayer.team}
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

        <AnimatePresence>
          {showResetWarning && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-[10002] p-4"
              data-testid="reset-warning-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}>
              <motion.div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowResetWarning(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}></motion.div>

              <motion.div
                className="relative backdrop-blur-xl bg-white/10 rounded-2xl overflow-hidden shadow-2xl border border-red-500/50 max-w-md w-full z-[10003]"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}>
                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">
                        Reset Auction View?
                      </h3>
                      <p className="text-white/80 text-sm leading-relaxed">
                        All local auction state will be reset.
                        Database records will not be affected.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowResetWarning(false)}
                      className="text-white/60 hover:text-white transition-colors"
                      data-testid="button-close-warning">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <motion.button
                      onClick={() => setShowResetWarning(false)}
                      className="flex-1 px-4 py-2.5 text-sm font-semibold border-none rounded-lg cursor-pointer backdrop-blur-md bg-gray-600/90 text-white"
                      data-testid="button-cancel-reset"
                      whileHover={{
                        scale: 1.02,
                        backgroundColor: "rgba(75, 85, 99, 1)",
                      }}
                      whileTap={{ scale: 0.98 }}>
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={confirmReset}
                      className="flex-1 px-4 py-2.5 text-sm font-bold border-none rounded-lg cursor-pointer backdrop-blur-md bg-red-600/90 text-white"
                      data-testid="button-confirm-reset"
                      whileHover={{
                        scale: 1.02,
                        backgroundColor: "rgba(220, 38, 38, 1)",
                        boxShadow: "0 0 20px rgba(239, 68, 68, 0.4)",
                      }}
                      whileTap={{ scale: 0.98 }}>
                      Reset Now
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
