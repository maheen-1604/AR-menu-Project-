"use client";

import React, { useState, useRef, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Upload, 
  Image as ImageIcon,
  Box,
  Maximize,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AddNewDishPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  // Fix SSR: Load model-viewer only on the client
  useEffect(() => {
    import("@google/model-viewer");
  }, []);

  // Form State
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("available");

  // Files
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [glbFile, setGlbFile] = useState<File | null>(null);
  const [glbPreview, setGlbPreview] = useState<string | null>(null);
  const [usdzFile, setUsdzFile] = useState<File | null>(null);

  // AR Scaling State
  const [scaleFactor, setScaleFactor] = useState(1.0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, length: 0 });
  const modelViewerRef = useRef<any>(null);

  // Submission State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handlers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGlbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setGlbFile(file);
      setGlbPreview(URL.createObjectURL(file));
    }
  };

  const handleUsdzChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUsdzFile(e.target.files[0]);
    }
  };

  // AR Dimension Logic
  const handleModelLoad = () => {
    if (modelViewerRef.current) {
      // model-viewer exposes getDimensions() which returns {x, y, z} in meters
      const size = modelViewerRef.current.getDimensions();
      if (size) {
        // Convert meters to cm
        setDimensions({
          width: size.x * 100,
          height: size.y * 100,
          length: size.z * 100
        });
      }
    }
  };

  const uploadFile = async (file: File, path: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('images') 
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!name || !price || !category) {
      setError("Please fill in all required fields (Name, Price, Category).");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let imageUrl = "";
      let glbUrl = "";
      let usdzUrl = "";

      if (imageFile) imageUrl = await uploadFile(imageFile, 'dish_images');
      if (glbFile) glbUrl = await uploadFile(glbFile, 'ar_models');
      if (usdzFile) usdzUrl = await uploadFile(usdzFile, 'ar_models');

      const { error: insertError } = await supabase
        .from("dishes")
        .insert([{
          restaurant_id: id,
          name,
          price: parseFloat(price),
          category,
          description,
          image_2d_url: imageUrl,
          model_3d_url: glbUrl,
          scale_factor: scaleFactor
          // status is not in the schema, skipping for prototype
        }]);

      if (insertError) throw insertError;

      router.push(`/restaurants/${id}/dishes`);

    } catch (err: any) {
      console.error("Error creating dish:", err);
      setError(err.message || "An error occurred while creating the dish.");
      setIsLoading(false);
    }
  };

  const ModelViewerElement = "model-viewer" as any;

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-32 animate-fade-in">
      
      {/* ── Header ── */}
      <header className="px-8 lg:px-24 pt-12 pb-8 max-w-7xl mx-auto">
        <button 
          onClick={() => router.push(`/restaurants/${id}/dishes`)}
          className="flex items-center gap-2 text-[#64748B] hover:text-[#0F172A] transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-xs font-bold uppercase tracking-widest">Back to Menu Items</span>
        </button>
        
        <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Add New Dish</h1>
        <p className="text-[#64748B] text-sm">Create a new item for the menu. Fill in the details below.</p>
      </header>

      <main className="px-8 lg:px-24 max-w-7xl mx-auto">
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl text-sm mb-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          
          {/* ── Left Column: Dish Details ── */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Box className="h-5 w-5 text-[#0F172A]" />
                <h2 className="text-lg font-bold text-[#0F172A]">Dish Details</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-[#0F172A] mb-2">Dish Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Truffle Mushroom Burger" 
                    className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0F172A] transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-[#0F172A] mb-2">Price <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="USD 0.00" 
                      className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0F172A] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#0F172A] mb-2">Category <span className="text-red-500">*</span></label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0F172A] transition-colors appearance-none"
                    >
                      <option value="">Select Category</option>
                      <option value="Starters">Starters</option>
                      <option value="Mains">Mains</option>
                      <option value="Desserts">Desserts</option>
                      <option value="Beverages">Beverages</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#0F172A] mb-2">Description</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the ingredients, allergens, or story behind this dish..." 
                    className="w-full h-32 p-4 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0F172A] transition-colors resize-none"
                    maxLength={300}
                  />
                  <div className="text-right text-xs text-[#94A3B8] mt-2">
                    {description.length}/300 characters
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#0F172A] mb-3">Availability Status</label>
                  <div className="flex gap-4">
                    <label className={`flex items-center gap-2 px-4 py-2 border rounded-full cursor-pointer transition-colors ${status === 'available' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input type="radio" name="status" value="available" checked={status === 'available'} onChange={() => setStatus('available')} className="hidden" />
                      <div className={`h-2 w-2 rounded-full ${status === 'available' ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm font-semibold text-[#0F172A]">Available</span>
                    </label>
                    <label className={`flex items-center gap-2 px-4 py-2 border rounded-full cursor-pointer transition-colors ${status === 'sold_out' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input type="radio" name="status" value="sold_out" checked={status === 'sold_out'} onChange={() => setStatus('sold_out')} className="hidden" />
                      <div className={`h-2 w-2 rounded-full ${status === 'sold_out' ? 'bg-orange-500' : 'bg-gray-300'}`} />
                      <span className="text-sm font-semibold text-[#0F172A]">Sold Out</span>
                    </label>
                    <label className={`flex items-center gap-2 px-4 py-2 border rounded-full cursor-pointer transition-colors ${status === 'hidden' ? 'border-gray-500 bg-gray-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input type="radio" name="status" value="hidden" checked={status === 'hidden'} onChange={() => setStatus('hidden')} className="hidden" />
                      <div className={`h-2 w-2 rounded-full ${status === 'hidden' ? 'bg-gray-500' : 'bg-gray-300'}`} />
                      <span className="text-sm font-semibold text-[#0F172A]">Hidden</span>
                    </label>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ── Right Column: Assets ── */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Dish Image */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-[#0F172A]" />
                  <h2 className="text-lg font-bold text-[#0F172A]">Dish Image</h2>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-100 px-2 py-1 rounded">Required</span>
              </div>

              <input type="file" accept="image/*" id="dish-image" className="hidden" onChange={handleImageChange} />
              <label htmlFor="dish-image" className="block h-48 border-2 border-dashed border-gray-200 rounded-xl bg-[#F8F9FB] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-[#0F172A] transition-all overflow-hidden relative group">
                {imagePreview ? (
                  <img src={imagePreview} alt="Dish" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="h-12 w-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="h-5 w-5 text-[#64748B]" />
                    </div>
                    <span className="text-sm font-bold text-[#0F172A]">Click to upload</span>
                    <span className="text-[11px] text-[#94A3B8] mt-1">SVG, PNG, JPG or GIF (max. 1MB)</span>
                  </>
                )}
                {imagePreview && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-bold uppercase tracking-widest">Change Image</span>
                  </div>
                )}
              </label>
            </div>

            {/* 3D AR Model */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Maximize className="h-5 w-5 text-[#0F172A]" />
                  <h2 className="text-lg font-bold text-[#0F172A]">3D AR Model</h2>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-100 px-2 py-1 rounded">Optional</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input type="file" accept=".glb" id="glb-file" className="hidden" onChange={handleGlbChange} />
                <label htmlFor="glb-file" className="h-32 border-2 border-dashed border-gray-200 rounded-xl bg-[#F8F9FB] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-[#0F172A] transition-all group p-4 text-center">
                  <div className="h-10 w-10 bg-white rounded-full shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    {glbPreview ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Upload className="h-5 w-5 text-[#64748B]" />}
                  </div>
                  <span className="text-xs font-bold text-[#0F172A]">Upload .GLB</span>
                  <span className="text-[10px] text-[#94A3B8] mt-1">(Android / Web)</span>
                </label>

                <input type="file" accept=".usdz" id="usdz-file" className="hidden" onChange={handleUsdzChange} />
                <label htmlFor="usdz-file" className="h-32 border-2 border-dashed border-gray-200 rounded-xl bg-[#F8F9FB] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-[#0F172A] transition-all group p-4 text-center">
                  <div className="h-10 w-10 bg-white rounded-full shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    {usdzFile ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Upload className="h-5 w-5 text-[#64748B]" />}
                  </div>
                  <span className="text-xs font-bold text-[#0F172A]">Upload .USDZ</span>
                  <span className="text-[10px] text-[#94A3B8] mt-1">(iOS Native)</span>
                </label>
              </div>
            </div>

          </div>
        </div>

        {/* ── AR Live Dimension Scaling ── */}
        {glbPreview && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm mb-8 animate-slide-up">
            <div className="flex items-center gap-2 mb-8">
              <Box className="h-5 w-5 text-[#0F172A]" />
              <h2 className="text-lg font-bold text-[#0F172A]">AR Live Dimension Scaling</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              
              {/* 3D Preview Wrapper */}
              <div className="h-[400px] bg-[#F8F9FB] rounded-2xl border border-gray-100 overflow-hidden relative shadow-inner">
                <ModelViewerElement
                  ref={modelViewerRef}
                  src={glbPreview}
                  camera-controls
                  auto-rotate
                  shadow-intensity="1"
                  onLoad={handleModelLoad}
                  style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
                />
              </div>

              {/* Scaling Controls */}
              <div className="flex flex-col justify-center">
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold text-[#0F172A]">Scale Factor</label>
                    <span className="px-3 py-1 bg-gray-100 rounded text-xs font-bold font-mono text-[#0F172A]">{scaleFactor.toFixed(2)}x</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="5" 
                    step="0.01" 
                    value={scaleFactor}
                    onChange={(e) => setScaleFactor(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0F172A]"
                  />
                  <p className="text-xs text-[#64748B] mt-4 leading-relaxed">
                    Measure your physical dish. Drag the slider until one of these numbers matches your real-world measurement.
                  </p>
                </div>

                <div className="bg-[#F8F9FB] rounded-xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-[#0F172A] text-center mb-6">Estimated Real-World Size</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                      <span className="text-sm text-[#64748B] flex items-center gap-2">
                        <span className="h-4 w-4 bg-blue-100 flex items-center justify-center rounded text-blue-600 text-[10px]">↔</span>
                        Width (Side to Side)
                      </span>
                      <span className="text-sm font-bold text-[#0F172A]">{(dimensions.width * scaleFactor).toFixed(1)} cm</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                      <span className="text-sm text-[#64748B] flex items-center gap-2">
                        <span className="h-4 w-4 bg-green-100 flex items-center justify-center rounded text-green-600 text-[10px]">↕</span>
                        Height (Bottom to Top)
                      </span>
                      <span className="text-sm font-bold text-[#0F172A]">{(dimensions.height * scaleFactor).toFixed(1)} cm</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#64748B] flex items-center gap-2">
                        <span className="h-4 w-4 bg-purple-100 flex items-center justify-center rounded text-purple-600 text-[10px]">↗</span>
                        Length (Front to Back)
                      </span>
                      <span className="text-sm font-bold text-[#0F172A]">{(dimensions.length * scaleFactor).toFixed(1)} cm</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── Footer Actions ── */}
        <div className="flex items-center justify-end gap-6 pb-12 pt-6">
          <button 
            onClick={() => router.push(`/restaurants/${id}/dishes`)}
            className="text-sm font-bold text-[#1e293b] hover:text-black transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isLoading}
            className="h-14 px-12 bg-[#0F172A] hover:bg-black text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Dish...
              </>
            ) : (
              "Create Dish"
            )}
          </button>
        </div>

      </main>
    </div>
  );
}
