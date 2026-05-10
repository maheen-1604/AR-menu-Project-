"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Plus, 
  UtensilsCrossed, 
  Loader2, 
  ExternalLink,
  QrCode,
  DollarSign,
  Box
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import AddDishModal from "@/components/admin/AddDishModal";

/* ───────────────────────── Types ───────────────────────── */

interface Restaurant {
  id: string;
  name: string;
  logo_url: string;
  banner_url: string;
  theme_color: string;
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

/* ──────────────────────── Component ───────────────────── */

export default function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // 1. Fetch Restaurant
      const { data: resData, error: resError } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", id)
        .single();
      
      if (resError) throw resError;
      setRestaurant(resData);

      // 2. Fetch Dishes
      const { data: dishData, error: dishError } = await supabase
        .from("dishes")
        .select("*")
        .eq("restaurant_id", id)
        .order("created_at", { ascending: false });

      if (dishError) throw dishError;
      setDishes(dishData || []);

    } catch (err) {
      console.error("Error fetching restaurant data:", err);
      router.push("/admin/dashboard");
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f7f5] gap-4">
        <Loader2 className="h-10 w-10 text-dark-gold animate-spin" />
        <p className="text-sm font-bold tracking-[0.2em] text-gray-400 uppercase">Synchronizing Menu...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f7f5]">
      {/* ── Banner Header ── */}
      <div className="relative h-[300px] w-full overflow-hidden bg-matte-black">
        {restaurant?.banner_url ? (
          <Image 
            src={restaurant.banner_url} 
            alt="Banner" 
            fill 
            className="object-cover opacity-60"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-matte-black to-gray-900" />
        )}
        
        {/* Navigation Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        <div className="absolute top-8 left-8 lg:left-12">
          <button 
            onClick={() => router.push("/admin/dashboard")}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
          >
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            <span className="text-xs font-bold tracking-widest uppercase">Back to Portfolio</span>
          </button>
        </div>

        <div className="absolute bottom-10 left-8 lg:left-12 flex items-end gap-6">
          <div className="relative h-[100px] w-[100px] rounded-xl border-4 border-white shadow-2xl bg-white overflow-hidden shrink-0">
            {restaurant?.logo_url ? (
              <Image src={restaurant.logo_url} alt="Logo" fill className="object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <UtensilsCrossed className="h-8 w-8 text-gray-200" />
              </div>
            )}
          </div>
          <div className="mb-1">
            <h1 className="font-serif text-4xl font-bold text-white mb-2">{restaurant?.name}</h1>
            <div className="flex items-center gap-4 text-white/60 text-xs font-bold tracking-[0.15em] uppercase">
              <span>{dishes.length} Masterpieces</span>
              <span className="h-1 w-1 rounded-full bg-white/30" />
              <span>Digital AR Menu Active</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 right-8 lg:right-12">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg px-6 py-4 text-[12px] font-bold tracking-[0.2em] uppercase text-white bg-dark-gold hover:bg-[#a07a0a] transition-all shadow-xl shadow-gold/20"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add New Dish
          </button>
        </div>
      </div>

      {/* ── Menu Section ── */}
      <main className="flex-1 px-8 lg:px-12 py-12">
        {dishes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-gray-200">
            <UtensilsCrossed className="h-12 w-12 text-gray-100 mb-4" />
            <h2 className="font-serif text-xl font-bold text-gray-400 mb-1">Your Menu is Empty</h2>
            <p className="text-gray-400 text-sm mb-6">Begin by adding your first signature dish to the AR experience.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-dark-gold text-xs font-bold tracking-[0.2em] uppercase hover:underline"
            >
              + Create Masterpiece
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {dishes.map((dish) => (
              <div 
                key={dish.id} 
                className="group relative bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300"
              >
                {/* Image / Thumbnail */}
                <div className="relative h-[200px] bg-gray-50">
                  {dish.image_2d_url ? (
                    <Image src={dish.image_2d_url} alt={dish.name} fill className="object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center italic text-gray-300 text-xs">No Image</div>
                  )}
                  
                  {/* Category Badge */}
                  <div className="absolute top-3 right-3 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-[10px] font-bold tracking-widest text-white uppercase">
                    {dish.category}
                  </div>

                  {/* AR Action Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button 
                      onClick={() => window.open(`/dish/${dish.id}`, "_blank")}
                      className="p-3 bg-white rounded-full text-gray-900 hover:bg-dark-gold hover:text-white transition-all shadow-lg"
                      title="Preview AR View"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </button>
                    <button 
                      className="p-3 bg-white rounded-full text-gray-900 hover:bg-dark-gold hover:text-white transition-all shadow-lg"
                      title="Generate QR Code"
                    >
                      <QrCode className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-serif text-lg font-bold text-gray-900 leading-tight">{dish.name}</h3>
                    <span className="text-dark-gold font-bold text-sm tracking-tight flex items-center">
                      <DollarSign className="h-3.5 w-3.5" />
                      {dish.price}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-4 italic">
                    {dish.description || "No description provided."}
                  </p>
                  
                  <div className="flex items-center gap-3 border-t border-gray-50 pt-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      <Box className={`h-3 w-3 ${dish.model_3d_url ? 'text-green-500' : 'text-gray-300'}`} />
                      {dish.model_3d_url ? '3D Active' : 'No 3D Model'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <AddDishModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        restaurantId={id}
        onSuccess={fetchData}
      />

      {/* Shared Footer */}
      <footer className="px-8 lg:px-12 py-6 bg-[#f0efed] border-t border-[#e2e1de] flex justify-between items-center">
        <p className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">Vision Dine Hospitality Systems</p>
        <div className="flex gap-6">
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest cursor-pointer hover:text-dark-gold transition-colors">Support</span>
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest cursor-pointer hover:text-dark-gold transition-colors">Documentation</span>
        </div>
      </footer>
    </div>
  );
}
