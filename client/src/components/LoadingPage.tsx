import { useState, useEffect } from "react";

const stadiumImage = "/images/backgrounds/stadium-bg.png";

export const LoadingPage = (): JSX.Element => {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // Preload the background image
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(true); // Show fallback even if image fails
    img.src = stadiumImage;
  }, []);

  return (
    <div className="fixed inset-0 w-full h-screen flex items-center justify-center z-50">
      {/* Background Image with fallback */}
      <div
        className={`absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-opacity duration-500 ${
          imageLoaded ? "opacity-100" : "opacity-0"
        }`}
        style={{
          backgroundImage: `url(${stadiumImage})`,
        }}
      />

      {/* Fallback background while image loads */}
      {!imageLoaded && (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      )}

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Loading Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
        {/* Title */}
        <div className="mb-8">
          <h1 className="[font-family:'Work_Sans',Helvetica] font-bold text-[28px] sm:text-[36px] md:text-[42px] lg:text-[48px] leading-tight tracking-[0] mb-2">
            <span className="text-white"> IPL </span>
            <span className="text-[#fe6804]">Player Auction</span>
          </h1>
          <p className="text-white/80 text-lg sm:text-xl font-medium">
            {imageLoaded ? "Loading auction data..." : "Preparing interface..."}
          </p>
        </div>
      </div>
    </div>
  );
};


