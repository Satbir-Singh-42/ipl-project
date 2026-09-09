import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation, Redirect } from "wouter";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated, role } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const nextPath = new URLSearchParams(window.location.search).get("next");
  const redirectTarget = nextPath || (role === "admin" ? "/admin" : "/create");

  // Redirect if already logged in
  if (isAuthenticated) {
    return <Redirect to={redirectTarget} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Email and password are required", variant: "destructive" });
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
    <div className="min-h-screen bg-[#0f1629] text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-gradient-to-br from-[#1a1f3a]/90 to-[#0a0e1a]/90 border-[#90b6ff]/20 shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="mx-auto">
              <img
                src="/IPL-logo.png"
                alt="IPL Logo"
                className="w-20 h-20 object-contain mx-auto"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              IPL Auction
            </CardTitle>
            <p className="text-white/50 text-sm">
              Admin & Host Login
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white/70 text-xs font-medium mb-1">
                  Username or Room Code
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin or room code"
                  className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#fe6804]/50 focus:border-[#fe6804]/50"
                  autoComplete="username"
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
                    placeholder="Password"
                    className="w-full pl-4 pr-11 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#fe6804]/50 focus:border-[#fe6804]/50"
                    autoComplete="current-password"
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
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#fe6804] to-[#ef4123] text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
              >
                {isSubmitting ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-4 text-center space-y-2">
              <p className="text-white/40 text-xs">
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => setLocation("/signup")}
                  className="text-[#fe6804] hover:text-[#ff9a3d] transition-colors font-medium"
                >
                  Create one
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
