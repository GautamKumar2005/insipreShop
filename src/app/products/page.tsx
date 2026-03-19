"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

  // Update local state when URL parameter changes (e.g. from Header search)
  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category && category !== "All") params.append("category", category);
      if (minPrice) params.append("minPrice", minPrice);
      if (maxPrice) params.append("maxPrice", maxPrice);

      // Use the dedicated search API if a search term is present, otherwise use standard products API
      const endpoint = search ? "/api/search/products" : "/api/products";
      const res = await fetch(`${endpoint}?${params.toString()}`);

      const data = await res.json();
      if (data.success) setProducts(data.data);
    } catch (err) {
          } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search]); // Re-fetch when search changes (e.g. from URL)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-12 transition-colors duration-300">
      {/* Hero / Header Section */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
            Explore Our Collection
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
            Find the best products curated just for you. Use the filters below
            to narrow down your search.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Modern Filter Bar */}
        <div className="bg-white dark:bg-gray-900/90 rounded-2xl md:rounded-full shadow-sm border border-gray-100 dark:border-gray-800 py-3 px-4 md:px-6 mb-6 sticky top-[56px] z-40 backdrop-blur-md bg-white/90 transition-all">
          <form
            onSubmit={handleSearch}
            className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between"
          >
            {/* Search Input */}
            <div className="relative w-full lg:w-1/3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-all w-full rounded-full dark:text-gray-100 h-[38px] text-sm"
              />
            </div>

            {/* Filters Group */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full lg:w-auto items-stretch sm:items-center justify-start lg:justify-end">
              <select
                className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm rounded-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer hover:bg-white dark:hover:bg-gray-900 dark:text-gray-100 h-[38px]"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-full px-3 h-[38px] border border-gray-200 dark:border-gray-700">
                <Input
                  placeholder="Min"
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-16 bg-transparent border-none shadow-none focus:ring-0 text-sm px-1 py-1 dark:text-gray-100"
                />
                <span className="text-gray-400 dark:text-gray-500 text-xs">
                  -
                </span>
                <Input
                  placeholder="Max"
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-16 bg-transparent border-none shadow-none focus:ring-0 text-sm px-1 py-1 dark:text-gray-100"
                />
              </div>

              <Button
                type="submit"
                className="rounded-full px-5 py-1.5 h-[38px] bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200/50 transition-all text-sm font-medium"
              >
                Filter
              </Button>
            </div>
          </form>
        </div>

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
