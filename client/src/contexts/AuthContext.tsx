import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type UserRole = "admin" | "auctioneer" | null;

interface AuthContextType {
  user: User | null;
  role: UserRole;
  displayName: string;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isAuctioneer: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [displayName, setDisplayName] = useState<string>("");
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
    if (r === "auctioneer") return "Auctioneer";
    return "User";
  };

  useEffect(() => {
    // Check existing session on mount
    const initAuth = async () => {
      try {
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
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        const meta = await fetchUserMeta(session.user.id);
        setRole(meta.role);
        setDisplayName(
          getResolvedDisplayName(session.user, meta.displayName, meta.role),
        );
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setRole(null);
        setDisplayName("");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setDisplayName("");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        displayName,
        isLoading,
        login,
        logout,
        isAdmin: role === "admin",
        isAuctioneer: role === "auctioneer",
        isAuthenticated: !!user,
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
