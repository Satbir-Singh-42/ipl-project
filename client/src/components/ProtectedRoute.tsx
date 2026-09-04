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
  requiredRole = "admin",
}: ProtectedRouteProps) {
  const { isAuthenticated, role, isLoading } = useAuth();

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

  return <Redirect to="/login" replace />;
}
