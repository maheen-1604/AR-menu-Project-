"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Search,
  MoreVertical,
  Loader2,
  UtensilsCrossed
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Restaurant {
  id: string;
  name: string;
  logo_url: string;
  created_at: string;
}

export default function RestaurantListPage() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRestaurants() {
      try {
        const { data, error } = await supabase
          .from("restaurants")
          .select("id, name, logo_url, created_at")
          .order("created_at", { ascending: false });

        if (!error && data) setRestaurants(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRestaurants();
  }, []);

  // Helper to generate a display slug
  const generateSlug = (name: string, id: string) => {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const shortId = id.split('-')[0].substring(0, 3); // Take first 3 chars of ID for uniqueness
    return `${cleanName}-${shortId}`;
  };

  // Helper to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col animate-fade-in pb-20">
      
      {/* ── Main Content ── */}
      <main className="flex-1 px-8 lg:px-24 py-12 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#0F172A] leading-tight mb-2">Restaurants Directory</h1>
            <p className="text-[#64748B] text-sm">Manage all client accounts</p>
          </div>
          <button 
            onClick={() => router.push("/restaurants/new")}
            className="h-10 px-6 bg-[#0F172A] hover:bg-black text-white text-sm font-semibold rounded-lg shadow-md flex items-center gap-2 transition-all"
          >
            <Plus className="h-4 w-4" />
            Onboard New Client
          </button>
        </div>

        {/* ── Search Bar ── */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name, slug or ID..." 
            className="w-full h-11 pl-12 pr-4 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0F172A] transition-colors shadow-sm"
          />
        </div>

        {/* ── Table Area ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 text-[#0F172A] animate-spin" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Loading Directory...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-8 py-5 text-xs font-bold text-[#64748B] w-[35%]">Restaurant Name</th>
                    <th className="px-6 py-5 text-xs font-bold text-[#64748B] w-[25%]">Slug (URL)</th>
                    <th className="px-6 py-5 text-xs font-bold text-[#64748B] w-[15%]">Status</th>
                    <th className="px-6 py-5 text-xs font-bold text-[#64748B] w-[15%]">Created At</th>
                    <th className="px-6 py-5 text-xs font-bold text-[#64748B] w-[10%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {restaurants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                            <UtensilsCrossed className="h-5 w-5 text-gray-300" />
                          </div>
                          <p className="text-sm font-semibold text-gray-900 mb-1">No restaurants found</p>
                          <p className="text-xs text-gray-500">Get started by onboarding your first client.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    restaurants.map((res) => (
                      <tr 
                        key={res.id} 
                        className="hover:bg-gray-50 transition-colors group"
                      >
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {res.logo_url ? (
                                <img src={res.logo_url} alt={res.name} className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-gray-400 font-bold text-sm">
                                  {res.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-bold text-[#0F172A]">{res.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-[#64748B]">{generateSlug(res.name, res.id)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-100">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            <span className="text-[11px] font-bold text-green-700">Active</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-[#64748B]">{formatDate(res.created_at)}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => router.push(`/restaurants/${res.id}/dishes`)}
                            className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                            title="Manage Menu"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
