import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import {
  supabaseService,
  type Tournament,
} from "@/services/supabaseService";
import { fetchAuctionRules } from "@/services/auctionRules";
import { formatIndianNumber } from "@/lib/utils";

interface CreateTournamentInput {
  name: string;
  slug?: string;
  room_code?: string;
  description?: string;
  currency_symbol?: string;
  currency_code?: string;
  banner_url?: string;
  logo_url?: string;
  is_private?: boolean;
  room_password?: string;
  admin_password?: string;
  created_by?: string | null;
  cloneFromTemplate?: boolean;
}

interface TournamentContextType {
  currentTournament: Tournament | null;
  tournaments: Tournament[];
  isLoading: boolean;
  activeTournamentId: number;
  switchTournament: (identifier: number | string) => Promise<boolean>;
  createTournament: (input: CreateTournamentInput) => Promise<Tournament>;
  updateTournament: (id: number, updates: Partial<Tournament>) => Promise<void>;
  deleteTournament: (id: number) => Promise<void>;
  refreshTournaments: () => Promise<void>;
  formatCurrency: (amount: number) => string;
}

const DEFAULT_TOURNAMENT: Tournament = {
  id: 1,
  name: "IPL 2025 Mega Auction",
  slug: "ipl-2025",
  room_code: "IPL2025",
  description: "Official IPL 2025 Mega Player Auction",
  currency_symbol: "₹",
  currency_code: "INR",
};

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [tournaments, setTournaments] = useState<Tournament[]>([DEFAULT_TOURNAMENT]);
  const [currentTournament, setCurrentTournament] = useState<Tournament>(DEFAULT_TOURNAMENT);
  const [isLoading, setIsLoading] = useState(true);

  const refreshTournaments = useCallback(async () => {
    try {
      const list = await supabaseService.getTournaments();
      if (list && list.length > 0) {
        setTournaments(list);
        const activeId = supabaseService.getActiveTournamentId();
        const found = list.find((t) => t.id === activeId) || list[0];
        setCurrentTournament(found);
      }
    } catch (err) {
      console.error("Failed to load tournaments:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchTournament = useCallback(
    async (identifier: number | string): Promise<boolean> => {
      let target: Tournament | undefined | null = null;
      if (typeof identifier === "number") {
        target = tournaments.find((t) => t.id === identifier);
        if (!target) {
          target = await supabaseService.getTournamentById(identifier);
        }
      } else {
        const clean = identifier.trim().toLowerCase();
        target = tournaments.find(
          (t) =>
            t.room_code.toLowerCase() === clean ||
            t.slug.toLowerCase() === clean,
        );
        if (!target) {
          target = await supabaseService.getTournamentBySlugOrCode(identifier);
        }
      }

      if (target) {
        supabaseService.setActiveTournamentId(target.id);
        setCurrentTournament(target);
        // Refresh auction squad rules for this tournament
        await fetchAuctionRules(target.id);
        return true;
      }
      return false;
    },
    [tournaments],
  );

  const createTournament = useCallback(
    async (input: CreateTournamentInput): Promise<Tournament> => {
      const { cloneFromTemplate, ...data } = input;
      const created = await supabaseService.createTournament(data);

      if (cloneFromTemplate) {
        try {
          await supabaseService.cloneTournamentStructure(1, created.id, {
            copyTeams: true,
            copyPools: true,
            copyPlayers: true,
            copyRules: true,
          });
        } catch (cloneErr) {
          console.warn("Template clone warning:", cloneErr);
        }
      }

      await refreshTournaments();
      await switchTournament(created.id);
      return created;
    },
    [refreshTournaments, switchTournament],
  );

  const updateTournament = useCallback(
    async (id: number, updates: Partial<Tournament>): Promise<void> => {
      await supabaseService.updateTournament(id, updates);
      await refreshTournaments();
    },
    [refreshTournaments],
  );

  const deleteTournament = useCallback(
    async (id: number): Promise<void> => {
      await supabaseService.deleteTournament(id);
      await refreshTournaments();
    },
    [refreshTournaments],
  );

  const formatCurrency = useCallback(
    (amount: number): string => {
      const symbol = currentTournament?.currency_symbol || "₹";
      const formattedNumber = formatIndianNumber(amount);
      return `${symbol} ${formattedNumber}`;
    },
    [currentTournament],
  );

  useEffect(() => {
    refreshTournaments();

    // Listen to local tournament switch events
    const handleLocalChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ tournamentId: number }>;
      if (customEvent.detail?.tournamentId) {
        const target = tournaments.find((t) => t.id === customEvent.detail.tournamentId);
        if (target) {
          setCurrentTournament(target);
        }
      }
    };
    window.addEventListener("ipl_tournament_changed", handleLocalChange);

    // Supabase Realtime channel for tournaments table
    const channel = supabase
      .channel("realtime_tournaments")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tournaments",
        },
        () => {
          refreshTournaments();
        },
      )
      .subscribe();

    return () => {
      window.removeEventListener("ipl_tournament_changed", handleLocalChange);
      supabase.removeChannel(channel);
    };
  }, [refreshTournaments, tournaments]);

  return (
    <TournamentContext.Provider
      value={{
        currentTournament,
        tournaments,
        isLoading,
        activeTournamentId: currentTournament?.id || 1,
        switchTournament,
        createTournament,
        updateTournament,
        deleteTournament,
        refreshTournaments,
        formatCurrency,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament(): TournamentContextType {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error("useTournament must be used within a TournamentProvider");
  }
  return context;
}
