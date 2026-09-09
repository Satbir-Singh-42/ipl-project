import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { Redirect, useLocation } from "wouter";
import { LoadingPage } from "@/components/LoadingPage";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Role required to access. "admin" (default) or "organizer" for role-based
   *  access; "any" means any authenticated user may pass. */
  requiredRole?: UserRole | "any";
  allowOwnerOf?: string | null;
}

export function ProtectedRoute({
  children,
  requiredRole = "admin",
  allowOwnerOf,
}: ProtectedRouteProps) {
  const { isAuthenticated, role, isLoading, user } = useAuth();
  const [location] = useLocation();
  const loginRedirect =
    location && location !== "/login"
      ? `/login?next=${encodeURIComponent(location)}`
      : "/login";

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return <Redirect to={loginRedirect} replace />;
  }

  // Any authenticated user is allowed through.
  if (requiredRole === "any") {
    return <>{children}</>;
  }

  // Admin / Host can access role-protected routes
  if (role === "admin") {
    return <>{children}</>;
  }

  // Organizers may access organizer routes
  if (requiredRole === "organizer" && role === "organizer") {
    return <>{children}</>;
  }

  // The room creator may manage their own room's auction/hosting
  if (allowOwnerOf && user?.id && allowOwnerOf === user.id) {
    return <>{children}</>;
  }

  // User is authenticated but lacks the required role: do NOT bounce back to
  // /login (that would create an infinite loop), send them to a neutral hub.
  return <Redirect to="/portal" replace />;
}
