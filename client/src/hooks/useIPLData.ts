import { useQuery } from "@tanstack/react-query";
import {
  supabaseService,
  type TeamStats,
  type Player,
} from "@/services/supabaseService";
import { useTournament } from "@/contexts/TournamentContext";
import { DATA_SYNC_CONFIG } from "@shared/config";

export const useIPLData = (tournamentId?: number) => {
  const { currentTournament, activeTournamentId } = useTournament();
  const tId = tournamentId ?? activeTournamentId ?? currentTournament?.id ?? supabaseService.getActiveTournamentId();

  const {
    data: teamStats,
    isLoading: isLoadingTeams,
    error: teamsError,
    refetch: refetchTeams,
  } = useQuery({
    queryKey: ["teamStats", tId],
    queryFn: () => supabaseService.getTeamStats(tId),
    refetchInterval: DATA_SYNC_CONFIG.homeRefreshInterval,
    staleTime: DATA_SYNC_CONFIG.cacheTime,
  });

  const {
    data: players,
    isLoading: isLoadingPlayers,
    error: playersError,
    refetch: refetchPlayers,
  } = useQuery({
    queryKey: ["players", tId],
    queryFn: () => supabaseService.getPlayers(tId),
    refetchInterval: DATA_SYNC_CONFIG.homeRefreshInterval,
    staleTime: DATA_SYNC_CONFIG.cacheTime,
  });

  const {
    data: leaderboard,
    isLoading: isLoadingLeaderboard,
    error: leaderboardError,
    refetch: refetchLeaderboard,
  } = useQuery({
    queryKey: ["leaderboard", tId],
    queryFn: () => supabaseService.getLeaderboard(tId),
    refetchInterval: DATA_SYNC_CONFIG.homeRefreshInterval,
    staleTime: DATA_SYNC_CONFIG.cacheTime,
  });

  const getSoldPlayersByTeam = (teamId: string) => {
    return useQuery({
      queryKey: ["soldPlayers", tId, teamId],
      queryFn: () => supabaseService.getSoldPlayersByTeam(teamId, tId),
      enabled: !!teamId,
      refetchInterval: DATA_SYNC_CONFIG.homeRefreshInterval,
      staleTime: DATA_SYNC_CONFIG.cacheTime,
    });
  };

  const getUnsoldPlayers = () => {
    return useQuery({
      queryKey: ["unsoldPlayers", tId],
      queryFn: () => supabaseService.getUnsoldPlayers(tId),
      refetchInterval: DATA_SYNC_CONFIG.homeRefreshInterval,
      staleTime: DATA_SYNC_CONFIG.cacheTime,
    });
  };

  const refreshAllData = () => {
    refetchTeams();
    refetchPlayers();
    refetchLeaderboard();
  };

  return {
    teamStats,
    players,
    leaderboard,
    isLoading: isLoadingTeams || isLoadingPlayers || isLoadingLeaderboard,
    isLoadingPlayers,
    isLoadingTeams,
    isLoadingLeaderboard,
    error: teamsError || playersError || leaderboardError,
    getSoldPlayersByTeam,
    getUnsoldPlayers,
    refreshAllData,
    refetchPlayers,
    refetchTeams,
  };
};
