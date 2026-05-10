"use client";

import React, { useState } from "react";
import Modal from "../ui/Modal";
import { supabase } from "@/lib/supabase";
import { 
  Package, 
  Tag, 
  DollarSign, 
  Image as ImageIcon, 
  Box, 
  FileText,
  Loader2 
} from "lucide-react";

interface AddDishModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  onSuccess: () => void;
}

export default function AddDishModal({
  isOpen,
  onClose,
  restaurantId,
  onSuccess,
}: AddDishModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Main");
  const [description, setDescription] = useState("");
  const [image2d, setImage2d] = useState("");
  const [model3d, setModel3d] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from("dishes")
        .insert([
          {
            restaurant_id: restaurantId,
            name,
            price: parseFloat(price),
            category,
            description,
            image_2d_url: image2d,
            model_3d_url: model3d,
            scale_factor: 1.0,
          },
        ]);

      if (insertError) throw insertError;

      // Reset
      setName("");
      setPrice("");
      setCategory("Main");
      setDescription("");
      setImage2d("");
      setModel3d("");
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error adding dish:", err);
      setError(err.message || "Failed to create dish.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Culinary Masterpiece">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg italic">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Dish Name */}
          <div className="col-span-2">
            <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-1.5">
              Dish Identity
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Wagyu Truffle Tartare"
                className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:border-dark-gold outline-none transition-all"
              />
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-1.5">
              Price (USD)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="45.00"
                className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:border-dark-gold outline-none transition-all"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-1.5">
              Category
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:border-dark-gold outline-none appearance-none transition-all"
              >
                <option>Starter</option>
                <option>Main</option>
                <option>Dessert</option>
                <option>Drink</option>
                <option>Special</option>
              </select>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-1.5">
            Culinary Description
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-300" />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the flavors, textures, and origins..."
              className="w-full min-h-[80px] pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:border-dark-gold outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* 2D Image URL */}
        <div>
          <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-1.5">
            2D Preview Image URL
          </label>
          <div className="relative">
            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
            <input
              type="url"
              value={image2d}
              onChange={(e) => setImage2d(e.target.value)}
              placeholder="https://.../dish-photo.jpg"
              className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:border-dark-gold outline-none transition-all"
            />
          </div>
        </div>

        {/* 3D Model URL */}
        <div>
          <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-1.5">
            3D Model URL (.glb / .usdz)
          </label>
          <div className="relative">
            <Box className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
            <input
              type="url"
              value={model3d}
              onChange={(e) => setModel3d(e.target.value)}
              placeholder="https://.../dish-model.glb"
              className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:border-dark-gold outline-none transition-all"
            />
          </div>
          <p className="mt-1 text-[10px] text-gray-400 italic">Provide a GLB for Android/Web and USDZ for iOS compatibility.</p>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 text-xs font-bold tracking-widest uppercase text-gray-400 hover:text-gray-600 transition-colors"
          >
            Discard
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-[2] h-11 bg-dark-gold hover:bg-[#a07a0a] text-white text-[11px] font-bold tracking-[0.2em] uppercase rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Add to Menu"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
