"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Upload, 
  Image as ImageIcon, 
  ArrowLeft,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AddRestaurantPage() {
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const uploadFile = async (file: File, path: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!name) {
      setError("Please enter a restaurant name.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let logoUrl = "";
      let bannerUrl = "";

      // 1. Upload Logo if present
      if (logoFile) {
        logoUrl = await uploadFile(logoFile, 'logos');
      }

      // 2. Upload Banner if present
      if (bannerFile) {
        bannerUrl = await uploadFile(bannerFile, 'banners');
      }

      // 3. Insert into Database
      // Note: We bypass owner_id strict check for rapid prototyping, assuming RLS allows or we use anon key
      // If RLS blocks this, we might need to handle auth, but user requested bypass. 
      // We will insert without owner_id if it's nullable or handle it.
      // Let's check if owner_id is required. The migration script says `owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE`.
      // If the user wants to test without auth, they might hit an RLS issue or foreign key issue.
      // For the hackathon, we might want to insert a dummy owner_id or just insert if RLS is disabled.
      // I'll attempt the insert. If it fails due to auth, I'll log it.
      
      const { data: userData } = await supabase.auth.getUser();
      const ownerId = userData?.user?.id || null; // Might be null if unauthenticated

      const insertData: any = {
        name,
        logo_url: logoUrl,
        banner_url: bannerUrl,
        theme_color: "#B8960C"
      };

      if (ownerId) {
        insertData.owner_id = ownerId;
      }

      const { error: insertError } = await supabase
        .from("restaurants")
        .insert([insertData]);

      if (insertError) {
        throw insertError;
      }

      // 4. Redirect on success
      router.push("/restaurants");

    } catch (err: any) {
      console.error("Error creating restaurant:", err);
      setError(err.message || "An error occurred while creating the restaurant.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-20 animate-fade-in">
      {/* ── Header ── */}
      <header className="px-8 lg:px-24 pt-12 pb-8">
        <button 
          onClick={() => router.push("/restaurants")}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-xs font-bold uppercase tracking-widest">Back to Portfolio</span>
        </button>
        
        <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Add New Restaurant</h1>
        <p className="text-[#64748B] text-sm">Configure basic details to initialize a new tenant workspace.</p>
      </header>

      <main className="px-8 lg:px-24 max-w-5xl mx-auto space-y-6">
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        {/* ── Section 1: Restaurant Name ── */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <label className="block text-sm font-bold text-[#0F172A] mb-2">Restaurant Name</label>
          <p className="text-xs text-[#64748B] mb-6">Enter the official name of the restaurant as it should appear in the menu.</p>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. The Coastal Catch" 
            className="w-full h-14 px-6 bg-[#F8F9FB] border border-gray-100 rounded-xl text-sm outline-none focus:border-[#B8960C] transition-all"
          />
        </section>

        {/* ── Section 2: Visual Identity ── */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-[#0F172A] mb-8">Visual Identity</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Logo Upload */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-[#0F172A]">Brand Logo</label>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={logoInputRef}
                onChange={handleLogoChange}
              />
              <div 
                onClick={() => logoInputRef.current?.click()}
                className="h-48 border-2 border-dashed border-gray-200 rounded-2xl bg-[#F8F9FB] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-[#B8960C] transition-all group overflow-hidden relative"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-4" />
                ) : (
                  <>
                    <div className="h-12 w-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="h-5 w-5 text-[#64748B]" />
                    </div>
                    <span className="text-xs font-bold text-[#0F172A]">Upload Logo</span>
                    <span className="text-[10px] text-[#94A3B8] mt-1">1:1 Ratio, Max 1MB</span>
                  </>
                )}
                {logoPreview && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-bold uppercase tracking-widest">Change</span>
                  </div>
                )}
              </div>
            </div>

            {/* Banner Upload */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-[#0F172A]">Background Banner</label>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={bannerInputRef}
                onChange={handleBannerChange}
              />
              <div 
                onClick={() => bannerInputRef.current?.click()}
                className="h-48 border-2 border-dashed border-gray-200 rounded-2xl bg-[#F8F9FB] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-[#B8960C] transition-all group overflow-hidden relative"
              >
                {bannerPreview ? (
                  <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="h-12 w-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <ImageIcon className="h-5 w-5 text-[#64748B]" />
                    </div>
                    <span className="text-xs font-bold text-[#0F172A]">Upload Banner</span>
                    <span className="text-[10px] text-[#94A3B8] mt-1">Landscape, Max 2MB</span>
                  </>
                )}
                {bannerPreview && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-bold uppercase tracking-widest">Change</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer Actions ── */}
        <div className="flex items-center justify-end gap-6 pt-6">
          <button 
            onClick={() => router.push("/restaurants")}
            className="text-sm font-bold text-[#1e293b] hover:text-black transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isLoading}
            className="h-14 px-10 bg-[#0F172A] hover:bg-black text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
