"use client";

import React, { useEffect, useRef, useState } from "react";
import "@google/model-viewer";
import { Camera, Share2, Loader2, Info, ChevronLeft, UtensilsCrossed } from "lucide-react";

interface ARExperienceProps {
  dish: {
    name: string;
    price: number;
    model_3d_url: string;
    description: string;
  };
  restaurant: {
    name: string;
    logo_url: string;
  };
}

export default function ARExperience({ dish, restaurant }: ARExperienceProps) {
  const modelViewerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const captureAR = async () => {
    if (!modelViewerRef.current) return;
    setIsCapturing(true);

    try {
      const blob = await (modelViewerRef.current as any).toBlob({
        mimeType: "image/png",
        idealAspect: true,
      });

      const img = new Image();
      const url = URL.createObjectURL(blob);
      
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        if (restaurant.logo_url) {
          const logo = new Image();
          logo.crossOrigin = "anonymous";
          logo.src = restaurant.logo_url;
          logo.onload = () => {
            const logoWidth = canvas.width * 0.15;
            const logoHeight = (logo.height / logo.width) * logoWidth;
            
            ctx.globalAlpha = 0.3;
            ctx.drawImage(logo, (canvas.width - logoWidth) / 2, 50, logoWidth, logoHeight);
            
            const finalImageUrl = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.download = `VisionDine_${dish.name.replace(/\s+/g, '_')}.png`;
            link.href = finalImageUrl;
            link.click();
            setIsCapturing(false);
          };
        } else {
          const link = document.createElement("a");
          link.download = `VisionDine_${dish.name.replace(/\s+/g, '_')}.png`;
          link.href = url;
          link.click();
          setIsCapturing(false);
        }
      };
      img.src = url;
    } catch (err) {
      console.error("Capture failed:", err);
      setIsCapturing(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Vision Dine: ${dish.name}`,
          text: `Check out this ${dish.name} from ${restaurant.name}!`,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const ModelViewerElement = "model-viewer" as any;

  return (
    <div className="relative h-screen w-full bg-[#0a0a0a] overflow-hidden flex flex-col">
      <div className="flex-1 relative">
        {!isLoaded && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0a0a0a]">
            <Loader2 className="h-8 w-8 text-[#b8860b] animate-spin mb-4" />
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-gray-500 text-center">Preparing Culinary AR Experience...</p>
          </div>
        )}

        <ModelViewerElement
          ref={modelViewerRef}
          src={dish.model_3d_url}
          ios-src={dish.model_3d_url.replace(".glb", ".usdz")}
          ar
          ar-modes="webxr scene-viewer quick-look"
          camera-controls
          auto-rotate
          shadow-intensity="1"
          exposure="1"
          environment-image="neutral"
          onLoad={() => setIsLoaded(true)}
          style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
        >
          <button slot="ar-button" className="absolute bottom-24 left-1/2 -translate-x-1/2 px-8 py-3 bg-[#b8860b] text-white rounded-full font-bold text-xs tracking-widest uppercase shadow-2xl animate-bounce">
            Place in your space
          </button>
        </ModelViewerElement>

        {/* Overlays */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 pointer-events-none opacity-30">
          {restaurant.logo_url ? (
            <img src={restaurant.logo_url} alt="Watermark" className="h-12 w-auto object-contain" />
          ) : (
            <span className="font-serif text-white text-xl font-bold tracking-tight">{restaurant.name}</span>
          )}
        </div>

        <div className="absolute bottom-10 inset-x-0 flex items-center justify-center px-8">
          <div className="flex items-center gap-6 bg-black/40 backdrop-blur-xl px-8 py-4 rounded-full border border-white/10 shadow-2xl">
            <button onClick={() => setShowInfo(!showInfo)} className="p-3 text-white/70 hover:text-white transition-colors">
              <Info className="h-6 w-6" />
            </button>

            <button onClick={captureAR} disabled={isCapturing} className="relative h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-inner group active:scale-95 transition-transform">
              <div className="h-12 w-12 border-4 border-[#0a0a0a] rounded-full" />
              {isCapturing && <Loader2 className="absolute h-10 w-10 text-[#b8860b] animate-spin" />}
            </button>

            <button onClick={handleShare} className="p-3 text-white/70 hover:text-white transition-colors">
              <Share2 className="h-6 w-6" />
            </button>
          </div>
        </div>

        {showInfo && (
          <div className="absolute bottom-32 inset-x-6 bg-white rounded-2xl p-6 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-gray-900">{dish.name}</h2>
                <span className="text-[#b8860b] font-bold text-lg">${dish.price}</span>
              </div>
              <UtensilsCrossed className="h-6 w-6 text-gray-200" />
            </div>
            <p className="text-gray-500 text-sm italic leading-relaxed">{dish.description}</p>
          </div>
        )}
      </div>

      <div className="bg-[#0a0a0a] px-8 py-4 text-center border-t border-white/5">
        <p className="text-[9px] font-bold tracking-[0.4em] uppercase text-gray-600">Powered by Vision Dine AR</p>
      </div>
    </div>
  );
}
