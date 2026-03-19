"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

export default function BuySection({ productId }: { productId: string }) {
  const router = useRouter();
  const { user, getToken } = useAuth(); // getToken is needed for instant order
  const [loading, setLoading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [address, setAddress] = useState("");
  const [useSavedAddress, setUseSavedAddress] = useState(true);

  // Sync address when user loads
  useEffect(() => {
    if (user?.address) {
      setAddress(user.address);
      setUseSavedAddress(true);
    } else {
      setUseSavedAddress(false);
    }
  }, [user]);

  // 🛒 Add to Cart Logic
  const handleAddToCart = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("Added to cart!");
      } else {
        alert(data.message || "Failed to add to cart");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // 🚀 Initial Buy Now Click
  const handleBuyNowClick = () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    // Pre-fill address if available
    if (user.address) {
      setAddress(user.address);
      setUseSavedAddress(true);
    } else {
      setUseSavedAddress(false);
    }
    // Show address input
    setShowAddressModal(true);
  };

  // 💳 Confirm Buy Now (Call Instant Order API)
  const confirmBuyNow = async () => {
    if (!address.trim()) {
      alert("Please enter a delivery address");
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch("/api/orders/instant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
          deliveryAddress: address,
          paymentMethod: "COD", // Default for now
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("Order placed successfully!");
        setShowAddressModal(false);
        router.push("/orders"); // Redirect to orders page
      } else {
        alert(data.message || "Failed to place order");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong placing the order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={handleBuyNowClick}
          className="flex-1 py-6 text-lg"
          disabled={loading}
        >
          Buy Now
        </Button>

        <Button
          variant="outline"
          onClick={handleAddToCart}
          className="flex-1 py-6 text-lg"
          disabled={loading}
        >
          {loading ? "Processing..." : "Add to Cart"}
        </Button>
      </div>

      {/* Address Selection Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-300 border border-transparent dark:border-gray-700">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Select Delivery Address
            </h3>

            {user?.address && (
              <div className="mb-4">
                <label className="flex items-center gap-2 p-3 border dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    name="addressOption"
                    checked={useSavedAddress}
                    onChange={() => {
                      setUseSavedAddress(true);
                      setAddress(user.address || "");
                    }}
                    className="w-4 h-4 text-purple-600"
                  />
                  <div className="flex-1">
                    <span className="font-semibold block text-gray-900 dark:text-gray-100">
                      Use Saved Address
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-300 block line-clamp-1">
                      {user.address}
                    </span>
                  </div>
                </label>
              </div>
            )}

            <div className="mb-4">
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="radio"
                  name="addressOption"
                  checked={!useSavedAddress}
                  onChange={() => {
                    setUseSavedAddress(false);
                    if (useSavedAddress) setAddress(""); // Clear if switching from saved
                  }}
                  className="w-4 h-4 text-purple-600"
                />
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  Add New / Different Address
                </span>
              </label>

              {!useSavedAddress && (
                <textarea
                  className="w-full p-3 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-gray-100"
                  placeholder="Full address (Street, City, Zip)"
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  autoFocus
                />
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowAddressModal(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={confirmBuyNow} disabled={loading}>
                {loading ? "Placing Order..." : "Confirm Order"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
