"use client";

import React from "react";
import ProductCard from "./ProductCard";
import { Product } from "@/types/product";

interface ProductGridProps {
  products: Product[];
  columns?: number; // optional number of columns
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  columns = 3,
}) => {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${columns} gap-6`}
    >
      {products.length > 0 ? (
        products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))
      ) : (
        <p className="col-span-full text-center text-gray-500">
          No products found
        </p>
      )}
    </div>
  );
};

export default ProductGrid;
