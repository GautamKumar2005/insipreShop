"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  // Unwrap the params properly for Next 15+
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [originalDescription, setOriginalDescription] = useState("");

  // Multiple images state
  const [existingImages, setExistingImages] = useState<{ publicId: string; url: string }[]>([]);
  const [newImages, setNewImages] = useState<
    { type: "file" | "url"; payload: string | File; preview: string }[]
  >([]);
  const [urlInput, setUrlInput] = useState("");

  // Agreement and edit lock policy states
  const [agreed, setAgreed] = useState(false);
  const [isAlreadyEdited, setIsAlreadyEdited] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/seller/products/${productId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (!data.success) {
          setError(data.message || "Failed to load product");
          setLoading(false);
          return;
        }

        const product = data.data;
        setName(product.name);
        setPrice(product.price.toString());
        setStock(product.stock.toString());
        setDescription(product.description || "");
        setOriginalDescription(product.description || "");
        setCategory(product.category || "");

        if (product.images) {
          setExistingImages(product.images);
        }

        if (product.isEdited) {
          setIsAlreadyEdited(true);
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewImages((prev) => [
            ...prev,
            { type: "file", payload: file, preview: reader.result as string },
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    const url = urlInput.trim();
    setNewImages((prev) => [
      ...prev,
      { type: "url", payload: url, preview: url },
    ]);
    setUrlInput("");
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isDescriptionChanged = description !== originalDescription;
    if (isDescriptionChanged && !isAlreadyEdited && !agreed) {
      setError("You must agree to the one-time edit policy to change the description.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      // 1. Update Product details and existing images
      const res = await fetch(`/api/seller/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          price: Number(price),
          stock: Number(stock),
          description,
          category,
          images: existingImages, // synchronize deleted images
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Failed to update product");
        setSaving(false);
        return;
      }

      // 2. Read and upload any new images
      const getPayload = (img: { type: "file" | "url"; payload: string | File; preview: string }): Promise<string> => {
        return new Promise((resolve) => {
          if (img.type === "url") {
            resolve(img.payload as string);
          } else {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(reader.result as string);
            };
            reader.readAsDataURL(img.payload as File);
          }
        });
      };

      const payloads = await Promise.all(newImages.map(getPayload));

      if (payloads.length > 0) {
        try {
          const uploadRes = await fetch(`/api/upload/product`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "x-user-id": localStorage.getItem("userId") || "",
              "x-user-role": "seller",
            },
            body: JSON.stringify({
              productId: productId,
              images: payloads,
            }),
          });
          const uploadData = await uploadRes.json();
          if (!uploadData.success) {
            setError("Product details saved, but new image uploads failed.");
            setSaving(false);
            return;
          }
        } catch (uploadErr) {
          setError("Product details saved, but image upload failed.");
          setSaving(false);
          return;
        }
      }

      router.push("/seller/dashboard");
    } catch {
      setError("Something went wrong");
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Loading product data...</div>;
  }

  const isDescriptionChanged = description !== originalDescription;
  const hasNoImages = existingImages.length === 0 && newImages.length === 0;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 text-gray-800 dark:text-gray-100">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Edit Product
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Update the fields below. Note: You can only edit the description{" "}
          <strong>once</strong>! Other details and images can be updated freely.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm space-y-6"
      >
        {error && (
          <p className="text-red-700 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-100 dark:border-red-900/50 text-sm">
            {error}
          </p>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Product Name
            </label>
            <Input
              placeholder="e.g. Vintage Leather Jacket"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Price (₹)
              </label>
              <Input
                type="number"
                placeholder="2500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stock Quantity
              </label>
              <Input
                type="number"
                placeholder="10"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              className="w-full border-gray-300 dark:border-gray-800 rounded-lg shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-3 py-2 border"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="" disabled>
                Select a category
              </option>
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Product Images
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-4">
                {/* Upload File Option */}
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-center">
                    <svg
                      className="mx-auto h-8 w-8 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      <span className="text-purple-600 dark:text-purple-400 font-semibold inline-block">
                        Upload file(s)
                      </span>{" "}
                      or drag & drop
                    </p>
                  </div>
                </div>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-medium uppercase tracking-wider">
                    or paste URL
                  </span>
                  <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddUrl}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Image Preview Window */}
              <div className="w-full min-h-[192px] bg-gray-50 dark:bg-gray-950 rounded-xl p-3 border border-gray-200/60 dark:border-gray-800/80 overflow-hidden flex flex-col">
                <span className="text-xs font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider mb-2">
                  Images Gallery ({existingImages.length + newImages.length})
                </span>

                {existingImages.length === 0 && newImages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-850 rounded-lg py-12">
                    <span className="text-gray-400 text-sm font-medium">
                      No images left
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-[220px] pr-1">
                    {/* Render saved existing images */}
                    {existingImages.map((img, i) => (
                      <div
                        key={`existing-${i}`}
                        className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 group shadow-sm"
                      >
                        <img
                          src={img.url}
                          alt="Product image"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(i)}
                          className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-all active:scale-90"
                          title="Delete image"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    ))}

                    {/* Render new added images */}
                    {newImages.map((img, i) => (
                      <div
                        key={`new-${i}`}
                        className="relative aspect-square rounded-xl overflow-hidden border border-purple-200 dark:border-purple-900/50 bg-white dark:bg-gray-900 group shadow-sm animate-in zoom-in-95"
                      >
                        <img
                          src={img.preview}
                          alt="New preview"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[9px] font-black uppercase bg-purple-600 text-white rounded shadow-sm">
                          New
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveNewImage(i)}
                          className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-all active:scale-90"
                          title="Remove image"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            {isAlreadyEdited && (
              <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-500 block mb-1">
                ⚠️ Description is locked (one-time edit policy). Other fields are fully editable.
              </span>
            )}
            <textarea
              placeholder="Tell buyers about your product..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-800 rounded-lg shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-3 min-h-[120px] text-gray-900 dark:text-white disabled:opacity-50"
              disabled={isAlreadyEdited}
            />
          </div>

          {isDescriptionChanged && !isAlreadyEdited && (
            <div className="border-t border-gray-150 dark:border-gray-800 pt-4 flex items-start gap-3 bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-900/50 animate-in fade-in slide-in-from-top-2">
              <input
                type="checkbox"
                id="editAgreement"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-gray-300"
              />
              <label
                htmlFor="editAgreement"
                className="text-sm text-yellow-800 dark:text-yellow-400"
              >
                <strong>One-Time Description Edit Agreement:</strong> I acknowledge that
                I can only edit this product's description <strong>once</strong>.
                Any typos or errors will remain permanent. Please make sure everything is correct!
              </label>
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <Button
            variant="outline"
            type="button"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving || hasNoImages || (isDescriptionChanged && !isAlreadyEdited && !agreed)}
          >
            {saving ? "Updating..." : "Update Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
