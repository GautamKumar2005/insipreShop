"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

interface Product {
  _id: string;
  name: string;
  price: number;
  images: { url: string }[];
  description?: string;
  category?: string;
  seller?: string;
  stock?: number;
  createdAt?: string;
  updatedAt?: string;
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams?.get("search") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState(initialSearch);

  // Read other filters from URL if present
  const [minPrice, setMinPrice] = useState(searchParams?.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams?.get("maxPrice") || "");
  const [category, setCategory] = useState(searchParams?.get("category") || "All");

  // Update local state when URL parameter changes (e.g. from Header search)
  useEffect(() => {
    setSearch(searchParams?.get("search") || "");
    setCategory(searchParams?.get("category") || "All");
    setMinPrice(searchParams?.get("minPrice") || "");
    setMaxPrice(searchParams?.get("maxPrice") || "");
  }, [searchParams]);
  const [loading, setLoading] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const urlSearch = searchParams?.get("search") || "";
      const urlCategory = searchParams?.get("category") || "All";
      const urlMinPrice = searchParams?.get("minPrice") || "";
      const urlMaxPrice = searchParams?.get("maxPrice") || "";

      const params = new URLSearchParams();
      if (urlSearch) params.append("search", urlSearch);
      if (urlCategory && urlCategory !== "All") params.append("category", urlCategory);
      if (urlMinPrice) params.append("minPrice", urlMinPrice);
      if (urlMaxPrice) params.append("maxPrice", urlMaxPrice);

      const endpoint = urlSearch ? "/api/search/products" : "/api/products";
      const res = await fetch(`${endpoint}?${params.toString()}`);

      const data = await res.json();
      if (data.success) setProducts(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchParams]);

  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams();
    if (search) newParams.append("search", search);
    if (category && category !== "All") newParams.append("category", category);
    if (minPrice) newParams.append("minPrice", minPrice);
    if (maxPrice) newParams.append("maxPrice", maxPrice);
    
    router.push(`/products?${newParams.toString()}`);
    // fetchProducts is now handled automatically by the useEffect watching searchParams!
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-12 transition-colors duration-300">
      {/* Hero / Header Section */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
            Explore Our Collection
          </h1>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 max-w-2xl">
            Find the best products curated just for you. Use the filters below
            to narrow down your search.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-6 flex gap-2">
          <div className="relative flex-1">
             <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
             <Input 
               placeholder="Search..." 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="pl-9 h-12 rounded-2xl bg-white dark:bg-gray-900 border-none shadow-sm"
               onKeyDown={(e) => e.key === 'Enter' && handleSearch(e as any)}
             />
          </div>
          <Button 
            onClick={() => setIsMobileFilterOpen(true)}
            className="h-12 w-12 rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-500/30 border-none p-0 flex items-center justify-center active:scale-90 transition-transform"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
             </svg>
          </Button>
        </div>

        {/* Desktop Filter Bar (Visible only on LG+) */}
        <div className="hidden lg:block bg-white dark:bg-gray-900/90 rounded-full shadow-lg border border-purple-100 dark:border-purple-900/20 py-3 px-6 mb-8 sticky top-[56px] z-40 backdrop-blur-md transition-all">
          <form
            onSubmit={handleSearch}
            className="flex flex-row gap-4 items-center justify-between"
          >
            <div className="relative w-1/3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500/20 transition-all w-full rounded-full dark:text-gray-100 h-[38px] text-sm"
              />
            </div>

            <div className="flex gap-4 items-center">
              <select
                className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm rounded-full px-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all cursor-pointer hover:bg-white dark:hover:bg-gray-900 dark:text-gray-100 h-[38px] font-bold text-gray-700"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                {PRODUCT_CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>

              <div className="flex items-center gap-2">
                <Input
                  placeholder="Min"
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-20 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-full text-sm px-3 h-[38px] dark:text-gray-100 focus:border-purple-500/50"
                />
                <span className="text-purple-600 dark:text-purple-400 text-[10px] font-black tracking-tighter">TO</span>
                <Input
                  placeholder="Max"
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-20 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-full text-sm px-3 h-[38px] dark:text-gray-100 focus:border-purple-500/50"
                />
              </div>

              <Button
                type="submit"
                className="rounded-full px-8 h-[38px] bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30 text-sm font-black active:scale-95 transition-all uppercase tracking-wider"
              >
                Find
              </Button>
            </div>
          </form>
        </div>

        {/* Mobile Filter Modal (Full Screen) */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-950 flex flex-col animate-in slide-in-from-bottom duration-500 overflow-y-auto">
             <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Smart Filters</h2>
                <button 
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                </button>
             </div>
             
             <div className="flex-1 p-6 space-y-8">
                <div className="space-y-4">
                   <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-600 flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                     Keyword Search
                   </p>
                   <Input 
                     placeholder="What are you looking for?" 
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     className="h-14 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-purple-500/20 text-lg font-bold"
                   />
                </div>

                <div className="space-y-4">
                   <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-600 flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                     Product Category
                   </p>
                   <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setCategory("All")}
                        className={`p-4 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${category === "All" ? 'bg-purple-600 border-purple-600 text-white shadow-xl scale-[1.02]' : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-400'}`}
                      >
                         Everything
                      </button>
                      {PRODUCT_CATEGORIES.map(c => (
                        <button 
                         key={c}
                         onClick={() => setCategory(c)}
                         className={`p-4 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${category === c ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-[1.02]' : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-400 dark:hover:border-purple-500/30'}`}
                        >
                           {c}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-4">
                   <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-600 flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                     Budget (Rs.)
                   </p>
                   <div className="flex items-center gap-4">
                      <div className="flex-1">
                         <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                            <Input 
                              type="number" 
                              placeholder="Min"
                              value={minPrice}
                              onChange={(e) => setMinPrice(e.target.value)}
                              className="h-14 pl-8 rounded-2xl bg-gray-50 dark:bg-gray-900 border-none text-lg font-bold"
                            />
                         </div>
                      </div>
                      <div className="flex-1">
                         <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                            <Input 
                              type="number" 
                              placeholder="Max"
                              value={maxPrice}
                              onChange={(e) => setMaxPrice(e.target.value)}
                              className="h-14 pl-8 rounded-2xl bg-gray-50 dark:bg-gray-900 border-none text-lg font-bold"
                            />
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="p-6 pt-4 border-t dark:border-gray-800 mt-auto bg-white/80 dark:bg-gray-950/80 backdrop-blur-md sticky bottom-0">
                <Button 
                  onClick={(e) => {
                     handleSearch(e as any);
                     setIsMobileFilterOpen(false);
                  }}
                  className="w-full h-16 rounded-3xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xl shadow-[0_20px_50px_rgba(124,58,237,0.3)] flex items-center justify-center gap-2 active:scale-[0.98] transition-all uppercase tracking-widest"
                >
                   Show Results
                </Button>
             </div>
          </div>
        )}

        {/* Content Area */}
        {loading ? (
          /* Skeleton Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-4 animate-pulse"
              >
                <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                <div className="mt-auto h-8 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-purple-50 p-6 rounded-full mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              No products found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
              We couldn't find any products matching your search. Try adjusting
              your filters or search terms.
            </p>
          </div>
        ) : (
          /* Product Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard key={product._id} product={product as any} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
