import { useState } from "react";
import { useLocation, Redirect } from "wouter";
import { LogIn, KeyRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AuthLayout } from "@/components/AuthLayout";
import { AuthField } from "@/components/AuthField";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated, role } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const nextPath = new URLSearchParams(window.location.search).get("next");
  const redirectTarget = nextPath || (role === "admin" ? "/admin" : "/create");

  // Redirect if already logged in
  if (isAuthenticated) {
    return <Redirect to={redirectTarget} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({ title: "Username and password are required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      toast({ title: "Login successful" });
      // AuthContext will update role, redirect handled above on next render
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      toast({ title: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Welcome Back"
      title="Sign In to IPL Auction Portal"
      subtitle="Access the admin console or run a room's auction."
      cardBadge={
        <div className="w-16 h-16 rounded-2xl bg-[#fe6804]/15 border border-[#fe6804]/40 shadow-[0_0_30px_rgba(254,104,4,0.25)] flex items-center justify-center">
          <LogIn className="w-8 h-8 text-[#fe6804]" />
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField
          label="Username / Email / Room Code"
          icon={KeyRound}
          value={email}
          onChange={setEmail}
          placeholder="admin or room code or you@example.com"
          autoComplete="username"
          hint="Use your admin credentials, room code, or email to sign in."
        />

        <AuthField
          label="Password"
          icon={KeyRound}
          value={password}
          onChange={setPassword}
          password
          placeholder="Enter your password"
          autoComplete="current-password"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-[#fe6804] to-[#ef4123] text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-[#fe6804]/25 active:scale-[0.99]"
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-white/10 text-center">
        <p className="text-white/40 text-sm">
          Don&apos;t have an account?{" "}
          <button
            onClick={() =>
              setLocation(nextPath ? `/signup?next=${nextPath}` : "/signup")
            }
            className="text-[#fe6804] hover:text-[#ff9a3d] transition-colors font-semibold"
          >
            Create one
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}