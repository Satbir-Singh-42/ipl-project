import { useState } from "react";
import { useLocation } from "wouter";
import { Lock, Eye, EyeOff, ArrowLeft, Shield } from "lucide-react";
import { useTournament } from "@/contexts/TournamentContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseService } from "@/services/supabaseService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface RoomAccessGuardProps {
  children: React.ReactNode;
}

export function RoomAccessGuard({ children }: RoomAccessGuardProps) {
  const [, setLocation] = useLocation();
  const { currentTournament } = useTournament();
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUnlockedState, setIsUnlockedState] = useState(false);

  if (!currentTournament) {
    return <>{children}</>;
  }

  // Public rooms or system tournament #1 are open
  if (!currentTournament.is_private) {
    return <>{children}</>;
  }

  // Admins bypass room password
  if (isAdmin) {
    return <>{children}</>;
  }

  // Check session storage
  const isUnlockedSession =
    typeof window !== "undefined" &&
    sessionStorage.getItem(`room_unlocked_${currentTournament.id}`) === "true";

  if (isUnlockedSession || isUnlockedState) {
    return <>{children}</>;
  }

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    const inputPass = password.trim();
    const isMatch = await supabaseService.verifyRoomPassword(currentTournament.id, inputPass);

    if (isMatch) {
      sessionStorage.setItem(`room_unlocked_${currentTournament.id}`, "true");
      setIsUnlockedState(true);
      toast({
        title: "Room Unlocked",
        description: `Access granted to [${currentTournament.name}].`,
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect password for this private room.",
        variant: "destructive",
      });
    }
    setIsVerifying(false);
  };

  return (
    <div className="min-h-screen bg-[#0f1629] text-white flex items-center justify-center p-4">
      <div
        style={{ backgroundColor: "#181820" }}
        className="w-full max-w-md bg-[#181820] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden font-['Work_Sans',Helvetica]"
      >
        <div className="text-left space-y-1.5 mb-4">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
            Unlock {currentTournament.name}?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
            This auction room is private. Enter the room access password to view teams, rosters, and live bidding.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              required
              autoFocus
              placeholder="Enter room password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#272732] border border-white/10 text-white h-10 px-3.5 rounded-xl text-sm focus:border-[#fe6804] pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setLocation("/")}
              className="px-4 py-1.5 rounded-full bg-[#272732] hover:bg-[#333342] text-white text-xs sm:text-sm font-medium border border-white/10 transition-all active:scale-95"
            >
              Back to Lobby
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="px-5 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-[#fe6804] hover:bg-[#e05b03] text-white shadow-md shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {isVerifying ? "Verifying..." : "Unlock & Enter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
