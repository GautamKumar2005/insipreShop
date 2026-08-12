"use client";

import React, { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageLightbox = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}: ImageLightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      // Disable body scroll when open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, initialIndex]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  const handlePrev = () => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
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

  if (!isOpen || images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top action row */}
      <div className="absolute top-4 right-4 z-[10000] flex items-center gap-4">
        {images.length > 1 && (
          <span className="text-white/60 text-sm font-semibold select-none bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
            {currentIndex + 1} / {images.length}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-2 md:p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all backdrop-blur-sm shadow-md cursor-pointer hover:scale-105 active:scale-95"
          title="Close (Esc)"
        >
          <X className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
        </button>
      </div>

      {/* Main Image View Area */}
      <div
        className="relative w-full h-full flex items-center justify-center p-4 max-w-5xl max-h-[75vh] md:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {images.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-2 md:-left-16 p-2 md:p-3 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all backdrop-blur-sm shadow-md cursor-pointer hover:scale-105 active:scale-95 z-50"
            title="Previous (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" strokeWidth={2.5} />
          </button>
        )}

        <div className="relative w-full h-full flex items-center justify-center select-none">
          <img
            src={images[currentIndex]}
            alt={`Expanded image ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-all duration-300 transform scale-100"
          />
        </div>

        {images.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-2 md:-right-16 p-2 md:p-3 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all backdrop-blur-sm shadow-md cursor-pointer hover:scale-105 active:scale-95 z-50"
            title="Next (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Navigation */}
      {images.length > 1 && (
        <div
          className="absolute bottom-6 flex gap-2 overflow-x-auto max-w-[85%] px-4 py-2 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10 no-scrollbar"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-10 h-10 md:w-14 md:h-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                idx === currentIndex
                  ? "border-purple-500 scale-105 shadow-lg shadow-purple-500/25"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img src={img} className="w-full h-full object-cover" alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
