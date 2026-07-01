"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { IoMdAdd, IoMdCreate, IoMdTrash, IoMdMegaphone } from "react-icons/io";
import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";
import { PackageOpen } from "lucide-react";

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  description?: string;
  images?: { url: string }[];
}

export default function SellerProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Share / Advertise Modal State
  const [activeShareProduct, setActiveShareProduct] = useState<Product | null>(null);
  const [shareContent, setShareContent] = useState("");
  const [shareType, setShareType] = useState<"page" | "post">("page");
  const [shareMediaUrls, setShareMediaUrls] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = localStorage.getItem("token");
      if (!user?.id || !token) {
        setError("Please login again");
        return;
      }
      const res = await fetch("/api/seller/products", {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "x-user-id": user.id,
          "x-user-role": user.role,
        },
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Unauthorized");
        return;
      }
      setProducts(data.data);
    } catch (err) {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (_id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      alert("Delete functionality not implemented.");
    }
  };

  const handleOpenAdvertiseModal = (product: Product) => {
    setActiveShareProduct(product);
    setShareContent(
      `🛍️ Check out our product: ${product.name}!\n\n🔥 Price: ₹${product.price.toLocaleString("en-IN")}\n\n${product.description || ""}\n\n👉 Buy here: ${window.location.origin}/products/${product._id} #shop #trending`
    );
    setShareType("page");
    
    // Add product primary image if exists
    const prodImg = product.images?.[0]?.url;
    setShareMediaUrls(prodImg ? [prodImg] : []);
  };

  const handlePublishPost = async () => {
    if (!shareContent.trim()) return alert("Content cannot be empty");
    const token = localStorage.getItem("token");
    if (!token) return alert("Please login again");

    setIsPosting(true);
    try {
      const res = await fetch("/api/social", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: shareContent,
          type: shareType,
          media_urls: shareMediaUrls,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Advertisement posted to your social profile successfully!");
        setActiveShareProduct(null);
      } else {
        alert(data.message || "Failed to post ad.");
      }
    } catch (err) {
      alert("Error sharing ad to social feed.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto relative">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">My Products</h1>
        <Button
          size="lg"
          onClick={() => router.push("/seller/products/create")}
          className="flex items-center gap-2"
        >
          <IoMdAdd size={22} /> Add Product
        </Button>
      </div>

      {error && (
        <div className="mb-6 text-red-700 bg-red-50 border border-red-200 p-4 rounded-lg flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <PackageOpen className="w-32 h-32 text-gray-300 mb-4" strokeWidth={1.5} />
          <p className="text-center text-gray-500 mb-4 text-lg">
            No products yet. Start by adding your first product.
          </p>
          <Button onClick={() => router.push("/seller/products/create")}>
            <IoMdAdd className="mr-1" /> Add Product
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product._id}
              className="group border rounded-xl p-4 shadow hover:shadow-lg transition-all bg-white flex flex-col"
            >
              {/* Clickable image */}
              <div
                className="aspect-w-4 aspect-h-3 w-full mb-3 cursor-pointer overflow-hidden relative h-48 bg-gray-50 rounded-lg"
                title="View product"
                tabIndex={0}
                role="button"
                onClick={() => router.push(`/products/${product._id}`)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" || e.key === " ") router.push(`/products/${product._id}`);
                }}
              >
                <img
                  src={product.images?.[0]?.url || "/placeholder.png"}
                  alt={product.name}
                  className="object-cover rounded-lg transition group-hover:scale-105 w-full h-full"
                />
              </div>

              <div className="flex flex-col flex-grow">
                <h2 className="font-semibold text-lg mb-1 truncate">{product.name}</h2>
                <p className="mb-2 text-gray-800 font-medium text-xl">₹{product.price}</p>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={product.stock > 0 ? "success" : "error"}>
                    {product.stock > 0 ? "In stock" : "Out of stock"}
                  </Badge>
                  <span className="text-xs text-gray-500 font-medium">Qty: {product.stock}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-gray-50">
                <div className="flex gap-2">
                  <Button
                    className="flex-1 rounded-xl bg-black text-white hover:bg-gray-800 font-bold h-11"
                    onClick={() => router.push(`/products/${product._id}`)}
                  >
                    View Product
                  </Button>
                  <Button
                    className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold h-11 flex items-center justify-center gap-1 shadow-md shadow-purple-500/10 active:scale-95 transition-all"
                    onClick={() => handleOpenAdvertiseModal(product)}
                  >
                    <IoMdMegaphone size={16} /> Advertise
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl h-11 font-bold flex items-center justify-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/seller/products/edit/${product._id}`);
                    }}
                  >
                    <IoMdCreate size={18} /> Edit
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1 rounded-xl h-11 font-bold flex items-center justify-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(product._id);
                    }}
                  >
                    <IoMdTrash size={18} /> Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share / Advertise Modal */}
      {activeShareProduct && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in"
            onClick={() => setActiveShareProduct(null)}
          ></div>
          
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-lg bg-white dark:bg-gray-950 rounded-3xl shadow-2xl z-[101] overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-gray-900 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-900 flex items-center justify-between bg-purple-500/5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600">
                  <IoMdMegaphone size={20} />
                </span>
                <h3 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
                  Promote on Social Hub
                </h3>
              </div>
              <button
                onClick={() => setActiveShareProduct(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-all"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-gray-900 dark:text-gray-100">
              {/* Product preview summary card */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white border flex-shrink-0">
                  <img
                    src={activeShareProduct.images?.[0]?.url || "/placeholder.png"}
                    alt={activeShareProduct.name}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-sm truncate w-64">{activeShareProduct.name}</h4>
                  <p className="text-xs font-black text-purple-600 dark:text-purple-400">
                    ₹{activeShareProduct.price.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Share Type selector */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-purple-500 tracking-wider">
                  Post Placement
                </label>
                <div className="flex gap-3">
                  {(["page", "post"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setShareType(t)}
                      className={`flex-1 py-2.5 rounded-xl font-bold border transition-all text-xs uppercase tracking-wider ${
                        shareType === t
                          ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/15"
                          : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      {t === "page" ? "📄 Share on Pages Feed" : "💬 Share on Explore Feed"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Description area */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-purple-500 tracking-wider">
                  Ad Description
                </label>
                <textarea
                  value={shareContent}
                  onChange={(e) => setShareContent(e.target.value)}
                  placeholder="Tell your customers about this deal..."
                  className="w-full min-h-[140px] p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-none focus:ring-2 focus:ring-purple-500 text-sm font-medium resize-none shadow-inner"
                />
              </div>

              {/* Image attachment / Additional uploads */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-purple-500 tracking-wider">
                    Attached Media Gallery
                  </label>
                  <CldUploadWidget
                    signatureEndpoint="/api/cloudinary-sign"
                    onSuccess={(result: any) => {
                      setShareMediaUrls((prev) => [...prev, result.info.secure_url]);
                    }}
                    options={{
                      multiple: true,
                      maxFiles: 5,
                      sources: ["local", "camera"],
                      cropping: true,
                    } as any}
                  >
                    {({ open }) => (
                      <button
                        type="button"
                        onClick={() => open()}
                        className="text-xs text-purple-600 font-bold hover:underline"
                      >
                        + Add Image/Video
                      </button>
                    )}
                  </CldUploadWidget>
                </div>

                {shareMediaUrls.length === 0 ? (
                  <div className="py-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-gray-400">
                    <span className="text-xs">No media attached. Only text will be posted.</span>
                  </div>
                ) : (
                  <div className="flex gap-3 flex-wrap p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                    {shareMediaUrls.map((url, i) => (
                      <div
                        key={i}
                        className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white dark:border-gray-800 shadow relative group flex-shrink-0"
                      >
                        <img src={url} className="w-full h-full object-cover" alt="Ad media attachment" />
                        <button
                          type="button"
                          onClick={() => setShareMediaUrls((urls) => urls.filter((_, idx) => idx !== i))}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white flex items-center justify-center"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-gray-100 dark:border-gray-900 bg-gray-50/50 flex justify-end gap-3">
              <Button
                variant="outline"
                className="rounded-full px-6 font-bold h-11"
                onClick={() => setActiveShareProduct(null)}
              >
                Cancel
              </Button>
              <Button
                className="rounded-full px-8 bg-purple-600 hover:bg-purple-700 text-white font-bold h-11 shadow-lg shadow-purple-500/25 disabled:opacity-50"
                onClick={handlePublishPost}
                disabled={isPosting || !shareContent.trim()}
              >
                {isPosting ? "Publishing..." : "Advertise Now"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}