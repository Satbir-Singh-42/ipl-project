import { useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, Shield } from "lucide-react";
import { useTournament } from "@/contexts/TournamentContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseService } from "@/services/supabaseService";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { LoadingPage } from "@/components/LoadingPage";

interface RoomAccessGuardProps {
  children: React.ReactNode;
  /** "view" = room dashboard/read-only pages. Public rooms need no credentials;
   *  private rooms need the room password set by the admin during setup.
   *  "admin" = control pages (auction console), which always require the admin
   *  password or an admin/room-admin session. */
  mode?: "view" | "admin";
}

export function RoomAccessGuard({ children, mode = "view" }: RoomAccessGuardProps) {
  const [, setLocation] = useLocation();
  const { currentTournament } = useTournament();
  const { isAdmin, grantRoomAdmin, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUnlockedState, setIsUnlockedState] = useState(false);

  // Wait for AuthContext to finish reading the session from localStorage/Supabase
  // before deciding to show the password prompt. Without this, a global admin
  // whose session is stored in localStorage would see the password prompt during
  // the async init phase (role is null briefly), then get let through moments later.
  if (isAuthLoading) {
    return <LoadingPage />;
  }

  if (!currentTournament) {
    return <>{children}</>;
  }

  const tId = currentTournament.id;
  const isPrivate = !!currentTournament.is_private;
  const isAdminMode = mode === "admin";

  // If user is already an admin, permit access in any mode
  if (isAdmin) {
    return <>{children}</>;
  }

  // VIEW MODE: public rooms never need credentials.
  if (!isAdminMode && !isPrivate) {
    return <>{children}</>;
  }

  // VIEW MODE: private room previously unlocked with the room password.
  const isRoomUnlocked =
    typeof window !== "undefined" &&
    sessionStorage.getItem(`room_unlocked_${tId}`) === "true";

  if (!isAdminMode && (isRoomUnlocked || isUnlockedState)) {
    return <>{children}</>;
  }

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    const inputPass = password.trim();

    if (isAdminMode) {
      const granted = await grantRoomAdmin(currentTournament.room_code, inputPass);
      if (granted) {
        sessionStorage.setItem(`room_admin_${tId}`, "true");
        sessionStorage.setItem(`room_unlocked_${tId}`, "true");
        setIsUnlockedState(true);
        toast({
          title: "Admin Access Granted",
          description: `Full admin access to [${currentTournament.name}].`,
        });
      } else {
        toast({
          title: "Access Denied",
          description: "Incorrect admin password for this room.",
          variant: "destructive",
        });
      }
    } else {
      const ok = await supabaseService.verifyRoomPassword(tId, inputPass);
      if (ok) {
        sessionStorage.setItem(`room_unlocked_${tId}`, "true");
        setIsUnlockedState(true);
        toast({
          title: "Room Unlocked",
          description: `You can now view [${currentTournament.name}].`,
        });
      } else {
        toast({
          title: "Access Denied",
          description: "Incorrect room password for this private room.",
          variant: "destructive",
        });
      }
    }
    setIsVerifying(false);
  };

  const title = isAdminMode
    ? currentTournament.name
    : `Private Room · ${currentTournament.name}`;
  const description = isAdminMode
    ? "Enter this room's admin password to access the full admin console (players, teams, auction & more)."
    : "Enter this room's password (set by the admin during setup) to view the auction room.";

  return (
    <div className="min-h-screen bg-[#0f1629] text-white flex items-center justify-center p-4">
      <div
        style={{ backgroundColor: "#181820" }}
        className="w-full max-w-md bg-[#181820] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden font-['Work_Sans',Helvetica]"
      >
        <div className="text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-[#fe6804]/15 border border-[#fe6804]/40 flex items-center justify-center">
            <Shield className="w-7 h-7 text-[#fe6804]" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug mb-1.5">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal mb-5">
            {description}
          </p>

        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              required
              autoFocus
              placeholder={isAdminMode ? "Enter admin password..." : "Enter room password..."}
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
              {isVerifying ? "Verifying..." : isAdminMode ? "Unlock & Enter" : "View Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}