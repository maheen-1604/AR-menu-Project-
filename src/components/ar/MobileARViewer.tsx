"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
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

const FALLBACK_MODEL = "/models/default_dish.glb";

export default function MobileARViewer({ dish, restaurant, isFallback }: MobileARViewerProps) {
  const modelViewerRef = useRef<any>(null);
  const [phase, setPhase] = useState<"loading" | "welcome" | "active">("loading");
  const [isCapturing, setIsCapturing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resolve the model URL with fallback
  const modelSrc = dish.model_3d_url || FALLBACK_MODEL;

  // ── Load model-viewer on client only ──
  useEffect(() => {
    import("@google/model-viewer");

    // Force transparent backgrounds on html and body
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";

    return () => {
      document.documentElement.style.background = "";
      document.body.style.background = "";
    };
  }, []);

  // ── Model loaded → show welcome screen ──
  const handleModelLoad = () => {
    setPhase("welcome");
  };

  // ── User gesture: Launch AR ──
  const launchExperience = () => {
    const mv = modelViewerRef.current;
    setPhase("active");

    if (mv && typeof mv.activateAR === "function") {
      try {
        mv.activateAR();
      } catch (err) {
        console.warn("AR activation not available on this device:", err);
      }
    }
  };

  // ════════════════════════════════════════════
  // ═══  Photo Capture  ═══════════════════════
  // ════════════════════════════════════════════
  const capturePhoto = async () => {
    const mv = modelViewerRef.current;
    if (!mv || typeof mv.toBlob !== "function") return;
    setIsCapturing(true);

    try {
      const blob: Blob = await mv.toBlob({ mimeType: "image/png", idealAspect: true });
      const bitmap = await createImageBitmap(blob);

      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0);

      // Watermark
      applyWatermark(ctx, canvas.width, canvas.height);

      const finalBlob = await canvasToBlob(canvas);

      // Try native share (Instagram etc.) first
      if (navigator.share && navigator.canShare) {
        const file = new File([finalBlob], `VisionDine_${dish.name.replace(/\s+/g, "_")}.png`, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: `${dish.name} — Vision Dine AR` });
          setIsCapturing(false);
          return;
        }
      }

      // Fallback: download
      downloadBlob(finalBlob, `VisionDine_${dish.name.replace(/\s+/g, "_")}_${Date.now()}.png`);
    } catch (err) {
      console.error("Photo capture failed:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  // ════════════════════════════════════════════
  // ═══  Video Capture (Long Press)  ══════════
  // ════════════════════════════════════════════
  const startRecording = useCallback(() => {
    const mv = modelViewerRef.current;
    if (!mv) return;

    try {
      // Get the internal canvas from model-viewer's shadow DOM
      const canvas = mv.shadowRoot?.querySelector("canvas") as HTMLCanvasElement | null;
      if (!canvas) {
        console.warn("Could not access model-viewer canvas for recording");
        return;
      }

      const stream = canvas.captureStream(30); // 30fps
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm; codecs=vp9" });

      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const videoBlob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        downloadBlob(videoBlob, `VisionDine_${dish.name.replace(/\s+/g, "_")}_${Date.now()}.webm`);
        setIsRecording(false);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Video recording failed to start:", err);
    }
  }, [dish.name]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Long press handlers for the shutter button
  const handleShutterDown = () => {
    longPressTimerRef.current = setTimeout(() => {
      startRecording();
    }, 500); // 500ms = long press threshold
  };

  const handleShutterUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isRecording) {
      stopRecording();
    } else {
      // Short tap → photo
      capturePhoto();
    }
  };

  // ════════════════════════════════════════════
  // ═══  Helpers  ═════════════════════════════
  // ════════════════════════════════════════════
  const applyWatermark = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#B8960C";
    ctx.font = `bold ${Math.max(14, Math.floor(w * 0.03))}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("VISION DINE", w / 2, 40);
    ctx.font = `${Math.max(10, Math.floor(w * 0.018))}px sans-serif`;
    ctx.fillText(restaurant.name, w / 2, 40 + Math.floor(w * 0.035));
    ctx.globalAlpha = 1;
  };

  const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
    new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${dish.name} — Vision Dine AR`, url: window.location.href });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const ModelViewerElement = "model-viewer" as any;

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: "transparent" }}>

      {/* ── Model Viewer: Full-screen, fully transparent ── */}
      <ModelViewerElement
        ref={modelViewerRef}
        src={modelSrc}
        ar
        ar-modes="webxr scene-viewer quick-look"
        ar-scale="auto"
        camera-controls
        touch-action="none"
        auto-rotate
        shadow-intensity="1"
        exposure="1"
        environment-image="neutral"
        interaction-prompt="none"
        onLoad={handleModelLoad}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          background: "transparent",
          "--poster-color": "transparent",
          zIndex: 0,
        } as React.CSSProperties}
      >
        <button slot="ar-button" style={{ display: "none" }} />
      </ModelViewerElement>

      {/* ═══════════════════════════════════════════════ */}
      {/* ═══  Phase: Loading  ═════════════════════════ */}
      {/* ═══════════════════════════════════════════════ */}
      {phase === "loading" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/95">
          <Loader2 className="h-10 w-10 text-[#B8960C] animate-spin mb-6" />
          <p className="text-[11px] font-bold tracking-[0.4em] uppercase text-white/30">
            Loading Experience...
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ═══  Phase: Welcome (Pre-AR Gesture)  ════════ */}
      {/* ═══════════════════════════════════════════════ */}
      {phase === "welcome" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          {/* Brand */}
          <div className="mb-10">
            <h1 className="text-[#B8960C] text-[13px] font-bold tracking-[0.5em] uppercase text-center">Vision Dine</h1>
            <p className="text-white/20 text-[10px] tracking-[0.3em] uppercase text-center mt-2">Augmented Reality Menu</p>
          </div>

          {/* Dish Info */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-10 max-w-[280px] text-center">
            <UtensilsCrossed className="h-6 w-6 text-[#B8960C] mx-auto mb-3" />
            <h2 className="text-white text-lg font-bold mb-1">{dish.name}</h2>
            <p className="text-white/40 text-xs leading-relaxed">
              {dish.description || "Tap below to view this dish in your space."}
            </p>
          </div>

          {/* CTA Button — THE user gesture */}
          <button
            onClick={launchExperience}
            className="px-10 py-4 bg-[#B8960C] text-white rounded-full font-bold text-[11px] tracking-[0.25em] uppercase shadow-2xl shadow-[#B8960C]/20 border border-[#d4a80e]/30 flex items-center gap-3 active:scale-95 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            Enter Vision Dine Experience
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ═══  Phase: Active AR Session  ═══════════════ */}
      {/* ═══════════════════════════════════════════════ */}
      {phase === "active" && (
        <div className="absolute inset-0 z-20 flex flex-col pointer-events-none">

          {/* ── Top: Brand Pill + Close ── */}
          <div className="flex items-center justify-between px-5 pt-14">
            <div className="pointer-events-auto px-5 py-2.5 bg-white/10 backdrop-blur-xl rounded-full border border-white/10">
              <span className="text-[#B8960C] text-[10px] font-bold tracking-[0.3em] uppercase">Vision Dine</span>
            </div>
            <button
              onClick={() => window.history.back()}
              className="pointer-events-auto h-10 w-10 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10 active:scale-90 transition-transform"
            >
              <X className="h-4 w-4 text-white/70" />
            </button>
          </div>

          {/* ── Spacer ── */}
          <div className="flex-1" />

          {/* ── Floating Dish Card ── */}
          <div className="px-5 mb-4">
            <div className="flex justify-center mb-3">
              <div className="h-9 w-9 bg-white/10 backdrop-blur-xl rounded-full border border-white/10 flex items-center justify-center">
                <UtensilsCrossed className="h-4 w-4 text-[#B8960C]" />
              </div>
            </div>
            <div className="pointer-events-auto bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-4 max-w-[260px]">
              <h2 className="text-[#B8960C] text-[12px] font-bold tracking-[0.15em] uppercase mb-1">{dish.name}</h2>
              <p className="text-white/50 text-[11px] leading-relaxed">
                {dish.description || "A signature culinary creation."}
              </p>
            </div>
          </div>

          {/* ── Bottom Control Bar ── */}
          <div className="px-5 pb-3">
            <div className="pointer-events-auto bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/10 px-5 py-3">
              <div className="flex items-center justify-between">

                {/* Dish Thumb */}
                <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-white/15">
                  {dish.image_2d_url ? (
                    <img src={dish.image_2d_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-white/5 flex items-center justify-center">
                      <UtensilsCrossed className="h-3.5 w-3.5 text-white/30" />
                    </div>
                  )}
                </div>

                {/* Video */}
                <button className="h-9 w-9 flex items-center justify-center text-white/30 hover:text-white/70 active:scale-90 transition-all">
                  <Video className="h-4.5 w-4.5" />
                </button>

                {/* Shutter — tap for photo, long-press for video */}
                <button
                  onPointerDown={handleShutterDown}
                  onPointerUp={handleShutterUp}
                  onPointerLeave={() => {
                    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                    if (isRecording) stopRecording();
                  }}
                  disabled={isCapturing}
                  className="relative h-[64px] w-[64px] rounded-full flex items-center justify-center group disabled:opacity-50"
                >
                  <div className={`absolute inset-0 rounded-full border-[3px] ${isRecording ? 'border-red-500 animate-pulse' : 'border-white/25'} transition-colors`} />
                  <div className={`h-[52px] w-[52px] rounded-full backdrop-blur-sm border-2 flex items-center justify-center group-active:scale-90 transition-all ${isRecording ? 'bg-red-500/20 border-red-500/60' : 'bg-white/5 border-[#B8960C]/50'}`}>
                    {isCapturing ? (
                      <Loader2 className="h-5 w-5 text-[#B8960C] animate-spin" />
                    ) : isRecording ? (
                      <div className="h-5 w-5 bg-red-500 rounded-sm" /> 
                    ) : (
                      <Camera className="h-5 w-5 text-[#B8960C]" />
                    )}
                  </div>
                </button>

                {/* Share */}
                <button
                  onClick={handleShareLink}
                  className="h-9 w-9 flex items-center justify-center text-white/30 hover:text-white/70 active:scale-90 transition-all"
                >
                  <Share2 className="h-4.5 w-4.5" />
                </button>

                {/* Gallery */}
                <button className="h-9 w-9 flex items-center justify-center text-white/30 hover:text-white/70 active:scale-90 transition-all">
                  <ImageIcon className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Status ── */}
          <div className="py-2 text-center">
            <p className="text-[8px] font-bold tracking-[0.4em] uppercase text-white/20">
              {isRecording ? "● Recording" : "AR Scan Active"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
