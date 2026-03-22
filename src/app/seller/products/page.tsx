"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import  Badge  from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { IoMdAdd, IoMdCreate, IoMdTrash } from "react-icons/io";

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  images?: { url: string }[];
}

export default function SellerProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  // Dummy handler for delete
  const handleDelete = (_id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      // TODO: implement delete request here, then re-fetch
      alert("Delete functionality not implemented.");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
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
          <img src="/empty-box.svg" width={120} alt="No products" className="mb-4"/>
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
                className="aspect-w-4 aspect-h-3 w-full mb-3 cursor-pointer overflow-hidden"
                title="View product"
                tabIndex={0}
                role="button"
                onClick={() => router.push(`/products/${product._id}`)}
                onKeyPress={e => {
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
                <Button
                  className="w-full rounded-xl bg-black text-white hover:bg-gray-800 font-bold h-11"
                  onClick={() => router.push(`/products/${product._id}`)}
                >
                  View Product
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl h-11 font-bold flex items-center justify-center gap-2"
                    onClick={e => {
                      e.stopPropagation();
                      router.push(`/seller/products/edit/${product._id}`);
                    }}
                  >
                    <IoMdCreate size={18} /> Edit
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1 rounded-xl h-11 font-bold flex items-center justify-center gap-2"
                    onClick={e => {
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
    </div>
  );
}