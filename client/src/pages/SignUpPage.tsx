import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation, Redirect } from "wouter";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export function SignUpPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signUp, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  if (isAuthenticated) {
    return <Redirect to="/create" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast({ title: "Please enter a valid email address", variant: "destructive" });
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
        setLocation("/login");
      } else {
        toast({
          title: "Account created",
          description: `Welcome, ${cleanName}! You can now host your tournament room.`,
        });
        setLocation("/create");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign up failed";
      toast({ title: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1629] text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-gradient-to-br from-[#1a1f3a]/90 to-[#0a0e1a]/90 border-[#90b6ff]/20 shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-[#fe6804]/15 border border-[#fe6804]/40 flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-[#fe6804]" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Create Your Account
            </CardTitle>
            <p className="text-white/50 text-sm">
              Sign up to host your own tournament auction room
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white/70 text-xs font-medium mb-1">
                  Username / Display Name
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. ISTE Organizer"
                  className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#fe6804]/50 focus:border-[#fe6804]/50"
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="block text-white/70 text-xs font-medium mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#fe6804]/50 focus:border-[#fe6804]/50"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-white/70 text-xs font-medium mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-4 pr-11 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#fe6804]/50 focus:border-[#fe6804]/50"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors p-1 focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-white/70 text-xs font-medium mb-1">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full pl-4 pr-11 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#fe6804]/50 focus:border-[#fe6804]/50"
                  autoComplete="new-password"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#fe6804] to-[#ef4123] text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
              >
                {isSubmitting ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <div className="mt-4 text-center space-y-2">
              <p className="text-white/40 text-xs">
                Already have an account?{" "}
                <button
                  onClick={() => setLocation("/login")}
                  className="text-[#fe6804] hover:text-[#ff9a3d] transition-colors font-medium"
                >
                  Sign In
                </button>
              </p>
              <button
                onClick={() => setLocation("/")}
                className="text-white/40 text-xs hover:text-white/70 transition-colors"
              >
                Back to Public Portal
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}