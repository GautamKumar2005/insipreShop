import Image from "next/image";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import mongoose from "mongoose";
import BuySection from "@/components/product/BuySection";
import ProductReviews from "@/components/product/ProductReviews";

async function getProduct(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  await connectDB();
  return Product.findById(id).lean();
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) notFound();

  const mainImage =
    product.images?.[0]?.url || "/images/placeholder-product.jpg";

  // Clean description lines
  const descriptionLines = product.description
    ? product.description
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
    : [];

  const hasDescription = descriptionLines.length > 0;

  // Take first 4 meaningful lines as Key Highlights
  const numHighlights = 4;
  const keyHighlights = hasDescription
    ? descriptionLines.slice(0, numHighlights)
    : [];

  // Everything after the highlights goes to detailed description
  const detailedDescription = hasDescription
    ? descriptionLines.slice(numHighlights)
    : [];

  const showDetailedSection = detailedDescription.length > 0;

  const getPseudoRating = (id: string) => {
    const defaultRatings = [4.0, 4.5, 3.7];
    const sum = String(id)
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return defaultRatings[sum % defaultRatings.length];
  };

  const displayRating = getPseudoRating(product._id.toString());

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
        {/* LEFT: IMAGE */}
        <div className="flex justify-center md:justify-start">
          <div className="w-full max-w-[520px] md:max-w-none bg-gray-50 rounded-xl overflow-hidden shadow-md border border-gray-100">
            <div className="relative aspect-square md:aspect-[4/5]">
              <Image
                src={mainImage}
                alt={product.name}
                fill
                className="object-contain md:object-cover hover:scale-[1.03] transition-transform duration-400"
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 45vw, 520px"
                quality={82}
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: name, price, stock, highlights, buy */}
        <div className="flex flex-col">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            {product.name}
          </h1>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center bg-green-50 px-2 py-1 rounded border border-green-200">
              <span className="text-green-700 text-sm font-bold">
                {displayRating.toFixed(1)}
              </span>
              <span className="text-green-600 text-sm ml-1">★</span>
            </div>
            <a
              href="#reviews-section"
              className="text-sm text-gray-500 font-medium cursor-pointer hover:underline"
            >
              Read Ratings & Reviews
            </a>
          </div>

          <div className="flex items-baseline gap-4 mb-6">
            <p className="text-3xl sm:text-4xl font-bold text-green-700">
              ₹{product.price.toLocaleString("en-IN")}
            </p>
            {product.originalPrice && product.originalPrice > product.price && (
              <p className="text-xl sm:text-2xl text-gray-500 line-through">
                ₹{product.originalPrice.toLocaleString("en-IN")}
              </p>
            )}
          </div>

          <div className="space-y-3 text-lg mb-6">
            <p>
              <span className="font-semibold">Stock:</span>{" "}
              <span
                className={
                  product.stock > 0
                    ? "text-green-600 font-medium"
                    : "text-red-600 font-medium"
                }
              >
                {product.stock > 0
                  ? `${product.stock} available`
                  : "Out of stock"}
              </span>
            </p>
            {product.brand && (
              <p>
                <span className="font-semibold">Brand:</span> {product.brand}
              </p>
            )}
            {product.category && (
              <p>
                <span className="font-semibold">Category:</span>{" "}
                {product.category}
              </p>
            )}
          </div>

          {/* ⭐ KEY HIGHLIGHTS – only here */}
          {hasDescription && keyHighlights.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                ⭐ Product Highlights
              </h3>
              <ul className="list-disc pl-6 space-y-2.5 text-gray-700">
                {keyHighlights.map((highlight, i) => (
                  <li key={i} className="text-base leading-relaxed">
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* BUY BUTTON AREA */}
          <div className="mt-auto pt-6">
            <BuySection productId={product._id.toString()} />
          </div>
        </div>
      </div>

      {/* BOTTOM DETAILED DESCRIPTION – only if there is extra content */}
      {showDetailedSection && (
        <div className="mt-12 lg:mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-5">
            Product Details
          </h2>
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
            {detailedDescription.map((line, i) => (
              <p key={i} className="mb-4 last:mb-0">
                {line}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* FEEDBACK & REVIEWS SECTION */}
      <div id="reviews-section">
        <ProductReviews productId={product._id.toString()} />
      </div>
    </div>
  );
}
