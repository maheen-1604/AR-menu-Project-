"use client";

import React, { useState } from "react";
import Modal from "../ui/Modal";
import { supabase } from "@/lib/supabase";
import { Store, Image as ImageIcon, Link as LinkIcon, Loader2 } from "lucide-react";

interface AddRestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddRestaurantModal({
  isOpen,
  onClose,
  onSuccess,
}: AddRestaurantModalProps) {
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Unauthorized. Please log in again.");

      // 2. Insert restaurant
      const { error: insertError } = await supabase
        .from("restaurants")
        .insert([
          {
            name,
            logo_url: logoUrl,
            banner_url: bannerUrl,
            owner_id: user.id,
            theme_color: "#b8860b", // Default gold
          },
        ]);

      if (insertError) throw insertError;

      // 3. Cleanup and notify
      setName("");
      setLogoUrl("");
      setBannerUrl("");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error adding restaurant:", err);
      setError(err.message || "Failed to create restaurant.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Restaurant">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Restaurant Name */}
        <div>
          <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-2">
            Restaurant Name
          </label>
          <div className="relative">
            <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., L'Essence Paris"
              className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-dark-gold focus:ring-1 focus:ring-dark-gold outline-none transition-all"
            />
          </div>
        </div>

        {/* Logo URL */}
        <div>
          <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-2">
            Logo URL
          </label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-dark-gold focus:ring-1 focus:ring-dark-gold outline-none transition-all"
            />
          </div>
        </div>

        {/* Banner URL */}
        <div>
          <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-2">
            Banner URL
          </label>
          <div className="relative">
            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="url"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="https://example.com/banner.jpg"
              className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-dark-gold focus:ring-1 focus:ring-dark-gold outline-none transition-all"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-[2] h-12 bg-dark-gold hover:bg-[#a07a0a] text-white text-sm font-bold tracking-widest uppercase rounded-lg shadow-lg shadow-gold/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Initialize Restaurant"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
