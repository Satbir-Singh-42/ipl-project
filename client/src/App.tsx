import { lazy, Suspense, useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { LoadingPage } from "@/components/LoadingPage";
import { AuthProvider } from "@/contexts/AuthContext";
import { TournamentProvider, useTournament } from "@/contexts/TournamentContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoomAccessGuard } from "@/components/RoomAccessGuard";
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
const LandingPage = lazy(() =>
  import("@/pages/LandingPage").then((m) => ({ default: m.LandingPage })),
);
const CreateRoomPage = lazy(() =>
  import("@/pages/CreateRoomPage").then((m) => ({ default: m.CreateRoomPage })),
);
const TournamentsPage = lazy(() =>
  import("@/pages/TournamentsPage").then((m) => ({ default: m.TournamentsPage })),
);
const LegalPage = lazy(() =>
  import("@/pages/LegalPage").then((m) => ({ default: m.LegalPage })),
);

// Lazy-loaded auth pages
const LoginPage = lazy(() =>
  import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const SignUpPage = lazy(() =>
  import("@/pages/SignUpPage").then((m) => ({ default: m.SignUpPage })),
);

// Lazy-loaded admin pages
const AdminDashboard = lazy(() =>
  import("@/pages/admin/AdminDashboard").then((m) => ({
    default: m.AdminDashboard,
  })),
);
const AdminTournaments = lazy(() =>
  import("@/pages/admin/AdminTournaments").then((m) => ({
    default: m.AdminTournaments,
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

// Room Dashboard renderer keeping roomCode in URL
function RoomDashboard({ params }: { params?: { roomCode?: string } }) {
  const { currentTournament, switchTournament } = useTournament();

  useEffect(() => {
    if (params?.roomCode) {
      if (currentTournament?.room_code?.toUpperCase() !== params.roomCode.toUpperCase()) {
        switchTournament(params.roomCode);
      }
    }
  }, [params?.roomCode, currentTournament?.room_code, switchTournament]);

  return (
    <RoomAccessGuard>
      <ElementLight />
    </RoomAccessGuard>
  );
}

// Room Auction renderer keeping roomCode in URL
function RoomAuction({ params }: { params?: { roomCode?: string } }) {
  const { currentTournament, switchTournament } = useTournament();

  useEffect(() => {
    if (params?.roomCode) {
      if (currentTournament?.room_code?.toUpperCase() !== params.roomCode.toUpperCase()) {
        switchTournament(params.roomCode);
      }
    }
  }, [params?.roomCode, currentTournament?.room_code, switchTournament]);

  return (
    <RoomAccessGuard>
      <ProtectedRoute requiredRole="admin" allowOwnerOf={currentTournament?.created_by}>
        <AuctionPage />
      </ProtectedRoute>
    </RoomAccessGuard>
  );
}

// Auction for the active room — room owner or admin
function AuctionRoute() {
  const { currentTournament } = useTournament();
  return (
    <ProtectedRoute requiredRole="admin" allowOwnerOf={currentTournament?.created_by}>
      <AuctionPage />
    </ProtectedRoute>
  );
}

function Router() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <Suspense fallback={<LoadingPage />}>
      <AnimatePresence mode="wait" initial={false}>
        <PageTransition key={location}>
          <Switch location={location}>
            {/* Multi-Tournament SaaS Landing Page (Root Entry) */}
            <Route path="/" component={LandingPage} />
            <Route path="/landing" component={LandingPage} />

            {/* Tournament / Room listing */}
            <Route path="/portal" component={TournamentsPage} />
            <Route path="/tournaments" component={TournamentsPage} />
            <Route path="/rooms" component={TournamentsPage} />
            <Route path="/lobby" component={TournamentsPage} />

            {/* Create Room / Legal page */}
            <Route path="/create" component={CreateRoomPage} />
            <Route
              path="/create-room"
              component={() => <CreateRoomPage />}
            />
            <Route path="/privacy-policy" component={() => <LegalPage type="privacy" />} />
            <Route path="/terms" component={() => <LegalPage type="terms" />} />

            {/* Room-Specific URLs with room code in the URL */}
            <Route path="/room/:roomCode" component={RoomDashboard} />
            <Route path="/room/:roomCode/auction" component={RoomAuction} />
            <Route path="/room/:roomCode/leaderboard" component={RoomDashboard} />
            <Route path="/t/:roomCode" component={RoomDashboard} />
            <Route path="/t/:roomCode/auction" component={RoomAuction} />

            {/* General Dashboard & Views */}
            <Route path="/dashboard">
              <RoomAccessGuard>
                <ElementLight />
              </RoomAccessGuard>
            </Route>
            <Route path="/overview">
              <RoomAccessGuard>
                <ElementLight />
              </RoomAccessGuard>
            </Route>
            <Route path="/public">
              <RoomAccessGuard>
                <ElementLight />
              </RoomAccessGuard>
            </Route>
            <Route path="/leaderboard">
              <RoomAccessGuard>
                <ElementLight />
              </RoomAccessGuard>
            </Route>
            <Route path="/team">
              <RoomAccessGuard>
                <TeamsListing />
              </RoomAccessGuard>
            </Route>
            <Route path="/team/:teamId/playing-xi">
              <RoomAccessGuard>
                <PlayingXI />
              </RoomAccessGuard>
            </Route>
            <Route path="/team/:teamId">
              <RoomAccessGuard>
                <TeamDashboard />
              </RoomAccessGuard>
            </Route>
            <Route path="/login" component={LoginPage} />
            <Route path="/signup" component={SignUpPage} />

            {/* Protected: Auction (room owner or admin) */}
            <Route path="/auction">
              <AuctionRoute />
            </Route>

            {/* Protected: Admin (admin only) */}
            <Route path="/admin">
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/tournaments">
              <ProtectedRoute requiredRole="admin">
                <AdminTournaments />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/rooms">
              <ProtectedRoute requiredRole="admin">
                <AdminTournaments />
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
        <TournamentProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </TournamentProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
