"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (data.user) {
        // Successful login
        router.push("/admin/dashboard");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Invalid login credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-matte-black">
      {/* ── Animated Concentric Ripple Background ── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute left-1/2 top-1/2 h-[900px] w-[900px] rounded-full border animate-ripple-1"
          style={{ borderColor: "rgba(184,134,11,0.07)" }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-[1300px] w-[1300px] rounded-full border animate-ripple-2"
          style={{ borderColor: "rgba(184,134,11,0.05)" }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-[1700px] w-[1700px] rounded-full border animate-ripple-3"
          style={{ borderColor: "rgba(184,134,11,0.04)" }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-[2100px] w-[2100px] rounded-full border animate-ripple-4"
          style={{ borderColor: "rgba(184,134,11,0.03)" }}
        />

        {/* Soft radial gold glow behind card */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(184,134,11,0.06) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ── Card Container ── */}
      <div
        className="animate-fade-in relative z-10 w-full max-w-[560px] mx-4 rounded-2xl shadow-2xl"
        style={{
          background: "#ffffff",
          boxShadow:
            "0 25px 60px rgba(0,0,0,0.5), 0 0 80px rgba(184,134,11,0.05)",
        }}
      >
        <div className="px-10 pt-12 pb-10 sm:px-14 sm:pt-14 sm:pb-12">
          {/* ── Logo & Branding ── */}
          <div className="text-center mb-10">
            <h1
              className="font-serif text-[2rem] sm:text-[2.25rem] leading-tight tracking-tight"
              style={{ color: "#111111" }}
            >
              Vision Dine
            </h1>
            <p
              className="mt-2 text-sm italic tracking-wide"
              style={{ color: "#9ca3af" }}
            >
              Redefining the Future of Fine Dining
            </p>
          </div>

          {/* ── Welcome Header ── */}
          <h2
            className="font-serif text-xl sm:text-2xl font-semibold mb-6"
            style={{ color: "#111111" }}
          >
            Welcome Back
          </h2>

          {/* ── Error Message ── */}
          {error && (
            <div 
              className="mb-6 p-4 rounded-lg flex items-center gap-3 animate-slide-up"
              style={{ 
                background: "rgba(184, 134, 11, 0.1)", 
                border: "1px solid rgba(184, 134, 11, 0.3)",
                color: "#b8860b"
              }}
            >
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-[11px] font-semibold tracking-[0.15em] uppercase mb-2"
                  style={{ color: "#111111" }}
                >
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="name@visiondine.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-12 px-4 text-sm rounded-lg border bg-white placeholder:text-gray-400"
                  style={{
                    color: "#111111",
                    borderColor: "#d1d5db",
                  }}
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="login-password"
                  className="block text-[11px] font-semibold tracking-[0.15em] uppercase mb-2"
                  style={{ color: "#111111" }}
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-12 px-4 pr-11 text-sm rounded-lg border bg-white placeholder:text-gray-400"
                    style={{
                      color: "#111111",
                      borderColor: "#d1d5db",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between pt-1">
              <label
                htmlFor="remember-me"
                className="flex items-center gap-2 cursor-pointer select-none"
              >
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                />
                <span
                  className="text-sm"
                  style={{ color: "#374151" }}
                >
                  Remember me
                </span>
              </label>
              <a
                href="#"
                className="text-sm font-medium transition-colors hover:underline"
                style={{ color: "#b8860b" }}
              >
                Forgot credentials?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full h-[52px] rounded-lg text-white text-[13px] font-bold tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                background: isLoading
                  ? "#a07a0a"
                  : "linear-gradient(135deg, #b8860b 0%, #9a7209 100%)",
                boxShadow: "0 4px 16px rgba(184,134,11,0.25)",
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Authorizing…
                </span>
              ) : (
                "Authorize Access"
              )}
            </button>
          </form>

          {/* ── Security / Support Footer ── */}
          <div className="mt-10 flex items-center justify-between border-t pt-6" style={{ borderColor: "#e8e8e8" }}>
            <div className="flex items-center gap-2">
              <Lock
                className="h-4 w-4"
                style={{ color: "#9ca3af" }}
                strokeWidth={1.5}
              />
              <span
                className="text-[13px] tracking-wide"
                style={{ color: "#9ca3af" }}
              >
                Secure Enterprise Portal
              </span>
            </div>
            <div className="flex items-center gap-5">
              <a href="#" className="text-[13px] font-medium" style={{ color: "#374151" }}>Support</a>
              <a href="#" className="text-[13px] font-medium" style={{ color: "#374151" }}>Documentation</a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Copyright ── */}
      <p
        className="animate-fade-in relative z-10 mt-8 text-[11px] tracking-[0.2em] uppercase"
        style={{ color: "rgba(184,134,11,0.35)" }}
      >
        © 2024 Vision Dine Hospitality Systems
      </p>
    </main>
  );
}
