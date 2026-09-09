import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useTournament } from "@/contexts/TournamentContext";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
  activeTab?: "dashboard" | "players" | "teams" | "pools" | "export" | "auction" | "leaderboard";
  title?: string;
  children?: React.ReactNode;
}

export function AdminHeader({ activeTab, title, children }: AdminHeaderProps) {
  const [, setLocation] = useLocation();
  const { logout, user, role, displayName, isAdmin } = useAuth();
  const { currentTournament } = useTournament();

  const publicHref = currentTournament?.room_code
    ? `/room/${currentTournament.room_code}`
    : "/";
  const auctionHref = currentTournament?.room_code
    ? `/room/${currentTournament.room_code}/auction`
    : "/auction";

  const navItems: {
    id: string;
    label: string;
    shortLabel?: string;
    href: string;
    isExternal: boolean;
    adminOnly?: boolean;
  }[] = [
    { id: "dashboard", label: "DASHBOARD", shortLabel: "DASHBOARD", href: "/admin", isExternal: false, adminOnly: true },
    { id: "players", label: "MANAGE PLAYERS", shortLabel: "PLAYERS", href: "/admin/players", isExternal: false, adminOnly: true },
    { id: "teams", label: "MANAGE TEAMS", shortLabel: "TEAMS", href: "/admin/teams", isExternal: false, adminOnly: true },
    { id: "pools", label: "SETS & POOLS", shortLabel: "POOLS", href: "/admin/pools", isExternal: false, adminOnly: true },
    { id: "leaderboard", label: "LEADERBOARD", shortLabel: "LEADERBOARD", href: "/admin/leaderboard", isExternal: false, adminOnly: true },
    { id: "export", label: "EXPORT DATA", shortLabel: "EXPORT", href: "/admin/export", isExternal: false, adminOnly: true },
    { id: "auction", label: "AUCTION", shortLabel: "AUCTION", href: auctionHref, isExternal: true },
    { id: "public", label: "PUBLIC VIEW", shortLabel: "PUBLIC", href: publicHref, isExternal: false },
  ].filter((item) => !item.adminOnly || isAdmin);

  return (
    <header
      className="sticky top-0 z-50 w-full backdrop-blur bg-[#0b2a7d]/80 border-b border-white/10 shadow-md"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(24,24,74,0.95) 0%, rgba(12,28,158,0.85) 49%, rgba(24,24,74,0.95) 100%)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="w-full px-2 sm:px-4 lg:px-6 2xl:px-8 py-2 sm:py-2.5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2">
          {/* Title Section */}
          <div className="flex items-center gap-2">
            <h1
              className="[font-family:'Work_Sans',Helvetica] font-bold text-sm sm:text-base md:text-lg lg:text-xl 2xl:text-2xl leading-tight tracking-[0] cursor-pointer whitespace-nowrap shrink-0"
              onClick={() => setLocation(role === "admin" ? "/admin" : "/")}
            >
              <span className="text-white"> IPL </span>
              <span className="text-[#fe6804]">Player Auction</span>
            </h1>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1 w-full lg:w-auto overflow-x-auto scrollbar-hide">
            <nav
              className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto w-full lg:w-auto scrollbar-hide"
              aria-label="Admin navigation"
            >
              <ul className="flex items-center gap-1 sm:gap-1.5 xl:gap-2 min-w-max pr-1">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`h-auto px-2 sm:px-2.5 lg:px-2 xl:px-2.5 2xl:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] xl:text-xs font-semibold tracking-wide transition-all duration-200 whitespace-nowrap active:scale-95 ${item.isExternal
                          ? "bg-[linear-gradient(180deg,rgba(255,107,0,1)_0%,rgba(239,65,35,1)_100%)] text-white hover:opacity-90 shadow-sm"
                          : activeTab === item.id
                            ? "bg-[linear-gradient(180deg,rgba(255,107,0,1)_0%,rgba(239,65,35,1)_100%)] text-white shadow-sm"
                            : "bg-white/10 border border-[#90b6ff]/60 text-white hover:text-white hover:bg-white/20 hover:border-[#fe6804]/60"
                        }`}
                      onClick={() => setLocation(item.href)}
                    >
                      <span className="hidden 2xl:inline">{item.label}</span>
                      <span className="inline 2xl:hidden">{item.shortLabel || item.label}</span>
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    className="h-auto px-2 sm:px-2.5 lg:px-2 xl:px-2.5 2xl:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] xl:text-xs font-semibold tracking-wide transition-all duration-200 whitespace-nowrap bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 hover:text-white active:scale-95"
                    onClick={async () => {
                      await logout();
                      setLocation("/login");
                    }}
                  >
                    LOGOUT
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        {children && (
          <div className="mt-2 pt-2 border-t border-white/10">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
