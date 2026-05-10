import React from "react";
import { supabase } from "@/lib/supabase";
import ARExperience from "@/components/ar/ARExperience";
import { notFound } from "next/navigation";

export default async function DishARPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch Dish and its Parent Restaurant
  const { data: dish, error: dishError } = await supabase
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

  if (dishError || !dish) {
    console.error("Dish not found:", dishError);
    return notFound();
  }

  return (
    <ARExperience 
      dish={dish} 
      restaurant={dish.restaurant} 
    />
  );
}
