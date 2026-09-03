import { lazy, Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { LoadingPage } from "@/components/LoadingPage";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";

// Lazy-loaded public pages
const ElementLight = lazy(() =>
  import("@/pages/ElementLight").then((m) => ({ default: m.ElementLight })),
);
const TeamDashboard = lazy(() =>
  import("@/pages/TeamDashboard").then((m) => ({ default: m.TeamDashboard })),
);
const TeamsListing = lazy(() =>
  import("@/pages/TeamsListing").then((m) => ({ default: m.TeamsListing })),
);
const PlayingXI = lazy(() =>
  import("@/pages/PlayingXI").then((m) => ({ default: m.PlayingXI })),
);
const AuctionPage = lazy(() => import("@/pages/AuctionPage"));

// Lazy-loaded auth pages
const LoginPage = lazy(() =>
  import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);

// Lazy-loaded admin pages
const AdminDashboard = lazy(() =>
  import("@/pages/admin/AdminDashboard").then((m) => ({
    default: m.AdminDashboard,
  })),
);
const AdminPlayers = lazy(() =>
  import("@/pages/admin/AdminPlayers").then((m) => ({
    default: m.AdminPlayers,
  })),
);
const AdminTeams = lazy(() =>
  import("@/pages/admin/AdminTeams").then((m) => ({ default: m.AdminTeams })),
);
const AdminPools = lazy(() =>
  import("@/pages/admin/AdminPools").then((m) => ({ default: m.AdminPools })),
);
const AdminExport = lazy(() =>
  import("@/pages/admin/AdminExport").then((m) => ({
    default: m.AdminExport,
  })),
);
const AdminLeaderboard = lazy(() =>
  import("@/pages/admin/AdminLeaderboard").then((m) => ({
    default: m.AdminLeaderboard,
  })),
);

function Router() {
  const [location] = useLocation();

  return (
    <Suspense fallback={<LoadingPage />}>
      <AnimatePresence mode="wait" initial={false}>
        <PageTransition key={location}>
          <Switch location={location}>
            {/* Public routes */}
            <Route path="/" component={ElementLight} />
            <Route path="/leaderboard" component={ElementLight} />
            <Route path="/team" component={TeamsListing} />
            <Route path="/team/:teamId/playing-xi" component={PlayingXI} />
            <Route path="/team/:teamId" component={TeamDashboard} />
            <Route path="/login" component={LoginPage} />

            {/* Protected: Auction (admin + auctioneer) */}
            <Route path="/auction">
              <ProtectedRoute requiredRole="auctioneer">
                <AuctionPage />
              </ProtectedRoute>
            </Route>

            {/* Protected: Admin (admin only) */}
            <Route path="/admin">
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/players">
              <ProtectedRoute requiredRole="admin">
                <AdminPlayers />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/teams">
              <ProtectedRoute requiredRole="admin">
                <AdminTeams />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/pools">
              <ProtectedRoute requiredRole="admin">
                <AdminPools />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/leaderboard">
              <ProtectedRoute requiredRole="admin">
                <AdminLeaderboard />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/export">
              <ProtectedRoute requiredRole="admin">
                <AdminExport />
              </ProtectedRoute>
            </Route>

            <Route component={NotFound} />
          </Switch>
        </PageTransition>
      </AnimatePresence>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
