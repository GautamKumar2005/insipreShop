"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button"; // Assuming you have a Button component
import { ArrowRight } from "lucide-react"; // Or use a simple SVG if lucide is not installed

import HeroCarousel from "@/components/layout/HeroCarousel";

import { IProduct as Product } from "@/types/product";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

const LandingPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "seller") {
        router.push("/seller/dashboard");
      } else if (user.role === "delivery") {
        router.push("/delivery/dashboard");
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative bg-black text-white overflow-hidden h-[300px] md:h-[400px] flex items-center">
        {/* Background Carousel */}
        <HeroCarousel />
      </section>

      {/* Category Scroll Bar */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border-b dark:border-gray-800 py-1 sticky top-[56px] z-30 transition-all">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto no-scrollbar gap-4 items-center hide-scroll-bar pb-1 pt-1">
            {PRODUCT_CATEGORIES.map((cat, i) => {
              const gradients = [
                "hover:from-pink-500 hover:to-orange-400",
                "hover:from-blue-500 hover:to-cyan-400",
                "hover:from-purple-500 hover:to-indigo-500",
                "hover:from-emerald-500 hover:to-teal-400",
              ];
              const hoverColor = gradients[i % gradients.length];

              return (
                <button
                  key={cat}
                  onClick={() => {
                    const el = document.getElementById(`section-${cat}`);
                    if (el) {
                      const y =
                        el.getBoundingClientRect().top + window.scrollY - 130;
                      window.scrollTo({ top: y, behavior: "smooth" });
                    } else {
                      router.push(
                        `/products?category=${encodeURIComponent(cat)}`,
                      );
                    }
                  }}
                  className={`whitespace-nowrap relative group rounded-full bg-gray-100 dark:bg-gray-800 px-6 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-white dark:hover:text-white transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg bg-gradient-to-r hover:bg-transparent ${hoverColor}`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-10 py-5 container mx-auto px-4">
        {/* Sections */}
        <ProductSection
          id="section-Trending"
          title="Trending Now"
          category="Trending"
          subtitle="Hot items everyone is buying"
        />
        <ProductSection
          id="section-Mobile Phone"
          title="Mobile Phones"
          category="Mobile Phone"
          subtitle="Upgrade your tech game"
        />
        <ProductSection
          id="section-Electronics"
          title="Electronics"
          category="Electronics"
          subtitle="Latest gadgets and accessories"
        />
        <ProductSection
          id="section-Clothing"
          title="Clothing"
          category="Clothing"
          subtitle="Fresh looks for the season"
        />
        <div className="grid md:grid-cols-2 gap-8">
          <ProductSection
            id="section-Books"
            title="Books"
            category="Books"
            limit={2}
            compact
          />
          <ProductSection
            id="section-Customise"
            title="Customise"
            category="Customise"
            limit={2}
            compact
          />
        </div>

        {/* All Products Link */}
        <div className="text-center pt-8 pb-4">
          <Link
            href="/products"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full text-lg font-bold hover:shadow-[0_10px_25px_-5px_rgba(124,58,237,0.4)] transform hover:-translate-y-1 transition-all duration-300"
          >
            Explore All Products{" "}
            <ArrowRight
              size={22}
              className="transform group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>
      </div>

      {/* Features Banner */}
      <section className="bg-white dark:bg-gray-900 py-20 border-t dark:border-gray-800 transition-colors duration-300 relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <Feature
              icon="🚚"
              title="Fast Delivery"
              desc="Within 24 hours"
              colorClass="from-blue-400 to-blue-600 shadow-blue-500/30"
            />
            <Feature
              icon="🛡️"
              title="Secure Payment"
              desc="100% Protected"
              colorClass="from-emerald-400 to-emerald-600 shadow-emerald-500/30"
            />
            <Feature
              icon="↩️"
              title="Easy Returns"
              desc="30 Days Policy"
              colorClass="from-orange-400 to-orange-600 shadow-orange-500/30"
            />
            <Feature
              icon="🎧"
              title="24/7 Support"
              desc="Always here for you"
              colorClass="from-purple-400 to-purple-600 shadow-purple-500/30"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

// Reusable Section Component
function ProductSection({
  id,
  title,
  category,
  subtitle,
  limit = 10,
  compact = false,
}: {
  id?: string;
  title: string;
  category?: string;
  subtitle?: string;
  limit?: number;
  compact?: boolean;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const url = category
          ? `/api/products?category=${encodeURIComponent(category)}`
          : `/api/products`;

        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setProducts(data.data.slice(0, limit));
        }
      } catch (err) {
              } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [category, limit]);

  if (!loading && products.length === 0) return null; // Don't show empty sections

  return (
    <section id={id} className="scroll-mt-36 group">
      <div className="flex justify-between items-end mb-8 border-b dark:border-gray-800 pb-4">
        <div>
          <h2
            className={`${compact ? "text-2xl" : "text-3xl lg:text-4xl"} font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 tracking-tight`}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
              {subtitle}
            </p>
          )}
        </div>
        {!compact && (
          <Link
            href={`/products?category=${category}`}
            className="group/link flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold hover:text-purple-700 dark:hover:text-purple-300 transition-colors bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-full"
          >
            See All{" "}
            <ArrowRight
              size={16}
              className="transform group-hover/link:translate-x-1 transition-transform"
            />
          </Link>
        )}
      </div>

      <div className="relative">
        <div className="flex overflow-x-auto gap-6 pb-6 pt-2 snap-x snap-mandatory hide-scroll-bar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
          {loading ? (
            [...Array(limit)].map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[280px] sm:w-[320px] h-[380px] bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"
              />
            ))
          ) : (
            products.map((product) => (
              <div
                key={product._id}
                className="flex-shrink-0 w-[280px] sm:w-[320px] snap-start transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="h-full">
                  <ProductCard product={product} />
                </div>
              </div>
            ))
          )}
          {/* Subtle spacer to maintain padding at the end of the scroll */}
          <div className="flex-shrink-0 w-4 h-full" aria-hidden="true"></div>
        </div>
      </div>
    </section>
  );
}

function Feature({ icon, title, desc, colorClass }: any) {
  return (
    <div className="p-8 rounded-3xl bg-gray-50 dark:bg-gray-800/50 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-gray-100 dark:border-gray-800/50 group">
      <div
        className={`text-4xl w-20 h-20 mx-auto flex items-center justify-center rounded-2xl bg-gradient-to-br ${colorClass} shadow-lg text-white mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}
      >
        {icon}
      </div>
      <h3 className="font-extrabold text-xl text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 font-medium">{desc}</p>
    </div>
  );
}

export default LandingPage;

// Add a style block for hide-scroll-bar class (since Tailwind tailwindcss-no-scrollbar isn't loaded by default easily)
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `
    .hide-scroll-bar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .hide-scroll-bar::-webkit-scrollbar {
      display: none;
    }
  `;
  document.head.appendChild(style);
}
