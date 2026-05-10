"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, Share2, Loader2, X, UtensilsCrossed, Video, Image as ImageIcon } from "lucide-react";

interface MobileARViewerProps {
  dish: {
    name: string;
    price: number;
    description: string;
    model_3d_url: string;
    image_2d_url: string;
    scale_factor: number;
  };
  restaurant: {
    name: string;
    logo_url: string;
  };
}

export default function MobileARViewer({ dish, restaurant }: MobileARViewerProps) {
  const modelViewerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    import("@google/model-viewer");
  }, []);

  const captureScene = async () => {
    if (!modelViewerRef.current) return;
    setIsCapturing(true);

    try {
      const blob = await (modelViewerRef.current as any).toBlob({ mimeType: "image/png", idealAspect: true });
      const img = new Image();
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Watermark
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = "#B8960C";
        ctx.font = `bold ${Math.floor(canvas.width * 0.03)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("VISION DINE", canvas.width / 2, canvas.height - 40);
        ctx.globalAlpha = 1;

        const finalUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `VisionDine_${dish.name.replace(/\s+/g, "_")}.png`;
        link.href = finalUrl;
        link.click();
        URL.revokeObjectURL(url);
        setIsCapturing(false);
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
          title: `${dish.name} — Vision Dine AR`,
          text: `Check out ${dish.name} in AR from ${restaurant.name}!`,
          url: window.location.href,
        });
      } catch (e) {
        console.error(e);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const ModelViewerElement = "model-viewer" as any;

  return (
    <div className="relative h-[100dvh] w-full bg-black overflow-hidden flex flex-col">
      
      {/* ── 3D Model Viewer (Full Screen Background) ── */}
      <div className="absolute inset-0 z-0">
        {!isLoaded && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black gap-4">
            <Loader2 className="h-8 w-8 text-[#B8960C] animate-spin" />
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/40">Initializing AR Engine...</p>
          </div>
        )}

        <ModelViewerElement
          ref={modelViewerRef}
          src={dish.model_3d_url}
          ios-src={dish.model_3d_url?.replace(".glb", ".usdz")}
          ar
          ar-modes="webxr scene-viewer quick-look"
          camera-controls
          auto-rotate
          shadow-intensity="1.5"
          exposure="1.2"
          environment-image="neutral"
          onLoad={() => setIsLoaded(true)}
          style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
        >
          <button 
            slot="ar-button" 
            className="absolute bottom-36 left-1/2 -translate-x-1/2 px-8 py-3.5 bg-[#B8960C] text-white rounded-full font-bold text-[11px] tracking-[0.2em] uppercase shadow-2xl animate-bounce"
          >
            Place in your space
          </button>
        </ModelViewerElement>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ═══  UI Overlay Layer  ═══════════════════════════ */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="relative z-10 flex flex-col h-full pointer-events-none">
        
        {/* ── Top Bar: Brand Pill + Close ── */}
        <div className="flex items-center justify-between px-6 pt-14">
          <div className="pointer-events-auto px-6 py-3 bg-white/10 backdrop-blur-xl rounded-full border border-white/10 shadow-lg">
            <span className="text-[#B8960C] text-[11px] font-bold tracking-[0.3em] uppercase">Vision Dine</span>
          </div>
          <button 
            onClick={() => window.history.back()}
            className="pointer-events-auto h-11 w-11 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10 shadow-lg transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5 text-white/80" />
          </button>
        </div>

        {/* ── Spacer ── */}
        <div className="flex-1" />

        {/* ── Center: Floating Info Card ── */}
        <div className="px-6 mb-6">
          {/* Fork Icon */}
          <div className="flex justify-center mb-4">
            <div className="h-10 w-10 bg-white/10 backdrop-blur-xl rounded-full border border-white/10 flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-[#B8960C]" />
            </div>
          </div>

          {/* Glass Info Card */}
          <div className="pointer-events-auto bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl max-w-[280px]">
            <h2 className="text-[#B8960C] text-[13px] font-bold tracking-[0.15em] uppercase mb-1.5">{dish.name}</h2>
            <p className="text-white/60 text-[12px] leading-relaxed">
              {dish.description || "A signature culinary creation."}
            </p>
          </div>
        </div>

        {/* ── Bottom: Control Bar ── */}
        <div className="px-6 pb-4">
          <div className="pointer-events-auto bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl px-6 py-4">
            <div className="flex items-center justify-between">
              
              {/* Dish Thumbnail */}
              <div className="h-11 w-11 rounded-full overflow-hidden border-2 border-white/20">
                {dish.image_2d_url ? (
                  <img src={dish.image_2d_url} alt={dish.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-white/10 flex items-center justify-center">
                    <UtensilsCrossed className="h-4 w-4 text-white/40" />
                  </div>
                )}
              </div>

              {/* Video Icon */}
              <button className="h-10 w-10 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors">
                <Video className="h-5 w-5" />
              </button>

              {/* Shutter Button (Center) */}
              <button 
                onClick={captureScene}
                disabled={isCapturing}
                className="relative h-[68px] w-[68px] rounded-full flex items-center justify-center group"
              >
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-[3px] border-white/30" />
                {/* Inner circle */}
                <div className="h-14 w-14 rounded-full bg-white/10 backdrop-blur-sm border-2 border-[#B8960C]/60 flex items-center justify-center group-active:scale-90 transition-transform">
                  {isCapturing ? (
                    <Loader2 className="h-6 w-6 text-[#B8960C] animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-[#B8960C]" />
                  )}
                </div>
              </button>

              {/* Share Icon */}
              <button 
                onClick={handleShare}
                className="h-10 w-10 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
              >
                <Share2 className="h-5 w-5" />
              </button>

              {/* Gallery Icon */}
              <button className="h-10 w-10 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors">
                <ImageIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Bottom Label ── */}
        <div className="py-3 text-center">
          <p className="text-[9px] font-bold tracking-[0.4em] uppercase text-white/30">AR Scan Active</p>
        </div>
      </div>
    </div>
  );
}
