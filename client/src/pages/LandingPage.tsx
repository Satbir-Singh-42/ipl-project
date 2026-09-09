import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Trophy,
  Plus,
  Users,
  Shield,
  Layers,
  Globe,
  Coins,
  Zap,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export function LandingPage() {
  const [, setLocation] = useLocation();
  const { isAdmin, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#0f1629] text-white flex flex-col font-['Segoe_UI',sans-serif]">
      {/* Top Navbar */}
      <header
        className="w-full backdrop-blur bg-[#0b2a7d]/90 border-b border-white/10 shadow-lg py-3 px-4 sm:px-8 sticky top-0 z-50"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(24,24,74,0.98) 0%, rgba(12,28,158,0.9) 49%, rgba(24,24,74,0.98) 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation("/")}>
            <img src="/IPL-logo.png" alt="IPL Logo" className="h-10 w-auto" />
            <div>
              <h1 className="[font-family:'Work_Sans',Helvetica] font-bold text-lg sm:text-xl leading-tight">
                <span className="text-white">IPL AUCTION </span>
                <span className="text-[#fe6804]">PORTAL</span>
              </h1>
              <p className="text-[11px] text-slate-300">
                Live Tournament & Multi-Room Auction Hub
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white hover:bg-white/10 text-xs font-semibold"
                    onClick={() => setLocation("/admin")}
                  >
                    Admin Panel
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/40 text-red-300 hover:bg-red-500/20 text-xs"
                  onClick={async () => {
                    localStorage.removeItem("ipl_custom_auth_session");
                    window.location.reload();
                  }}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10 text-xs font-semibold"
                onClick={() => setLocation("/tournaments")}
              >
                Explore Rooms
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <main className="w-full flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Stadium Background */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url(/images/backgrounds/stadium-bg.png)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b2a7d]/65 via-[#18184a]/85 to-[#0f1629]" />
          <div className="absolute inset-0 bg-black/15" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(254,104,4,0.14),transparent_60%)]" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-28">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center text-center max-w-4xl mx-auto"
            >
              <h1 className="[font-family:'Work_Sans',Helvetica] text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6">
                Host the{" "}
                <span className="bg-gradient-to-r from-[#fe6804] to-[#ff9a3d] bg-clip-text text-transparent">
                  Ultimate
                </span>{" "}
                Player Auction
              </h1>

              <p className="text-slate-300 text-base sm:text-xl leading-relaxed max-w-2xl mb-10">
                Create isolated auction rooms for your league, college festival, corporate
                tournament or private event. Live bidding, custom currencies, squads & squad
                rules — everything you need to run a professional mega auction.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Button
                  onClick={() => setLocation("/create")}
                  className="bg-[#fe6804] hover:bg-[#e05b03] text-white font-semibold px-9 h-13 py-4 text-base shadow-lg shadow-[#fe6804]/25 rounded-xl"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your Tournament Room
                </Button>
                <Button
                  onClick={() => setLocation("/tournaments")}
                  className="bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold px-9 h-13 py-4 text-base rounded-xl backdrop-blur"
                >
                  Explore Live Rooms
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stat / Trust Bar */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 -mt-10 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-white/10 bg-[#18184a]/95 backdrop-blur border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            {[
              { value: "10", label: "Franchises in template" },
              { value: "100%", label: "Isolated rooms" },
              { value: "8+", label: "Currencies supported" },
              { value: "Live", label: "Real-time bidding" },
            ].map((s) => (
              <div key={s.label} className="px-6 py-6 text-center">
                <div className="text-2xl font-semibold text-white leading-none mb-2">{s.value}</div>
                <div className="text-xs uppercase tracking-wide text-slate-400">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </section>

        {/* Features */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 py-20 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mb-14"
          >
            <p className="text-[#fe6804] text-xs font-semibold uppercase tracking-[0.2em] mb-3">
              Capabilities
            </p>
            <h2 className="[font-family:'Work_Sans',Helvetica] text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
              A Complete Auction Command Center
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              From a single dashboard, manage franchises, players, pools, live bidding and squad rules — all in real time.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {[
              {
                icon: Trophy,
                title: "Live Mega Auction",
                desc: "Real-time bidding board with instant updates, sold/unsold tracking and current-bid highlights across every active room.",
              },
              {
                icon: Layers,
                title: "Player Pools & Sets",
                desc: "Organize the auction pool into custom sets. Assign players, order the draft and move between sets effortlessly.",
              },
              {
                icon: Shield,
                title: "Squad Rules Engine",
                desc: "Define squad size, budgets and role limits per tournament. Automatically enforce overspend and roster constraints.",
              },
              {
                icon: Coins,
                title: "Custom Currencies",
                desc: "Use INR, USD, EUR, GBP, AUD, AED, CAD, points — or define your own symbol & code for the room.",
              },
              {
                icon: Globe,
                title: "Public & Private Rooms",
                desc: "Launch a public room for everyone or lock it down with a view password and a separate admin/host key.",
              },
              {
                icon: Users,
                title: "10-Franchise Template",
                desc: "Duplicate the official IPL 2025 structure — franchises, auction sets and rules — and start in under a minute.",
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: (i % 3) * 0.1 }}
                whileHover={{ y: -4 }}
                className="border-t border-white/10 pt-6 transition-colors"
              >
                <div className="flex items-center gap-3 mb-4">
                  <f.icon className="w-5 h-5 text-[#fe6804]" strokeWidth={2} />
                  <h3 className="font-semibold text-white text-base">{f.title}</h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed pl-8">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-[#0b2a7d]/20 border-y border-white/10 py-20 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl mb-14"
            >
              <p className="text-[#fe6804] text-xs font-semibold uppercase tracking-[0.2em] mb-3">
                Getting Started
              </p>
              <h2 className="[font-family:'Work_Sans',Helvetica] text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
                Launch in Three Simple Steps
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-12">
              {[
                { step: "01", title: "Create a Room", desc: "Name your tournament, pick a room code, currency and privacy level. Clone the IPL 2025 template in one click." },
                { step: "02", title: "Set Up Squads & Pools", desc: "Load the 10 franchises, import or organize players into auction sets, and configure squad rules & budgets." },
                { step: "03", title: "Run the Auction", desc: "Go live. Track real-time bids, sold/unsold status and budgets as franchises build their squads on the board." },
              ].map((s, i) => (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <div className="text-sm font-semibold text-[#fe6804] tracking-widest mb-4">{s.step}</div>
                  <h3 className="font-semibold text-white text-lg mb-3">{s.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Final CTA */}
      <section className="relative overflow-hidden border-t border-white/10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1d2060] to-[#141c36]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(254,104,4,0.12),transparent_60%)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 py-20 text-center"
        >
          <h2 className="[font-family:'Work_Sans',Helvetica] text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
            Ready to Run Your Mega Auction?
          </h2>
          <p className="text-slate-400 text-base sm:text-lg mb-8">
            Set up your tournament room in under a minute and go live with real-time bidding.
          </p>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex flex-col sm:flex-row gap-4 items-center justify-center"
          >
            <Button
              onClick={() => setLocation("/create")}
              className="bg-[#fe6804] hover:bg-[#e05b03] text-white font-semibold px-9 h-13 py-4 text-base shadow-lg shadow-[#fe6804]/20 rounded-xl"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your Tournament Room
            </Button>
            <Button
              onClick={() => setLocation("/tournaments")}
              className="bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold px-9 h-13 py-4 text-base rounded-xl"
            >
              <Zap className="w-5 h-5 mr-2" />
              View Live Auctions
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 bg-[#0b2a7d]/40 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <img src="/IPL-logo.png" alt="IPL Logo" className="h-6 w-auto" />
            <span>© IPL Auction Portal</span>
          </div>

          <nav className="flex items-center gap-6">
            <button
              onClick={() => setLocation("/privacy-policy")}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setLocation("/terms")}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Terms & Conditions
            </button>
          </nav>
        </div>
      </footer>
    </div>
  );
}
