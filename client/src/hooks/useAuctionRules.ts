import { useState, useEffect } from "react";
import {
  getAuctionRules,
  fetchAuctionRules,
  saveAuctionRules,
  resetAuctionRules,
  subscribeToRulesUpdate,
  type AuctionSquadRules,
} from "@/services/auctionRules";

export function useAuctionRules() {
  const [rules, setRules] = useState<AuctionSquadRules>(getAuctionRules());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    // Load initial fresh rules from Supabase
    fetchAuctionRules().then((fresh) => {
      if (isMounted) {
        setRules(fresh);
        setIsLoading(false);
      }
    });

    // Subscribe to both window custom events and Supabase Realtime changes
    const unsubscribe = subscribeToRulesUpdate((newRules) => {
      if (isMounted) {
        setRules(newRules);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const updateRules = async (newRules: AuctionSquadRules) => {
    setRules(newRules);
    return await saveAuctionRules(newRules);
  };

  const resetToDefaults = async () => {
    const defaults = await resetAuctionRules();
    setRules(defaults);
    return defaults;
  };

  return {
    rules,
    isLoading,
    updateRules,
    resetToDefaults,
    refreshRules: fetchAuctionRules,
  };
}
