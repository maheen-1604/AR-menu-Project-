"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, Share2, Loader2, X, UtensilsCrossed, Video, Image as ImageIcon, Sparkles } from "lucide-react";

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
  isFallback?: boolean;
}

type ARStatus = "loading" | "ready" | "ar-active" | "ar-unavailable";

export default function MobileARViewer({ dish, restaurant, isFallback }: MobileARViewerProps) {
  const modelViewerRef = useRef<any>(null);
  const [status, setStatus] = useState<ARStatus>("loading");
  const [isCapturing, setIsCapturing] = useState(false);
  const [arMode, setArMode] = useState<string>("checking");

  // ── Load model-viewer only on client ──
  useEffect(() => {
    import("@google/model-viewer").then(() => {
      detectARCapability();
    });
  }, []);

  // ── Detect AR capability for this device ──
  const detectARCapability = async () => {
    try {
      const nav = navigator as any;
      const ua = navigator.userAgent;

      // iOS → Quick Look
      if (/iphone|ipad|ipod/i.test(ua)) {
        setArMode("quick-look");
        return;
      }

      // Android → Scene Viewer
      if (/android/i.test(ua)) {
        setArMode("scene-viewer");
        return;
      }

      // Desktop/Other → check WebXR
      if (nav.xr) {
        const supported = await nav.xr.isSessionSupported("immersive-ar");
        setArMode(supported ? "webxr" : "3d-only");
      } else {
        setArMode("3d-only");
      }
    } catch {
      setArMode("3d-only");
    }
  };

  // ── Handle model loaded ──
  const handleModelLoad = () => {
    setStatus("ready");
  };

  // ── Launch AR via user gesture (required by browsers) ──
  const launchAR = () => {
    const mv = modelViewerRef.current;
    if (!mv) return;

    try {
      // model-viewer's activateAR() method triggers the native AR flow
      if (typeof mv.activateAR === "function") {
        mv.activateAR();
        setStatus("ar-active");
      }
    } catch (err) {
      console.error("AR activation failed:", err);
    }
  };

  // ── Shutter: Capture the live 3D canvas ──
  const captureScene = async () => {
    const mv = modelViewerRef.current;
    if (!mv || typeof mv.toBlob !== "function") return;

    setIsCapturing(true);

    try {
      // 1. Capture the current model-viewer frame
      const blob: Blob = await mv.toBlob({ mimeType: "image/png", idealAspect: true });

      // 2. Draw onto a canvas for watermarking
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0);

      // 3. Watermark: restaurant logo at 30% opacity (with text fallback)
      if (restaurant.logo_url) {
        try {
          const logo = await loadImage(restaurant.logo_url);
          const logoW = canvas.width * 0.18;
          const logoH = (logo.height / logo.width) * logoW;
          ctx.globalAlpha = 0.3;
          ctx.drawImage(logo, (canvas.width - logoW) / 2, 30, logoW, logoH);
          ctx.globalAlpha = 1;
        } catch {
          drawTextWatermark(ctx, canvas.width, canvas.height);
        }
      } else {
        drawTextWatermark(ctx, canvas.width, canvas.height);
      }

      // 4. Convert to blob for sharing or download
      const finalBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/png");
      });

      // 5. Try native share first (Instagram/social), fall back to download
      if (navigator.share && navigator.canShare) {
        const file = new File([finalBlob], `VisionDine_${dish.name.replace(/\s+/g, "_")}.png`, { type: "image/png" });
        const shareData = { files: [file], title: `${dish.name} — Vision Dine AR`, text: `Check out ${dish.name} in AR!` };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          setIsCapturing(false);
          return;
        }
      }

      // Fallback: direct download
      const url = URL.createObjectURL(finalBlob);
      const link = document.createElement("a");
      link.download = `VisionDine_${dish.name.replace(/\s+/g, "_")}_${Date.now()}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Capture failed:", err);
    } finally {
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

  // ── Share link handler ──
  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${dish.name} — Vision Dine AR`,
          text: `Check out ${dish.name} in AR from ${restaurant.name}!`,
          url: window.location.href,
        });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  // ── Generate the .usdz URL from the .glb URL ──
  const getUsdzUrl = () => {
    if (!dish.model_3d_url) return undefined;
    return dish.model_3d_url.replace(/\.glb$/i, ".usdz");
  };

  // ── Status label ──
  const getStatusLabel = () => {
    if (status === "loading") return "Loading 3D Model...";
    if (status === "ar-active") return "AR Scan Active";
    switch (arMode) {
      case "quick-look": return "iOS AR Ready";
      case "scene-viewer": return "Android AR Ready";
      case "webxr": return "WebXR Ready";
      default: return "3D Preview Mode";
    }
  };

  const ModelViewerElement = "model-viewer" as any;

  return (
    <div
      className="relative h-[100dvh] w-full overflow-hidden flex flex-col"
      style={{ backgroundColor: "transparent" }}
    >
      {/* ── 3D Model Viewer (Full Screen — transparent for camera feed) ── */}
      <div className="absolute inset-0 z-0" style={{ backgroundColor: "transparent" }}>

        {status === "loading" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black gap-4">
            <Loader2 className="h-8 w-8 text-[#B8960C] animate-spin" />
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/40">
              {getStatusLabel()}
            </p>
            {isFallback && (
              <p className="text-[9px] text-orange-400/60 mt-1">Demo Mode — Default Model</p>
            )}
          </div>
        )}

        <ModelViewerElement
          ref={modelViewerRef}
          src={dish.model_3d_url}
          ios-src={getUsdzUrl()}
          ar
          ar-modes="scene-viewer quick-look webxr"
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
            "--poster-color": "transparent",
          } as React.CSSProperties}
        >
          {/* 
            HIDDEN native AR button — we trigger AR manually via activateAR().
            This slot must exist for model-viewer to enable AR internally,
            but we hide it and use our own styled button instead.
          */}
          <button slot="ar-button" style={{ display: "none" }} />
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
        <div className="flex-1 flex items-center justify-center">
          {/* ── LAUNCH AR BUTTON (user gesture required) ── */}
          {status === "ready" && arMode !== "3d-only" && (
            <button
              onClick={launchAR}
              className="pointer-events-auto px-10 py-4 bg-[#B8960C] hover:bg-[#a0830a] text-white rounded-full font-bold text-[12px] tracking-[0.2em] uppercase shadow-2xl border border-[#d4a80e]/30 flex items-center gap-3 active:scale-95 transition-all animate-bounce"
            >
              <Sparkles className="h-5 w-5" />
              Launch AR Experience
            </button>
          )}
        </div>

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
                <div className="absolute inset-0 rounded-full border-[3px] border-white/30" />
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
                onClick={handleShareLink}
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
