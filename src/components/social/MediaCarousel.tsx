"use client";

import React, { useState } from "react";
import { ImageLightbox } from "@/components/ui/ImageLightbox";

export const MediaCarousel = ({ mediaString, type }: { mediaString?: any; type: string }) => {
  if (!mediaString) return null;

  let urls: string[] = [];
  if (Array.isArray(mediaString)) {
    urls = mediaString;
  } else if (typeof mediaString === "string") {
    const trimmed = mediaString.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        urls = JSON.parse(trimmed);
        if (!Array.isArray(urls)) urls = [trimmed];
      } catch (e) {
        urls = [trimmed];
      }
    } else {
      urls = [trimmed];
    }
  }

  if (urls.length === 0) return null;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  // Filter only images for the lightbox
  const imageUrls = urls.filter(
    (url) =>
      !url.match(/\.(mp4|webm|ogg|mov|mp3|wav)$/i) &&
      !url.includes("/video/upload/")
  );

  const currentImageIdx = imageUrls.indexOf(urls[currentIndex]);

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
    if (isLeftSwipe && currentIndex < urls.length - 1) {
      setCurrentIndex((c) => c + 1);
    } else if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex((c) => c - 1);
    }
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="mt-4 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 relative bg-black/5 shadow-inner group"
    >
      {urls.length > 1 && (
        <>
          <button 
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(c => Math.max(0, c - 1)); }} 
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 md:w-8 md:h-8 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 disabled:opacity-0 transition-opacity backdrop-blur-sm shadow-md cursor-pointer" 
            disabled={currentIndex === 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(c => Math.min(urls.length - 1, c + 1)); }} 
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 md:w-8 md:h-8 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 disabled:opacity-0 transition-opacity backdrop-blur-sm shadow-md cursor-pointer" 
            disabled={currentIndex === urls.length - 1}
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
          
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
            {urls.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIndex ? 'bg-white scale-125' : 'bg-white/50'}`} />
            ))}
          </div>
        </>
      )}

      {/* Render the active media */}
      {urls[currentIndex]?.match(/\.(mp4|webm|ogg|mov)$/i) || urls[currentIndex]?.includes('/video/upload/') ? (
        <video src={urls[currentIndex]} controls className="w-full max-h-[500px] object-contain bg-black" />
      ) : urls[currentIndex]?.match(/\.(mp3|wav)$/i) && type === 'tweet' ? (
        <div className="p-4 bg-gray-100 dark:bg-gray-800">
           <audio src={urls[currentIndex]} controls className="w-full" />
        </div>
      ) : (
        <img
          src={urls[currentIndex]}
          alt="Post media"
          className="w-full max-h-[500px] object-cover cursor-zoom-in hover:brightness-95 transition-all"
          onClick={() => setIsLightboxOpen(true)}
        />
      )}

      {/* Lightbox Modal */}
      <ImageLightbox
        images={imageUrls}
        initialIndex={currentImageIdx >= 0 ? currentImageIdx : 0}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />
    </div>
  );
};
