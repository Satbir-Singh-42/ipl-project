import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { Redirect } from "wouter";
import { LoadingPage } from "@/components/LoadingPage";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" replace />;
  }

  // Admin can access everything
  if (role === "admin") {
    return <>{children}</>;
  }

  // At this point, role is "auctioneer" or null (admin already returned above)

  // Admin-only routes block non-admin users
  if (requiredRole === "admin") {
    return <Redirect to="/" replace />;
  }

  // Auctioneer routes require at least auctioneer role
  if (requiredRole === "auctioneer" && role !== "auctioneer") {
    return <Redirect to="/login" replace />;
  }

  return <>{children}</>;
}
