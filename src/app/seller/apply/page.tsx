"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SellerApplyPage() {
  const router = useRouter();

  const [shopName, setShopName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submitApplication = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/seller/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": localStorage.getItem("userId") || "",
          "x-user-role": "USER",
        },
        body: JSON.stringify({ shopName, address }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Application failed");
        return;
      }

      router.push("/seller/dashboard");
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-4">Apply as Seller</h1>

        {error && (
          <p className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </p>
        )}

        <div className="space-y-4">
          <Input
            placeholder="Shop Name"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
          />

          <Input
            placeholder="Shop Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <Button
            className="w-full"
            disabled={loading}
            onClick={submitApplication}
          >
            {loading ? "Submitting..." : "Apply"}
          </Button>
        </div>
      </div>
    </div>
  );
}
