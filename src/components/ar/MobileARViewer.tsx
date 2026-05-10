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

type ARStatus = "loading" | "ready" | "ar-active" | "no-ar";

export default function MobileARViewer({ dish, restaurant }: MobileARViewerProps) {
  const modelViewerRef = useRef<any>(null);
  const [status, setStatus] = useState<ARStatus>("loading");
  const [isCapturing, setIsCapturing] = useState(false);
  const [arSupport, setArSupport] = useState<string>("checking");

  // ── Load model-viewer only on client ──
  useEffect(() => {
    import("@google/model-viewer").then(() => {
      // Check AR support after model-viewer is loaded
      checkARSupport();
    });
  }, []);

  // ── Check AR Support ──
  const checkARSupport = async () => {
    try {
      // Check WebXR (cast to any — WebXR types not in default TS lib)
      const nav = navigator as any;
      if (nav.xr) {
        const supported = await nav.xr.isSessionSupported("immersive-ar");
        if (supported) {
          setArSupport("webxr");
          return;
        }
      }

      // Check platform fallbacks
      const ua = navigator.userAgent.toLowerCase();
      if (/android/i.test(ua)) {
        setArSupport("scene-viewer");
      } else if (/iphone|ipad|ipod/i.test(ua)) {
        setArSupport("quick-look");
      } else {
        setArSupport("3d-only");
      }
    } catch {
      setArSupport("3d-only");
    }
  };

  // ── Handle model load ──
  const handleModelLoad = () => {
    setStatus("ready");
  };

  // ── Shutter: Capture the live model-viewer canvas ──
  const captureScene = async () => {
    const mv = modelViewerRef.current;
    if (!mv || typeof mv.toBlob !== "function") return;

    setIsCapturing(true);

    try {
      // 1. Capture the current model-viewer frame
      const blob: Blob = await mv.toBlob({ mimeType: "image/png", idealAspect: false });

      // 2. Draw onto a canvas for watermarking
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0);

      // 3. Watermark: Restaurant logo at 30% opacity, or text fallback
      if (restaurant.logo_url) {
        try {
          const logo = await loadImage(restaurant.logo_url);
          const logoW = canvas.width * 0.18;
          const logoH = (logo.height / logo.width) * logoW;
          ctx.globalAlpha = 0.3;
          ctx.drawImage(logo, (canvas.width - logoW) / 2, 30, logoW, logoH);
          ctx.globalAlpha = 1;
        } catch {
          // Fallback to text watermark if logo fails (CORS)
          drawTextWatermark(ctx, canvas.width, canvas.height);
        }
      } else {
        drawTextWatermark(ctx, canvas.width, canvas.height);
      }

      // 4. Trigger download
      canvas.toBlob((finalBlob) => {
        if (!finalBlob) return;
        const url = URL.createObjectURL(finalBlob);
        const link = document.createElement("a");
        link.download = `VisionDine_${dish.name.replace(/\s+/g, "_")}_${Date.now()}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsCapturing(false);
      }, "image/png");

    } catch (err) {
      console.error("Capture failed:", err);
      setIsCapturing(false);
    }
  };

  // ── Helper: Load an image via promise ──
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // ── Helper: Text watermark fallback ──
  const drawTextWatermark = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#B8960C";
    ctx.font = `bold ${Math.max(16, Math.floor(w * 0.035))}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("VISION DINE", w / 2, 50);
    ctx.font = `${Math.max(10, Math.floor(w * 0.02))}px sans-serif`;
    ctx.fillText(restaurant.name, w / 2, 50 + Math.floor(w * 0.04));
    ctx.globalAlpha = 1;
  };

  // ── Share handler ──
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${dish.name} — Vision Dine AR`,
          text: `Check out ${dish.name} in AR from ${restaurant.name}!`,
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  // ── Status label ──
  const getStatusLabel = () => {
    switch (status) {
      case "loading": return "Initializing AR Engine...";
      case "ready": {
        if (arSupport === "webxr") return "WebXR Ready — Tap to Place";
        if (arSupport === "scene-viewer") return "Android AR Ready";
        if (arSupport === "quick-look") return "iOS AR Ready";
        return "3D Preview Mode";
      }
      case "ar-active": return "AR Scan Active";
      default: return "3D Preview Mode";
    }
  };

  const ModelViewerElement = "model-viewer" as any;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden flex flex-col" style={{ backgroundColor: "transparent" }}>
      
      {/* ── 3D Model Viewer (Full Screen — transparent bg for camera feed) ── */}
      <div className="absolute inset-0 z-0">
        {status === "loading" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black gap-4">
            <Loader2 className="h-8 w-8 text-[#B8960C] animate-spin" />
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/40">
              {getStatusLabel()}
            </p>
            {arSupport !== "checking" && arSupport !== "webxr" && (
              <p className="text-[9px] text-white/20 mt-2">
                Fallback: {arSupport === "scene-viewer" ? "Scene Viewer" : arSupport === "quick-look" ? "Quick Look" : "3D Only"}
              </p>
            )}
          </div>
        )}

        <ModelViewerElement
          ref={modelViewerRef}
          src={dish.model_3d_url}
          ios-src={dish.model_3d_url?.replace(".glb", ".usdz")}
          ar
          ar-modes="webxr scene-viewer quick-look"
          ar-scale="auto"
          camera-controls
          touch-action="none"
          auto-rotate
          shadow-intensity="1.5"
          exposure="1.2"
          environment-image="neutral"
          interaction-prompt="auto"
          onLoad={handleModelLoad}
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "transparent",
            // Ensure the model-viewer canvas is never blocked
            "--poster-color": "transparent",
          } as React.CSSProperties}
        >
          {/* Native AR Button — styled as a premium floating pill */}
          <button
            slot="ar-button"
            className="absolute bottom-36 left-1/2 -translate-x-1/2 px-8 py-3.5 bg-[#B8960C] text-white rounded-full font-bold text-[11px] tracking-[0.2em] uppercase shadow-2xl border border-[#d4a80e]/30 animate-bounce"
          >
            ✦ Place in your space
          </button>
        </ModelViewerElement>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ═══  Glassmorphism UI Overlay  ═══════════════════ */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="relative z-20 flex flex-col h-full pointer-events-none">
        
        {/* ── Top Bar: Brand Pill + Close ── */}
        <div className="flex items-center justify-between px-6 pt-14">
          <div className="pointer-events-auto px-6 py-3 bg-white/10 backdrop-blur-xl rounded-full border border-white/10 shadow-lg">
            <span className="text-[#B8960C] text-[11px] font-bold tracking-[0.3em] uppercase">Vision Dine</span>
          </div>
          <button 
            onClick={() => window.history.back()}
            className="pointer-events-auto h-11 w-11 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10 shadow-lg active:scale-90 transition-transform"
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
            <div className="h-10 w-10 bg-white/10 backdrop-blur-xl rounded-full border border-white/10 flex items-center justify-center shadow-lg">
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
              <div className="h-11 w-11 rounded-full overflow-hidden border-2 border-white/20 shadow-lg">
                {dish.image_2d_url ? (
                  <img src={dish.image_2d_url} alt={dish.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-white/10 flex items-center justify-center">
                    <UtensilsCrossed className="h-4 w-4 text-white/40" />
                  </div>
                )}
              </div>

              {/* Video Icon */}
              <button className="h-10 w-10 flex items-center justify-center text-white/40 hover:text-white/80 active:scale-90 transition-all">
                <Video className="h-5 w-5" />
              </button>

              {/* ── Shutter Button (Center) ── */}
              <button 
                onClick={captureScene}
                disabled={isCapturing || status === "loading"}
                className="relative h-[68px] w-[68px] rounded-full flex items-center justify-center group disabled:opacity-50"
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
                className="h-10 w-10 flex items-center justify-center text-white/40 hover:text-white/80 active:scale-90 transition-all"
              >
                <Share2 className="h-5 w-5" />
              </button>

              {/* Gallery Icon */}
              <button className="h-10 w-10 flex items-center justify-center text-white/40 hover:text-white/80 active:scale-90 transition-all">
                <ImageIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Bottom Status Label ── */}
        <div className="py-3 text-center">
          <p className="text-[9px] font-bold tracking-[0.4em] uppercase text-white/30">{getStatusLabel()}</p>
        </div>
      </div>
    </div>
  );
}
