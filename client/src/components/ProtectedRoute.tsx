import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
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
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  // Admin can access everything
  if (role === "admin") {
    return <>{children}</>;
  }

  // At this point, role is "auctioneer" or null (admin already returned above)

  // Admin-only routes block non-admin users
  if (requiredRole === "admin") {
    setLocation("/");
    return null;
  }

  // Auctioneer routes require at least auctioneer role
  if (requiredRole === "auctioneer" && role !== "auctioneer") {
    setLocation("/login");
    return null;
  }

  return <>{children}</>;
}
