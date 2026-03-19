"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Product {
  _id: string;
  name: string;
  price: number;
  images?: { url: string }[];
}

export default function InstantOrderPage() {
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  // productId comes from query ?productId=xxxx
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("productId");
    if (!productId) return;

    fetch(`/api/products/${productId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProduct(data.data);
      });
  }, []);

  const placeInstantOrder = async () => {
    if (!product || !address) return alert("Fill all details");

    setLoading(true);

    try {
      const res = await fetch("/api/orders/instant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": localStorage.getItem("userId") || "",
        },
        body: JSON.stringify({
          productId: product._id,
          quantity,
          address,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/orders/${data.data._id}`);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Order failed");
    } finally {
      setLoading(false);
    }
  };

  if (!product) return <p className="p-4">Loading product...</p>;

  return (
    <div className="container mx-auto p-4 max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Instant Order</h1>

      {/* Product */}
      <div className="border rounded-lg p-4 flex gap-4">
        {product.images?.[0]?.url && (
          <img
            src={product.images[0].url}
            className="w-24 h-24 object-cover rounded"
            alt={product.name}
          />
        )}
        <div>
          <h2 className="font-semibold">{product.name}</h2>
          <p className="text-gray-600">₹{product.price}</p>
        </div>
      </div>

      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Quantity
        </label>
        <Input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Delivery Address
        </label>
        <textarea
          className="w-full border rounded-md p-2"
          rows={3}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      {/* Summary */}
      <div className="border rounded-lg p-4 flex justify-between">
        <span>Total</span>
        <span className="font-bold">
          ₹{product.price * quantity}
        </span>
      </div>

      {/* Action */}
      <Button onClick={placeInstantOrder} disabled={loading}>
        {loading ? "Placing Order..." : "Place Instant Order"}
      </Button>
    </div>
  );
}
