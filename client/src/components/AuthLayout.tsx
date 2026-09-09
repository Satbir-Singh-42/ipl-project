import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuthLayoutProps {
  children: React.ReactNode;
  cardBadge?: React.ReactNode;
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

export function AuthLayout({
  children,
  cardBadge,
  eyebrow,
  title,
  subtitle,
}: AuthLayoutProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="relative min-h-screen bg-[#0f1629] text-white flex flex-col overflow-hidden">
      {/* Stadium background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/images/backgrounds/stadium-bg.png)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b2a7d]/70 via-[#18184a]/90 to-[#0f1629]" />
      <div className="absolute inset-0 bg-black/15" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(254,104,4,0.15),transparent_60%)]" />

      {/* Top nav */}
      <header className="relative z-10 w-full border-b border-white/10 bg-[#0b2a7d]/40 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => setLocation("/")}
          >
            <img src="/IPL-logo.png" alt="IPL Logo" className="h-9 w-auto" />
            <span className="[font-family:'Work_Sans',Helvetica] font-bold hidden sm:inline text-sm md:text-base leading-tight">
              <span className="text-white">IPL AUCTION </span>
              <span className="text-[#fe6804]">PORTAL</span>
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </header>

      {/* Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="relative rounded-2xl bg-[#18184a]/90 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="text-center mb-8">
                <div className="flex justify-center">{cardBadge}</div>
                {eyebrow && (
                  <p className="text-[#fe6804] text-[11px] font-semibold uppercase tracking-[0.25em] mt-5 mb-2">
                    {eyebrow}
                  </p>
                )}
                <h1 className="[font-family:'Work_Sans',Helvetica] text-2xl sm:text-[26px] font-bold text-white tracking-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-white/50 text-sm mt-2 leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>
              {children}
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/70" />
            Protected by Supabase Auth
          </span>
          <span>© IPL Auction Portal</span>
        </div>
      </footer>
    </div>
  );
}