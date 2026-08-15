"use client";

import React, { useState } from "react";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductImagesProps {
  images?: { url: string }[];
  productName: string;
}

export default function ProductImages({ images = [], productName }: ProductImagesProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const imageUrls = images.map((img) => img.url);
  const displayImage = imageUrls[activeIdx] || "/images/placeholder-product.jpg";

  const handlePrev = () => {
    if (imageUrls.length <= 1) return;
    setActiveIdx((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (imageUrls.length <= 1) return;
    setActiveIdx((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-[520px] md:max-w-none">
      {/* Main Image View */}
      <div 
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="w-full bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 relative aspect-square p-4 flex items-center justify-center group"
      >
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

        {/* Navigation Arrows overlay */}
        {imageUrls.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity backdrop-blur-sm shadow-md cursor-pointer"
              title="Previous image"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity backdrop-blur-sm shadow-md cursor-pointer"
              title="Next image"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
            </button>
          </>
        )}
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
