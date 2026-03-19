"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { IProduct as Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const imageUrl = product.images?.[0]?.url || "/placeholder.png";

  const getPseudoRating = (id: string) => {
    const defaultRatings = [4.0, 4.5, 3.7];
    const sum = id ? id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    return defaultRatings[sum % defaultRatings.length];
  };

  const displayRating = getPseudoRating(product._id);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col border border-transparent dark:border-gray-700">
      {/* Product Image */}
      <Link href={`/products/${product._id}`}>
        <Image
          src={imageUrl}
          alt={product.name}
          width={400}
          height={400}
          className="w-full h-56 object-cover hover:scale-105 transition-transform duration-300"
        />
      </Link>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1">
        <Link href={`/products/${product._id}`}>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating Display */}
        <div className="flex items-center gap-1 mt-1">
          <span className="text-yellow-400 text-sm">★</span>
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            {displayRating.toFixed(1)}
          </span>
        </div>

        {product.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Price & Action */}
        <div className="mt-auto flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            ₹{product.price.toLocaleString()}
          </span>
          {product.stock > 0 ? (
            <span className="text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
              In Stock
            </span>
          ) : (
            <span className="text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded">
              Out of Stock
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
