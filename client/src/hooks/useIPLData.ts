import { useQuery } from "@tanstack/react-query";
import {
  supabaseService,
  type TeamStats,
  type Player,
} from "@/services/supabaseService";
import { DATA_SYNC_CONFIG } from "@shared/config";

export const useIPLData = () => {
  const {
    data: teamStats,
    isLoading: isLoadingTeams,
    error: teamsError,
    refetch: refetchTeams,
  } = useQuery({
    queryKey: ["teamStats"],
    queryFn: () => supabaseService.getTeamStats(),
    refetchInterval: DATA_SYNC_CONFIG.homeRefreshInterval,
    staleTime: DATA_SYNC_CONFIG.cacheTime,
  });

  const {
    data: players,
    isLoading: isLoadingPlayers,
    error: playersError,
    refetch: refetchPlayers,
  } = useQuery({
    queryKey: ["players"],
    queryFn: () => supabaseService.getPlayers(),
    refetchInterval: DATA_SYNC_CONFIG.homeRefreshInterval,
    staleTime: DATA_SYNC_CONFIG.cacheTime,
  });

  const {
    data: leaderboard,
    isLoading: isLoadingLeaderboard,
    error: leaderboardError,
    refetch: refetchLeaderboard,
  } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => supabaseService.getLeaderboard(),
    refetchInterval: DATA_SYNC_CONFIG.homeRefreshInterval,
    staleTime: DATA_SYNC_CONFIG.cacheTime,
  });

  const getSoldPlayersByTeam = (teamId: string) => {
    return useQuery({
      queryKey: ["soldPlayers", teamId],
      queryFn: () => supabaseService.getSoldPlayersByTeam(teamId),
      enabled: !!teamId,
      refetchInterval: DATA_SYNC_CONFIG.homeRefreshInterval,
      staleTime: DATA_SYNC_CONFIG.cacheTime,
    });
  };

  const getUnsoldPlayers = () => {
    return useQuery({
      queryKey: ["unsoldPlayers"],
      queryFn: () => supabaseService.getUnsoldPlayers(),
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
  };
};
