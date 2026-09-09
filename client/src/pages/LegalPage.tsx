import { useLocation } from "wouter";
import { ArrowLeft, Shield, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LegalPage({ type }: { type: "privacy" | "terms" }) {
  const [, setLocation] = useLocation();
  const isPrivacy = type === "privacy";

  const title = isPrivacy ? "Privacy Policy" : "Terms & Conditions";
  const updated = "Last updated: September 2025";

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
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation("/")}>
            <img src="/IPL-logo.png" alt="IPL Logo" className="h-10 w-auto" />
            <h1 className="[font-family:'Work_Sans',Helvetica] font-bold text-lg sm:text-xl leading-tight">
              <span className="text-white">IPL AUCTION </span>
              <span className="text-[#fe6804]">PORTAL</span>
            </h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10 text-xs font-semibold"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Home
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-8 py-12 sm:py-16 flex-1">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#fe6804]/15 border border-[#fe6804]/30 text-[#fe6804] flex items-center justify-center">
            {isPrivacy ? <Shield className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
          </div>
          <div>
            <h1 className="[font-family:'Work_Sans',Helvetica] text-2xl sm:text-3xl font-bold text-white leading-tight">
              {title}
            </h1>
            <p className="text-xs text-slate-400 mt-1">{updated}</p>
          </div>
        </div>

        {isPrivacy ? (
          <div className="space-y-8 text-sm text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-white font-semibold text-lg mb-2">1. Overview</h2>
              <p>
                The IPL Auction Portal ("the Service") provides tools to host and manage fantasy-style
                cricket player auctions for leagues, festivals, corporate events and private tournaments.
                This Privacy Policy explains what information is collected, how it is used, and the
                choices available to you.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-lg mb-2">2. Information We Collect</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <span className="text-white font-medium">Account & Tournament Data:</span> Room codes,
                  tournament names, descriptions, currencies, admin/host passwords, and the teams, players,
                  pools and squad rules you create.
                </li>
                <li>
                  <span className="text-white font-medium">Authentication:</span> Basic login credentials used
                  to protect admin and private rooms.
                </li>
                <li>
                  <span className="text-white font-medium">Usage Data:</span> Anonymous analytics that help us
                  understand how the Service is used and improve performance.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-semibold text-lg mb-2">3. How We Use Information</h2>
              <p>We use the information collected to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Operate, maintain and secure the Service and your tournament rooms.</li>
                <li>Provide live bidding, roster management and real-time updates.</li>
                <li>Prevent fraud, abuse and unauthorized access to private rooms.</li>
                <li>Improve the Service through analytics and product enhancements.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-semibold text-lg mb-2">4. Data Sharing</h2>
              <p>
                We do not sell your personal information. Data is shared only where necessary to operate the
                Service (for example, with our cloud hosting and database providers) or where required by law.
                Tournament room contents are visible only to users of that specific room.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-lg mb-2">5. Data Retention & Security</h2>
              <p>
                We retain data only as long as needed to provide the Service or as required by law. Reasonable
                technical and organizational safeguards are used to protect data in transit and at rest. You
                can delete your tournament rooms and associated data at any time.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-lg mb-2">6. Your Rights</h2>
              <p>
                Depending on your location, you may have the right to access, correct, or delete your personal
                data, and to object to or restrict certain processing. To exercise these rights, please contact
                the tournament administrator who invited you or reach out to us as described below.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-lg mb-2">7. Contact</h2>
              <p>
                For privacy-related questions, please contact the administrator of the respective tournament
                room or the Service administrator directly.
              </p>
            </section>
          </div>
        ) : (
          <div className="space-y-8 text-sm text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-white font-semibold text-lg mb-2">1. Acceptance of Terms</h2>
              <p>
                By accessing or using the IPL Auction Portal, you agree to be bound by these Terms &
                Conditions. If you do not agree with any part of these terms, you may not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-lg mb-2">2. Description of Service</h2>
              <p>
                The Service enables users to create and participate in tournament rooms for conducting live
                player auctions, including managing franchises, players, auction pools, currencies and squad
                rules. Room content is isolated to each tournament and controlled by its administrator.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-lg mb-2">3. User Responsibilities</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Provide accurate information when creating rooms or accounts.</li>
                <li>Keep room codes and admin/host passwords confidential.</li>
                <li>Use the Service only for lawful purposes and in accordance with these terms.</li>
                <li>Not attempt to disrupt, overload, or gain unauthorized access to the Service.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-semibold text-lg mb-2">4. Room Creation & Content</h2>
              <p>
                Tournament administrators are responsible for the content they create, including team names,
                logos, player data and rules. The IPL Auction Portal is provided as editorial/advertising
                software and is not affiliated with the official IPL or any cricket governing body. All
                franchises, logos and player names belong to their respective owners and are used for
                demonstration purposes.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-lg mb-2">5. Intellectual Property</h2>
              <p>
                The Service, including its software, design, text and branding, is owned by the Service
                provider and its licensors. You may not copy, modify, distribute or create derivative works
                without prior written permission.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-lg mb-2">6. Disclaimers & Limitation of Liability</h2>
              <p>
                The Service is provided on an "as is" and "as available" basis without warranties of any kind.
                To the maximum extent permitted by law, the Service provider shall not be liable for any
                indirect, incidental, special, consequential or punitive damages arising from your use of the
                Service.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-lg mb-2">7. Changes to These Terms</h2>
              <p>
                We may update these Terms from time to time. Material changes will be reflected by updating the
                "last updated" date. Continued use of the Service after changes constitutes acceptance of the
                revised terms.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-lg mb-2">8. Contact</h2>
              <p>
                If you have any questions about these Terms & Conditions, please contact the service
                administrator.
              </p>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 bg-[#0b2a7d]/40 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <img src="/IPL-logo.png" alt="IPL Logo" className="h-6 w-auto" />
            <span>© IPL Auction Portal</span>
          </div>
          <nav className="flex items-center gap-6">
            <button onClick={() => setLocation("/privacy-policy")} className="text-xs text-slate-400 hover:text-white transition-colors">
              Privacy Policy
            </button>
            <button onClick={() => setLocation("/terms")} className="text-xs text-slate-400 hover:text-white transition-colors">
              Terms & Conditions
            </button>
          </nav>
        </div>
      </footer>
    </div>
  );
}
