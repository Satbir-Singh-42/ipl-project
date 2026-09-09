import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { Redirect } from "wouter";
import { LoadingPage } from "@/components/LoadingPage";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  allowOwnerOf?: string | null;
}

export function ProtectedRoute({
  children,
  requiredRole = "admin",
  allowOwnerOf,
}: ProtectedRouteProps) {
  const { isAuthenticated, role, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" replace />;
  }

  // Admin / Host can access protected routes
  if (role === "admin") {
    return <>{children}</>;
  }

  // The room creator may manage their own room's auction/hosting
  if (allowOwnerOf && user?.id && allowOwnerOf === user.id) {
    return <>{children}</>;
  }

  return <Redirect to="/login" replace />;
}
