"use client";

import React, { useState } from "react";
import { ImageLightbox } from "@/components/ui/ImageLightbox";

interface ProductImagesProps {
  images?: { url: string }[];
  productName: string;
}

export default function ProductImages({ images = [], productName }: ProductImagesProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const imageUrls = images.map((img) => img.url);
  const displayImage = imageUrls[activeIdx] || "/images/placeholder-product.jpg";

  return (
    <div className="flex flex-col gap-4 w-full max-w-[520px] md:max-w-none">
      {/* Main Image View */}
      <div className="w-full bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 relative aspect-square p-4 flex items-center justify-center group">
        <button
          onClick={() => setIsLightboxOpen(true)}
          className="absolute inset-0 w-full h-full flex items-center justify-center p-4 cursor-zoom-in outline-none"
        >
          <img
            src={displayImage}
            alt={productName}
            className="max-w-full max-h-full object-contain p-4 group-hover:scale-[1.03] transition-transform duration-500"
          />
        </button>
      </div>

      {/* Thumbnails Row */}
      {imageUrls.length > 1 && (
        <div className="flex gap-3 overflow-x-auto py-1 no-scrollbar justify-center md:justify-start">
          {imageUrls.map((url, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={`w-12 h-12 md:w-16 md:h-16 rounded-lg md:rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-white ${
                idx === activeIdx
                  ? "border-purple-600 shadow-md shadow-purple-500/15 scale-105"
                  : "border-gray-200 opacity-70 hover:opacity-100 hover:border-purple-300"
              }`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      <ImageLightbox
        images={imageUrls}
        initialIndex={activeIdx}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />
    </div>
  );
}
