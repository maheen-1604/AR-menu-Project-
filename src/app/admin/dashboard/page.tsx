"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Bell,
  Settings,
  Plus,
  UtensilsCrossed,
  ChevronRight,
  Loader2,
  LogOut,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import AddRestaurantModal from "@/components/admin/AddRestaurantModal";

/* ───────────────────────── Types ───────────────────────── */

interface Restaurant {
  id: string;
  name: string;
  logo_url: string;
  banner_url: string;
  theme_color: string;
}

/* ─────────────────────── Static Data ──────────────────── */

const NAV_LINKS = [
  { label: "Dashboard", href: "#", active: true },
  { label: "Inventory", href: "#", active: false },
  { label: "Reservations", href: "#", active: false },
  { label: "Analytics", href: "#", active: false },
  { label: "Staff", href: "#", active: false },
];

const FOOTER_LINKS = [
  "Privacy Policy",
  "Terms of Service",
  "Documentation",
  "API Status",
];

/* ──────────────────────── Component ───────────────────── */

export default function DashboardPage() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const fetchRestaurants = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRestaurants(data || []);
    } catch (err) {
      console.error("Error fetching restaurants:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check auth session
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/admin/login");
      } else {
        fetchRestaurants();
      }
    };
    checkAuth();
  }, [router, fetchRestaurants]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#f7f7f5" }}>
      {/* ════════════════════════ NAV BAR ════════════════════════ */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-8 lg:px-12 h-[64px]"
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #ebebeb",
        }}
      >
        <div className="flex items-center gap-10">
          <a href="#" className="flex items-center">
            <span
              className="font-serif text-[1.35rem] font-bold tracking-tight"
              style={{ color: "#111111" }}
            >
              Vision Dine
            </span>
          </a>

          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="relative pb-[20px] pt-[20px] text-[13.5px] font-medium transition-colors"
                style={{
                  color: link.active ? "#b8860b" : "#555555",
                }}
              >
                {link.label}
                {link.active && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full"
                    style={{ background: "#b8860b" }}
                  />
                )}
              </a>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-5">
          <button className="rounded-full p-2 hover:bg-gray-100 transition-colors">
            <Bell className="h-[19px] w-[19px] text-[#444444]" />
          </button>
          <button className="rounded-full p-2 hover:bg-gray-100 transition-colors">
            <Settings className="h-[19px] w-[19px] text-[#444444]" />
          </button>
          <button 
            onClick={handleLogout}
            className="rounded-full p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            title="Logout"
          >
            <LogOut className="h-[19px] w-[19px]" />
          </button>
          <div className="ml-1 h-[34px] w-[34px] overflow-hidden rounded-full ring-2 ring-gray-200 bg-gray-100 flex items-center justify-center">
            <UtensilsCrossed className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </nav>

      {/* ════════════════════════ MAIN CONTENT ════════════════════════ */}
      <main className="flex-1 px-8 lg:px-12 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
          <div>
            <h1 className="font-serif text-[2rem] font-bold leading-tight text-[#111111]">
              Your Restaurants
            </h1>
            <p className="mt-1.5 text-[15px] text-[#888888]">
              Manage and monitor your hospitality portfolio
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg px-6 py-3 text-[12.5px] font-bold tracking-[0.15em] uppercase text-white bg-[#b8860b] shadow-lg shadow-gold/20 hover:bg-[#a07a0a] transition-all"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add New Restaurant
          </button>
        </div>

        {/* ── Loading State ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 text-dark-gold animate-spin" />
            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Fetching Portfolio...</p>
          </div>
        ) : restaurants.length === 0 ? (
          /* ── Empty State ── */
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <UtensilsCrossed className="h-10 w-10 text-gray-200" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-gray-400 mb-2">No Restaurants Found</h2>
            <p className="text-gray-400 mb-8 max-w-sm text-center">Your portfolio is empty. Initialize your first restaurant to start creating your digital menu.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-dark-gold font-bold text-sm tracking-widest uppercase hover:underline"
            >
              + Create your first location
            </button>
          </div>
        ) : (
          /* ── Restaurant Grid ── */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7">
            {restaurants.map((restaurant) => (
              <article
                key={restaurant.id}
                className="group overflow-hidden rounded-xl bg-white transition-all duration-300"
                style={{
                  boxShadow: hoveredCard === restaurant.id ? "0 12px 40px rgba(0,0,0,0.10)" : "0 2px 12px rgba(0,0,0,0.04)",
                  transform: hoveredCard === restaurant.id ? "translateY(-3px)" : "translateY(0)",
                }}
                onMouseEnter={() => setHoveredCard(restaurant.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="relative h-[220px] overflow-hidden bg-gray-100">
                  {restaurant.banner_url ? (
                    <Image
                      src={restaurant.banner_url}
                      alt={restaurant.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-300 italic">No Banner Provided</div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />
                </div>

                <div className="relative px-5 pb-5 pt-8">
                  <div className="absolute -top-7 left-5 flex h-[52px] w-[52px] items-center justify-center rounded-lg border-[3px] border-white bg-[#f5f5f3] shadow-lg overflow-hidden">
                    {restaurant.logo_url ? (
                      <Image 
                        src={restaurant.logo_url} 
                        alt="Logo" 
                        fill 
                        className="object-cover" 
                      />
                    ) : (
                      <UtensilsCrossed className="h-5 w-5 text-gray-300" strokeWidth={1.5} />
                    )}
                  </div>
                  <h3 className="font-serif text-[1.15rem] font-semibold italic text-[#111111]">
                    {restaurant.name}
                  </h3>
                  <button
                    onClick={() => router.push(`/admin/dashboard/${restaurant.id}`)}
                    className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#d5d5d5] py-2.5 text-[13px] font-medium tracking-wide text-[#b8860b] hover:border-[#b8860b] hover:bg-gold/5 transition-all"
                  >
                    Manage Menu
                    <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <AddRestaurantModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchRestaurants}
      />

      {/* Footer */}
      <footer className="mt-auto px-8 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#f0efed] border-t border-[#e2e1de]">
        <p className="text-[13px] text-[#999999]">© 2024 Vision Dine Hospitality. All rights reserved.</p>
        <div className="flex items-center gap-6">
          {FOOTER_LINKS.map((link) => (
            <a key={link} href="#" className="text-[13px] text-[#777777] hover:text-[#b8860b] transition-colors">{link}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
