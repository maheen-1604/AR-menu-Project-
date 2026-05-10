import React from "react";
import { createClient } from "@supabase/supabase-js";
import MobileARViewer from "@/components/ar/MobileARViewer";
import { notFound } from "next/navigation";

// Default fallback data for when Supabase is unreachable
const FALLBACK_DISH = {
  id: "demo",
  name: "Chef's Signature Dish",
  price: 45,
  description: "A masterfully crafted culinary experience, presented in immersive augmented reality.",
  model_3d_url: "/models/default.glb",
  image_2d_url: "",
  scale_factor: 1.0,
};

const FALLBACK_RESTAURANT = {
  name: "Vision Dine",
  logo_url: "",
};

export default async function DishARPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let dish: any = null;
  let restaurant: any = null;
  let isFallback = false;

  try {
    // Create a fresh client for server-side fetching
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from("dishes")
      .select(`
        *,
        restaurant:restaurants (
          name,
          logo_url
        )
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("Supabase fetch failed:", error);
      // Use fallback instead of 404
      dish = FALLBACK_DISH;
      restaurant = FALLBACK_RESTAURANT;
      isFallback = true;
    } else {
      dish = {
        ...data,
        scale_factor: data.scale_factor ?? 1.0
      };
      restaurant = data.restaurant;
    }
  } catch (err) {
    console.error("Network error fetching dish:", err);
    // Use fallback on network/CORS errors
    dish = FALLBACK_DISH;
    restaurant = FALLBACK_RESTAURANT;
    isFallback = true;
  }

  return (
    <MobileARViewer
      dish={dish}
      restaurant={restaurant}
      isFallback={isFallback}
    />
  );
}
