"use client";

import React, { useState } from "react";

interface ProductSearchProps {
  onSearch: (query: { search?: string; minPrice?: number; maxPrice?: number }) => void;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ onSearch }) => {
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");

  const handleSearch = () => {
    onSearch({
      search: search.trim() || undefined,
      minPrice: minPrice === "" ? undefined : Number(minPrice),
      maxPrice: maxPrice === "" ? undefined : Number(maxPrice),
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
      {/* Text search */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700">Search Products</label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or description"
          className="mt-1 w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Min Price */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Min Price</label>
        <input
          type="number"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="0"
          className="mt-1 w-24 px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Max Price */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Max Price</label>
        <input
          type="number"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="10000"
          className="mt-1 w-24 px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Search Button */}
      <div>
        <button
          onClick={handleSearch}
          className="w-full md:w-auto px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
      </div>
    </div>
  );
};

export default ProductSearch;
