import { useState } from "react";
import { useLocation, Redirect } from "wouter";
import { UserPlus, User, Mail, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AuthLayout } from "@/components/AuthLayout";
import { AuthField } from "@/components/AuthField";

const strengthConfig = [
  { label: "Too short", color: "bg-red-500" },
  { label: "Weak", color: "bg-red-500" },
  { label: "Fair", color: "bg-amber-500" },
  { label: "Good", color: "bg-lime-500" },
  { label: "Strong", color: "bg-emerald-500" },
];

function computeStrength(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.max(1, Math.min(4, score));
}

export function SignUpPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signUp, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const nextPath = new URLSearchParams(window.location.search).get("next");

  if (isAuthenticated) {
    return <Redirect to={nextPath || "/create"} replace />;
  }

  const strength = computeStrength(password);
  const strengthMeta = strengthConfig[strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    if (cleanName.length < 3) {
      toast({
        title: "Username must be at least 3 characters",
        variant: "destructive",
      });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast({
        title: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    if (password.length < 6) {
      toast({
        title: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { needsEmailConfirmation } = await signUp(cleanName, cleanEmail, password);
      if (needsEmailConfirmation) {
        toast({
          title: "Account created — please verify your email",
          description: "Check your inbox, then sign in to create your room.",
        });
        setLocation(nextPath ? `/login?next=${nextPath}` : "/login");
      } else {
        toast({
          title: "Account created",
          description: `Welcome, ${cleanName}! You can now host your tournament room.`,
        });
        setLocation(nextPath || "/create");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign up failed";
      toast({ title: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Get Started"
      title="Create Your Organizer Account"
      subtitle="Sign up with a valid email to host your own tournament auction room and manage its credentials."
      cardBadge={
        <div className="w-16 h-16 rounded-2xl bg-[#fe6804]/15 border border-[#fe6804]/40 shadow-[0_0_30px_rgba(254,104,4,0.25)] flex items-center justify-center">
          <UserPlus className="w-8 h-8 text-[#fe6804]" />
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField
          label="Username / Display Name"
          icon={User}
          value={username}
          onChange={setUsername}
          placeholder="e.g. ISTE Organizer"
          autoComplete="username"
        />

        <AuthField
          label="Email"
          icon={Mail}
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
        />

        <div>
          <AuthField
            label="Password"
            icon={Lock}
            value={password}
            onChange={setPassword}
            password
            placeholder="At least 6 characters"
            autoComplete="new-password"
          />
          {password.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      i <= strength ? strengthMeta.color : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] font-medium text-white/50 w-16 text-right">
                {strengthMeta.label}
              </span>
            </div>
          )}
        </div>

        <AuthField
          label="Confirm Password"
          icon={Lock}
          value={confirmPassword}
          onChange={setConfirmPassword}
          password
          placeholder="Re-enter your password"
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-[#fe6804] to-[#ef4123] text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-[#fe6804]/25 active:scale-[0.99]"
        >
          {isSubmitting ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="mt-5 text-[11px] leading-relaxed text-white/40 text-center">
        By creating an account you agree to our{" "}
        <button
          onClick={() => setLocation("/terms")}
          className="text-[#fe6804] hover:text-[#ff9a3d] transition-colors"
        >
          Terms
        </button>{" "}
        and{" "}
        <button
          onClick={() => setLocation("/privacy-policy")}
          className="text-[#fe6804] hover:text-[#ff9a3d] transition-colors"
        >
          Privacy Policy
        </button>
        .
      </p>

      <div className="mt-6 pt-6 border-t border-white/10 text-center">
        <p className="text-white/40 text-sm">
          Already have an account?{" "}
          <button
            onClick={() =>
              setLocation(nextPath ? `/login?next=${nextPath}` : "/login")
            }
            className="text-[#fe6804] hover:text-[#ff9a3d] transition-colors font-semibold"
          >
            Sign In
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}