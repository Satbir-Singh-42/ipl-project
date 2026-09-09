import { motion } from "framer-motion";
import { AlertCircle, Home, Trophy } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";

const backgroundImage = "/images/auction/background.png";

export default function NotFound() {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(true);
    img.src = backgroundImage;
  }, []);

  return (
    <div className="min-h-screen text-white font-['Segoe_UI',sans-serif] relative flex items-center justify-center">
      <div
        className={`absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-500 ${imageLoaded ? "opacity-100" : "opacity-0"
          }`}
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {!imageLoaded && (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      )}

      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

      <motion.div
        className="relative z-10 max-w-2xl mx-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}>
        <div className="backdrop-blur-xl bg-black/60 rounded-2xl overflow-hidden shadow-2xl border border-white/30 p-8 md:p-12">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col items-center text-center">

            <h1 className="text-6xl font-bold text-[#fe6804] mb-4 tracking-wider">404</h1>

            <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-wide">
              OUT! Page Not Found
            </h2>

            <p className="text-base text-white/70 mb-8 max-w-md">
              Looks like you hit the ball out of the stadium. The page you are looking for doesn't exist.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href="/">
                <button
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold border-none rounded-xl cursor-pointer transition-all duration-300 shadow-lg hover:scale-105 backdrop-blur-md bg-gradient-to-r from-[#fe6804] to-[#ef4123] text-white"
                  data-testid="link-home">
                  <Home className="w-5 h-5" />
                  Go to Home
                </button>
              </Link>

              <Link href="/auction">
                <button
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold border-none rounded-xl cursor-pointer transition-all duration-300 shadow-lg hover:scale-105 backdrop-blur-md bg-gradient-to-r from-[#00bcd4] to-[#0097a7] text-white"
                  data-testid="link-auction">
                  <Trophy className="w-5 h-5" />
                  View Auction
                </button>
              </Link>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-6">
          <p className="text-white/60 text-sm">
            IPL Player Auction Dashboard
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
