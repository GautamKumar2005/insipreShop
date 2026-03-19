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
  const [imageUrl, setImageUrl] = useState(""); // Image URL input
  const [imageFile, setImageFile] = useState<File | null>(null); // File input
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // New states for agreement checkbox
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
        setCategory(product.category || "");

        if (product.images && product.images.length > 0) {
          setImagePreview(product.images[0].url);
        }

        if (product.isEdited) {
          setIsAlreadyEdited(true);
          setError(
            "This product has already been edited once and cannot be edited again.",
          );
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
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageUrl(""); // Clear URL if file is selected
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
    if (e.target.value) {
      setImageFile(null); // Clear file if URL is typed
      setImagePreview(e.target.value);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError("You must agree to the one-time edit policy.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      // 1. Update Product first (without modifying images in main request initially)
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
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Failed to update product");
        setSaving(false);
        return;
      }

      // 2. Upload image to Cloudinary (either from local file or provided URL) ONLY if modified
      const uploadImageToCloudinary = async (imagePayload: string) => {
        try {
          await fetch(`/api/upload/product`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "x-user-id": localStorage.getItem("userId") || "",
              "x-user-role": "seller",
            },
            body: JSON.stringify({
              productId: productId,
              images: [imagePayload],
            }),
          });
          // Proceed to dashboard regardless of upload success
          router.push("/seller/dashboard");
        } catch (uploadErr) {
                    setError("Product updated, but image upload failed.");
        }
      };

      if (imageFile) {
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);

        reader.onloadend = async () => {
          const base64data = reader.result as string;
          await uploadImageToCloudinary(base64data);
        };
      } else if (imageUrl) {
        await uploadImageToCloudinary(imageUrl);
      } else {
        router.push("/seller/dashboard");
      }
    } catch {
      setError("Something went wrong");
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Loading product data...</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Edit Product
        </h1>
        <p className="text-gray-500 mt-2">
          Update the fields below. Note: You can only edit a product{" "}
          <strong>once</strong>!
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border rounded-xl p-6 shadow-sm space-y-6"
      >
        {error && (
          <p className="text-red-700 bg-red-50 p-3 rounded-lg border border-red-100 text-sm">
            {error}
          </p>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <Input
              placeholder="e.g. Vintage Leather Jacket"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isAlreadyEdited}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹)
              </label>
              <Input
                type="number"
                placeholder="2500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                disabled={isAlreadyEdited}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity
              </label>
              <Input
                type="number"
                placeholder="10"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
                disabled={isAlreadyEdited}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              className="w-full border-gray-300 rounded-lg shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white px-3 py-2 border disabled:opacity-50"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              disabled={isAlreadyEdited}
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

          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Update Product Image (Optional)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-4">
                {/* Upload File Option */}
                <div
                  className={`border-2 border-dashed border-gray-200 rounded-lg p-4 transition relative ${isAlreadyEdited ? "bg-gray-100 cursor-not-allowed" : "hover:bg-gray-50 cursor-pointer"}`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isAlreadyEdited}
                    className={`absolute inset-0 w-full h-full opacity-0 ${isAlreadyEdited ? "cursor-not-allowed" : "cursor-pointer"}`}
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
                    <p className="mt-1 text-sm text-gray-600">
                      <span className="text-purple-600 font-semibold inline-block">
                        Upload a file
                      </span>{" "}
                      or drag and drop
                    </p>
                  </div>
                </div>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-medium uppercase tracking-wider">
                    or paste URL
                  </span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>

                <Input
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={handleUrlChange}
                  disabled={isAlreadyEdited}
                />
              </div>

              {/* Image Preview Window */}
              <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center border overflow-hidden">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-sm font-medium">
                    Image Preview
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              placeholder="Tell buyers about your product..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-3 min-h-[120px] disabled:opacity-50"
              disabled={isAlreadyEdited}
            />
          </div>

          {!isAlreadyEdited && (
            <div className="border-t pt-4 flex items-start gap-3 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <input
                type="checkbox"
                id="editAgreement"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-gray-300"
              />
              <label
                htmlFor="editAgreement"
                className="text-sm text-yellow-800"
              >
                <strong>One-Time Edit Agreement:</strong> By checking this box,
                I acknowledge that I can only edit this product{" "}
                <strong>once</strong>. Any errors in the updated product
                information will remain permanent, and severe issues may result
                in it being dismissed from the platform. Please make sure
                everything is correct!
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
          <Button type="submit" disabled={saving || isAlreadyEdited || !agreed}>
            {saving ? "Updating..." : "Update Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
