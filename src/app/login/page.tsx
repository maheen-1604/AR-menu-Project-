"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Rapid Prototyping Bypass
    setTimeout(() => {
      router.push("/restaurants");
    }, 800);
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#FAFAFA] animate-fade-in">
      {/* ── Background Pattern (Subtle Gold Circles) ── */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full border border-[#B8960C]/10" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[900px] w-[900px] rounded-full border border-[#B8960C]/5" />
      </div>

      {/* ── Card Container ── */}
      <div className="relative z-10 w-full max-w-[500px] mx-4 rounded-3xl bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden animate-slide-up">
        <div className="p-10 sm:p-14">
          {/* Logo & Branding */}
          <div className="text-center mb-10">
            <h1 className="font-serif text-[2.25rem] font-bold text-gray-900 leading-tight">Vision Dine</h1>
            <p className="mt-2 text-sm italic text-gray-400 tracking-wide">Redefining the Future of Fine Dining</p>
          </div>

          <h2 className="font-serif text-2xl font-bold text-gray-900 mb-8">Authorize Access</h2>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-2">Email Address</label>
                <input
                  type="email"
                  defaultValue="usaidowais123@gmail.com"
                  className="w-full h-12 px-4 bg-[#FAF8F4] border border-gray-100 rounded-xl text-sm focus:border-[#B8960C] outline-none transition-all"
                  placeholder="name@visiondine.com"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    defaultValue="admin123"
                    className="w-full h-12 px-4 pr-12 bg-[#FAF8F4] border border-gray-100 rounded-xl text-sm focus:border-[#B8960C] outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-200 text-[#B8960C] focus:ring-[#B8960C]" />
                <span className="text-sm text-gray-500">Stay authorized</span>
              </label>
              <a href="#" className="text-sm font-semibold text-[#B8960C] hover:underline">Forgot credentials?</a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full h-14 bg-[#B8960C] hover:bg-[#a0830a] text-white text-[13px] font-bold tracking-[0.2em] uppercase rounded-xl shadow-lg shadow-gold/20 transition-all flex items-center justify-center gap-2 overflow-hidden"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Authorize Access"
              )}
            </button>
          </form>

          <div className="mt-12 flex items-center justify-between border-t border-gray-50 pt-8">
            <div className="flex items-center gap-2 text-gray-300">
              <Lock className="h-4 w-4" />
              <span className="text-xs font-semibold tracking-wider uppercase">Secure Portal</span>
            </div>
            <div className="flex gap-6">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-[#B8960C]">Support</span>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-[#B8960C]">Docs</span>
            </div>
          </div>
        </div>
      </div>

      <p className="relative z-10 mt-8 text-[11px] font-bold tracking-[0.4em] uppercase text-gray-300">© 2024 Vision Dine Systems</p>
    </main>
  );
}
