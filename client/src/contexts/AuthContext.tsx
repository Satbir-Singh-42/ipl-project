import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { supabaseService } from "@/services/supabaseService";

export type UserRole = "admin" | "organizer" | null;

interface AuthContextType {
  user: User | null;
  role: UserRole;
  displayName: string;
  isLoading: boolean;
  scopedTournamentId: number | null;
  isMasterAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (
    username: string,
    email: string,
    password: string,
  ) => Promise<{ needsEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isAuthenticated: boolean;
  canManageRoom: (createdBy?: string | null) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [scopedTournamentId, setScopedTournamentId] = useState<number | null>(null);
  const [isMasterAdmin, setIsMasterAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user role and display_name from users_meta table
  const fetchUserMeta = async (
    authId: string,
  ): Promise<{ role: UserRole; displayName: string | null }> => {
    const { data, error } = await supabase
      .from("users_meta")
      .select("role, display_name")
      .eq("auth_id", authId)
      .single();

    if (error || !data) return { role: null, displayName: null };
    return {
      role: data.role as UserRole,
      displayName: data.display_name || null,
    };
  };

  const getResolvedDisplayName = (
    u: User | null,
    metaName: string | null,
    r: UserRole,
  ): string => {
    if (metaName && metaName.trim()) return metaName.trim();
    const metaFullName =
      u?.user_metadata?.display_name ||
      u?.user_metadata?.full_name ||
      u?.user_metadata?.name;
    if (metaFullName && String(metaFullName).trim()) {
      return String(metaFullName).trim();
    }
    if (r === "admin") return "Admin";
    return "User";
  };

  useEffect(() => {
    // Check existing session on mount
    const initAuth = async () => {
      try {
        // 1. Check local custom admin session
        const customSessionRaw = localStorage.getItem("ipl_custom_auth_session");
        if (customSessionRaw) {
          try {
            const customSession = JSON.parse(customSessionRaw);
            if (customSession?.role === "admin") {
              setUser({ id: customSession.id || "custom_auth", email: customSession.email || "admin@ipl.com" } as User);
              setRole("admin");
              setDisplayName(customSession.displayName || "Admin");
              setScopedTournamentId(customSession.tournamentId ?? null);
              setIsMasterAdmin(customSession.isMasterAdmin ?? (customSession.email === "admin@ipl.com"));
              setIsLoading(false);
              return;
            }
          } catch {
            localStorage.removeItem("ipl_custom_auth_session");
          }
        }

        // 2. Check Supabase Auth session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          const meta = await fetchUserMeta(session.user.id);
          setRole(meta.role);
          setDisplayName(
            getResolvedDisplayName(session.user, meta.displayName, meta.role),
          );
          setIsMasterAdmin(meta.role === "admin");
          setScopedTournamentId(null);
        }
      } catch (err) {
        console.error("Auth initialization failed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const customSessionRaw = localStorage.getItem("ipl_custom_auth_session");
      if (customSessionRaw) return; // Keep custom admin session active

      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        const meta = await fetchUserMeta(session.user.id);
        setRole(meta.role);
        setDisplayName(
          getResolvedDisplayName(session.user, meta.displayName, meta.role),
        );
        setIsMasterAdmin(meta.role === "admin");
        setScopedTournamentId(null);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setRole(null);
        setDisplayName("");
        setScopedTournamentId(null);
        setIsMasterAdmin(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (identifier: string, password: string): Promise<void> => {
    const cleanId = (identifier || "").trim();
    const cleanPass = (password || "").trim();

    if (!cleanId || !cleanPass) {
      throw new Error("Username/Email and Password are required.");
    }

    // 1. Direct Master Administrator Credentials (No Supabase User needed)
    if (
      (cleanId.toLowerCase() === "admin" ||
        cleanId.toLowerCase() === "admin@ipl.com" ||
        cleanId.toLowerCase() === "administrator") &&
      (cleanPass === "admin123" || cleanPass === "admin")
    ) {
      const sessionData = {
        id: "admin_master",
        role: "admin" as UserRole,
        displayName: "Administrator",
        email: "admin@ipl.com",
        isMasterAdmin: true,
        tournamentId: null,
      };
      localStorage.setItem("ipl_custom_auth_session", JSON.stringify(sessionData));
      setUser({ id: "admin_master", email: "admin@ipl.com" } as User);
      setRole("admin");
      setDisplayName("Administrator");
      setIsMasterAdmin(true);
      setScopedTournamentId(null);
      return;
    }

    // 2. Room-Specific Admin Host Login via Room Code + Room Admin Password
    const roomAuth = await supabaseService.verifyRoomAdminCredentials(cleanId, cleanPass);
    if (roomAuth.success && roomAuth.tournament) {
      const target = roomAuth.tournament;
      const sessionData = {
        id: `room_admin_${target.id}`,
        role: "admin" as UserRole,
        displayName: `${target.name} Host`,
        email: `${target.room_code.toLowerCase()}@admin.local`,
        isMasterAdmin: false,
        tournamentId: target.id,
      };
      localStorage.setItem("ipl_custom_auth_session", JSON.stringify(sessionData));
      supabaseService.setActiveTournamentId(target.id);
      setUser({ id: `room_admin_${target.id}`, email: sessionData.email } as User);
      setRole("admin");
      setDisplayName(`${target.name} Host`);
      setIsMasterAdmin(false);
      setScopedTournamentId(target.id);
      return;
    }

    // 3. Supabase Auth User Fallback (Only attempted if identifier is in email format)
    if (cleanId.includes("@")) {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanId,
          password: cleanPass,
        });

        if (error) {
          throw new Error("Invalid email or password.");
        }
        return;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Invalid credentials.";
        throw new Error(msg);
      }
    }

    // If identifier is not an email and direct checks failed
    throw new Error("Invalid username/room code or password.");
  };

  const signUp = async (
    username: string,
    email: string,
    password: string,
  ): Promise<{ needsEmailConfirmation: boolean }> => {
    const res = await supabaseService.signUpUser({ username, email, password });
    if (res.user && !res.needsEmailConfirmation) {
      const meta = await fetchUserMeta(res.user.id);
      setUser({ id: res.user.id, email: res.user.email } as User);
      setRole(meta.role);
      setDisplayName(username.trim() || "User");
      setIsMasterAdmin(meta.role === "admin");
      setScopedTournamentId(null);
    }
    return res;
  };

  const logout = async (): Promise<void> => {
    // Clear every local auth session (custom admin + any room keys) so no
    // stale session can be restored on the next page load.
    try {
      localStorage.removeItem("ipl_custom_auth_session");
    } catch {
      // ignore
    }
    // Invalidate any Supabase session (global scope covers all tabs/webviews).
    await supabase.auth.signOut({ scope: "global" }).catch(() => {});

    setUser(null);
    setRole(null);
    setDisplayName("");
    setScopedTournamentId(null);
    setIsMasterAdmin(false);
  };

  const canManageRoom = (createdBy?: string | null): boolean => {
    return role === "admin" || (!!user?.id && createdBy === user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        displayName,
        isLoading,
        scopedTournamentId,
        isMasterAdmin,
        login,
        signUp,
        logout,
        isAdmin: role === "admin",
        isAuthenticated: !!user && !!role,
        canManageRoom,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
