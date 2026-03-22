"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

const CAROUSEL_IMAGES = [
  "https://res.cloudinary.com/dk6ahmqwh/image/upload/v1771245270/90137aa80ed4d208bc0cda1fc224cfff-online-shopping-web-slider_rrlk8u.jpg",
  "https://res.cloudinary.com/dk6ahmqwh/image/upload/v1771245040/b0b78b6c2975d535b663bfb942b56df3_kc3hez.jpg",
  "https://res.cloudinary.com/dk6ahmqwh/image/upload/v1771245010/images_wx61vv.jpg",
  "https://res.cloudinary.com/dk6ahmqwh/image/upload/v1771245106/modern-sale-banner-website-slider-template-design_54925-45_bgrpn6.jpg",
  "https://res.cloudinary.com/dk6ahmqwh/image/upload/v1771245076/images_t4euxp.jpg",
];

export default function HeroCarousel() {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {CAROUSEL_IMAGES.map((src, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentImage ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={src}
            alt={`Hero Slide ${index + 1}`}
            fill
            className="object-fill"
            priority={index === 0}
            quality={100}
            unoptimized
          />
        </div>
      ))}

      {/* Slide Indicators */}
      <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 md:gap-2">
        {CAROUSEL_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImage(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentImage
                ? "bg-white w-5 md:w-6 h-1.5 md:h-2"
                : "bg-white/40 hover:bg-white/80 w-1.5 md:w-2 h-1.5 md:h-2"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
