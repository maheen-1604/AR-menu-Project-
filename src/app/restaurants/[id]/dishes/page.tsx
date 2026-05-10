"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Search,
  Filter,
  Box,
  QrCode,
  Edit2,
  Settings,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Restaurant {
  id: string;
  name: string;
  logo_url: string;
  banner_url: string;
}

interface Dish {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  image_2d_url: string;
  model_3d_url: string;
}

export default function MenuManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: resData } = await supabase.from("restaurants").select("*").eq("id", id).single();
      setRestaurant(resData);

      const { data: dishData } = await supabase.from("dishes").select("*").eq("restaurant_id", id).order("created_at", { ascending: false });
      setDishes(dishData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB] gap-4">
        <Loader2 className="h-10 w-10 text-[#0F172A] animate-spin" />
        <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-gray-400">Loading Menu...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] animate-fade-in pb-20">
      
      {/* ── Top Navigation ── */}
      <div className="px-8 lg:px-24 pt-8 pb-4 max-w-7xl mx-auto">
        <button 
          onClick={() => router.push("/restaurants")}
          className="flex items-center gap-2 text-[#64748B] hover:text-[#0F172A] transition-colors mb-4 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-xs font-bold uppercase tracking-widest">Directory</span>
        </button>
      </div>

      <main className="px-8 lg:px-24 max-w-7xl mx-auto space-y-6">
        
        {/* ── Restaurant Header Card ── */}
        <div className="bg-[#0F172A] rounded-2xl p-8 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden shrink-0">
              {restaurant?.logo_url ? (
                <img src={restaurant.logo_url} alt="Logo" className="h-full w-full object-cover p-1 rounded-full" />
              ) : (
                <span className="text-white text-2xl font-bold">{restaurant?.name.charAt(0)}</span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{restaurant?.name}</h1>
              <div className="flex items-center gap-3 text-sm text-[#94A3B8]">
                <span>Location</span>
                <span className="h-1 w-1 bg-[#475569] rounded-full" />
                <span>{dishes.length} Items</span>
                <span className="h-1 w-1 bg-[#475569] rounded-full" />
                <span className="flex items-center gap-1.5 text-white">
                  <Box className="h-4 w-4" />
                  WebAR Enabled
                </span>
              </div>
            </div>
          </div>
          <button className="h-10 px-5 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/10 flex items-center gap-2 transition-colors text-sm font-semibold">
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>

        {/* ── Menu Items Table Card ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-8">
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
            <div>
              <h2 className="text-xl font-bold text-[#0F172A] mb-1">Menu Items</h2>
              <p className="text-[#64748B] text-sm">Manage dish details and AR models</p>
            </div>
            <button 
              onClick={() => router.push(`/restaurants/${id}/dishes/new`)}
              className="h-10 px-6 bg-[#0F172A] hover:bg-black text-white text-sm font-semibold rounded-lg shadow-md flex items-center gap-2 transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Dish
            </button>
          </div>

          <div className="flex gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8]" />
              <input 
                type="text" 
                placeholder="Search food items..." 
                className="w-full h-12 pl-12 pr-4 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0F172A] transition-colors"
              />
            </div>
            <button className="h-12 px-6 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-[#475569] hover:bg-gray-50 flex items-center gap-2 transition-colors">
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-2 py-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest w-[40%]">Dish Name</th>
                  <th className="px-2 py-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest w-[20%]">Price</th>
                  <th className="px-2 py-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest w-[15%]">AR Status</th>
                  <th className="px-2 py-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest w-[15%]">QR</th>
                  <th className="px-2 py-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest w-[10%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dishes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#64748B]">No menu items found.</td>
                  </tr>
                ) : (
                  dishes.map((dish) => (
                    <tr key={dish.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-2 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                            {dish.image_2d_url ? (
                              <img src={dish.image_2d_url} alt={dish.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-gray-50">
                                <span className="text-gray-300 text-xs">No img</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#0F172A]">{dish.name}</p>
                            <p className="text-xs text-[#94A3B8] truncate max-w-[200px]">{dish.description || dish.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-4">
                        <span className="text-sm font-bold text-[#0F172A]">USD {dish.price}</span>
                      </td>
                      <td className="px-2 py-4">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${dish.model_3d_url ? 'bg-green-50' : 'bg-gray-100'}`}>
                          <Box className={`h-4 w-4 ${dish.model_3d_url ? 'text-green-500' : 'text-gray-400'}`} />
                        </div>
                      </td>
                      <td className="px-2 py-4">
                        <button className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-[#64748B] transition-colors">
                          <QrCode className="h-4 w-4" />
                        </button>
                      </td>
                      <td className="px-2 py-4">
                        <button className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-[#64748B] transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
