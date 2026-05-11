"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Share2, Loader2, X, UtensilsCrossed, Sparkles } from "lucide-react";

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

export default function MobileARViewer({ dish, restaurant, isFallback }: MobileARViewerProps) {
  const modelViewerRef = useRef<any>(null);
  const [started, setStarted] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [captureFlash, setCaptureFlash] = useState(false);
  const [showIosWarning, setShowIosWarning] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingStartTimeRef = useRef<number>(0);

  // ── Resolve model URL with local fallback ──
  const modelSrc = dish.model_3d_url || "/models/default_dish.glb";

  // ── Load model-viewer on client, force transparent backgrounds ──
  useEffect(() => {
    console.log("Loading AR from:", dish.model_3d_url);
    console.log("Resolved modelSrc:", modelSrc);

    import("@google/model-viewer");

    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    return () => {
      document.documentElement.style.background = "";
      document.body.style.background = "";
    };
  }, [dish.model_3d_url, modelSrc]);

  // ════════════════════════════════════════════════════
  // ═══  Task 4: Camera Init — User Gesture Trigger ═══
  // ════════════════════════════════════════════════════
  const handleStart = () => {
    setStarted(true);

    // Synchronous activateAR() call from a direct user tap — browsers require this
    const mv = modelViewerRef.current;
    if (mv && typeof mv.activateAR === "function") {
      try {
        mv.activateAR();
      } catch (e) {
        console.warn("AR activation skipped:", e);
      }
    }

    // iOS Fallback Warning
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
      setShowIosWarning(true);
      setTimeout(() => setShowIosWarning(false), 5000);
    }
  };

  // ════════════════════════════════════════════════════
  // ═══  Task 1: Photo Capture (Tap)  ═════════════════
  // ════════════════════════════════════════════════════
  const capturePhoto = async () => {
    const mv = modelViewerRef.current;
    if (!mv || typeof mv.toBlob !== "function") return;
    setIsCapturing(true);

    try {
      // Step 1: Capture the 3D scene as a blob
      const blob: Blob = await mv.toBlob({ mimeType: "image/jpeg", idealAspect: true });
      const bitmap = await createImageBitmap(blob);

      // Step 2: Draw onto a temp canvas for watermarking
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0);

      // Step 3: Apply watermark — top-right corner at 30% opacity
      applyWatermark(ctx, canvas.width, canvas.height);

      // Step 4: Convert back to blob
      const finalBlob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.92)
      );

      // Step 5: Flash effect
      setCaptureFlash(true);
      setTimeout(() => setCaptureFlash(false), 200);

      // Step 6: Local save via download
      const fileName = `VisionDine_${dish.name.replace(/\s+/g, "_")}_${Date.now()}.jpg`;
      downloadBlob(finalBlob, fileName);
    } catch (err) {
      console.error("Photo capture failed:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  // ════════════════════════════════════════════════════
  // ═══  Task 2: Video Recording (Long Press)  ════════
  // ════════════════════════════════════════════════════
  const startRecording = useCallback(() => {
    const mv = modelViewerRef.current;
    if (!mv) return;

    try {
      // Access model-viewer's internal canvas through shadow DOM
      const canvas = mv.shadowRoot?.querySelector("canvas") as HTMLCanvasElement | null;
      if (!canvas) {
        console.warn("Could not access model-viewer canvas for recording");
        return;
      }

      const stream = canvas.captureStream(30); // 30 FPS

      // Try MP4 first (better mobile support), fall back to WebM
      let mimeType = "video/webm; codecs=vp9";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("video/mp4")) {
          mimeType = "video/mp4";
        } else if (MediaRecorder.isTypeSupported("video/webm; codecs=vp9")) {
          mimeType = "video/webm; codecs=vp9";
        } else if (MediaRecorder.isTypeSupported("video/webm")) {
          mimeType = "video/webm";
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      recordedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const ext = mimeType.includes("mp4") ? "mp4" : "webm";
        const videoBlob = new Blob(recordedChunksRef.current, { type: mimeType.split(";")[0] });
        const fileName = `VisionDine_${dish.name.replace(/\s+/g, "_")}_${Date.now()}.${ext}`;
        downloadBlob(videoBlob, fileName);
        setIsRecording(false);
      };

      mediaRecorderRef.current = recorder;
      recordingStartTimeRef.current = Date.now();
      recorder.start(100); // Collect data every 100ms
      setIsRecording(true);
    } catch (err) {
      console.error("Video recording failed to start:", err);
    }
  }, [dish.name]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // ── Shutter handlers: Tap = photo, Long press = video ──
  const handleShutterDown = () => {
    longPressTimerRef.current = setTimeout(() => {
      startRecording();
    }, 500);
  };

  const handleShutterUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (isRecording) {
      stopRecording();
    } else {
      capturePhoto();
    }
  };

  const handleShutterLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (isRecording) stopRecording();
  };

  // ════════════════════════════════════════════════════
  // ═══  Helpers  ═════════════════════════════════════
  // ════════════════════════════════════════════════════

  /** Draws "VISION DINE" + restaurant name at top-right, 30% opacity */
  const applyWatermark = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#B8960C";
    ctx.textAlign = "right";

    // Brand name
    const brandSize = Math.max(16, Math.floor(w * 0.028));
    ctx.font = `bold ${brandSize}px sans-serif`;
    ctx.fillText("VISION DINE", w - 24, 36);

    // Restaurant name
    const restSize = Math.max(11, Math.floor(w * 0.018));
    ctx.font = `${restSize}px sans-serif`;
    ctx.fillText(restaurant.name, w - 24, 36 + brandSize + 4);

    ctx.restore();
  };

  /** Trigger a local file download — no Supabase upload */
  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    // Cleanup after small delay for mobile browsers
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${dish.name} — Vision Dine`, url: window.location.href });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  // Recording timer display
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  useEffect(() => {
    if (!isRecording) { setRecordingElapsed(0); return; }
    const interval = setInterval(() => {
      setRecordingElapsed(Math.floor((Date.now() - recordingStartTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const ModelViewerElement = "model-viewer" as any;

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: "transparent" }}>

      {/* ═══════════════════════════════════════════════ */}
      {/* ═══  "TAP TO ENTER AR" Overlay  ══════════════ */}
      {/* ═══════════════════════════════════════════════ */}
      {!started && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
          <div className="mb-8">
            <h1 className="text-[#B8960C] text-[13px] font-bold tracking-[0.5em] uppercase text-center">Vision Dine</h1>
            <p className="text-white/15 text-[10px] tracking-[0.3em] uppercase text-center mt-2">Augmented Reality Menu</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-10 max-w-[280px] text-center">
            <UtensilsCrossed className="h-6 w-6 text-[#B8960C] mx-auto mb-3" />
            <h2 className="text-white text-lg font-bold mb-1">{dish.name}</h2>
            <p className="text-white/40 text-xs leading-relaxed">
              {dish.description || "Tap below to view this dish in augmented reality."}
            </p>
          </div>

          <button
            onClick={handleStart}
            className="px-10 py-4 bg-[#B8960C] text-white rounded-full font-bold text-[12px] tracking-[0.25em] uppercase shadow-2xl shadow-[#B8960C]/20 border border-[#d4a80e]/30 flex items-center gap-3 active:scale-95 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            Enter AR Experience
          </button>

          {isFallback && (
            <p className="text-white/10 text-[9px] mt-6 tracking-widest uppercase">Demo Mode</p>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ═══  MODEL-VIEWER (Always in DOM)  ═══════════ */}
      {/* ═══════════════════════════════════════════════ */}
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
        scale={`${dish.scale_factor} ${dish.scale_factor} ${dish.scale_factor}`}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          background: "transparent",
          "--poster-color": "transparent",
          zIndex: 0,
          opacity: started ? 1 : 0,
          pointerEvents: started ? "auto" : "none"
        } as React.CSSProperties}
      >
        <button slot="ar-button" style={{ display: "none" }} />
      </ModelViewerElement>

      {/* ── Capture Flash Effect ── */}
      {captureFlash && (
        <div className="absolute inset-0 z-[200] bg-white pointer-events-none animate-[fadeOut_200ms_ease-out_forwards]" />
      )}

      {/* ── iOS Warning Toast ── */}
      {showIosWarning && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[100] bg-black/80 backdrop-blur-md text-white text-[10px] uppercase tracking-widest px-6 py-3 rounded-full border border-white/20 text-center whitespace-nowrap">
          iOS Detected · Native AR may be limited
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ═══  Active Session UI (z-100)  ══════════════ */}
      {/* ═══════════════════════════════════════════════ */}
      {started && (
        <div className="absolute inset-0 flex flex-col pointer-events-none" style={{ zIndex: 100 }}>

          {/* ── Top Bar: Brand + Recording Indicator + Close ── */}
          <div className="flex items-center justify-between px-5 pt-14">
            <div className="pointer-events-auto flex items-center gap-3">
              <div className="px-5 py-2.5 bg-white/10 backdrop-blur-xl rounded-full border border-white/10">
                <span className="text-[#B8960C] text-[10px] font-bold tracking-[0.3em] uppercase">Vision Dine</span>
              </div>

              {/* Recording indicator — visible only while recording */}
              {isRecording && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-red-500/20 backdrop-blur-xl rounded-full border border-red-500/30">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-red-400 text-[10px] font-bold tracking-widest uppercase">
                    REC {formatTime(recordingElapsed)}
                  </span>
                </div>
              )}
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

          {/* ── Floating Dish Info ── */}
          <div className="px-5 mb-5">
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

          {/* ═══════════════════════════════════════════ */}
          {/* ═══  SHUTTER BAR (z-100)  ════════════════ */}
          {/* ═══════════════════════════════════════════ */}
          <div className="px-5 pb-4">
            <div className="pointer-events-auto bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/10 px-5 py-3">
              <div className="flex items-center justify-between">

                {/* Dish Thumbnail */}
                <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-white/15 flex-shrink-0">
                  {dish.image_2d_url ? (
                    <img src={dish.image_2d_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-white/5 flex items-center justify-center">
                      <UtensilsCrossed className="h-3.5 w-3.5 text-white/30" />
                    </div>
                  )}
                </div>

                {/* ── THE SHUTTER BUTTON ── */}
                <button
                  onPointerDown={handleShutterDown}
                  onPointerUp={handleShutterUp}
                  onPointerLeave={handleShutterLeave}
                  onPointerCancel={handleShutterLeave}
                  disabled={isCapturing}
                  className="relative h-[68px] w-[68px] rounded-full flex items-center justify-center group disabled:opacity-50 select-none touch-none"
                  style={{ WebkitTouchCallout: "none" }}
                >
                  {/* Outer ring */}
                  <div
                    className={`absolute inset-0 rounded-full border-[3px] transition-all duration-200 ${
                      isRecording
                        ? "border-red-500 scale-110"
                        : "border-white/30"
                    }`}
                  />
                  {/* Inner circle */}
                  <div
                    className={`rounded-full flex items-center justify-center transition-all duration-200 ${
                      isRecording
                        ? "h-[40px] w-[40px] bg-red-500 animate-pulse"
                        : "h-[54px] w-[54px] bg-gradient-to-b from-[#d4a80e] to-[#B8960C] group-active:scale-90"
                    }`}
                  >
                    {isCapturing && (
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    )}
                  </div>
                </button>

                {/* Share */}
                <button
                  onClick={handleShareLink}
                  className="h-10 w-10 flex items-center justify-center text-white/30 active:scale-90 transition-all flex-shrink-0"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Status Text ── */}
          <div className="py-2 text-center">
            <p className="text-[8px] font-bold tracking-[0.4em] uppercase text-white/20">
              {isRecording
                ? "Hold to Record · Release to Save"
                : "Tap for Photo · Hold for Video"}
            </p>
          </div>
        </div>
      )}

      {/* ── Inline Styles for flash animation ── */}
      <style>{`
        @keyframes fadeOut {
          0% { opacity: 0.9; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
