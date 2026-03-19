"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

interface CartItem {
  product: {
    _id: string;
    name: string;
    price: number;
    images: { url: string }[];
  };
  quantity: number;
}

export default function CartPage() {
  const { user, loading: authLoading, getToken } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [address, setAddress] = useState("");
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [checkoutMode, setCheckoutMode] = useState<"ALL" | string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user?.address) {
      setAddress(user.address);
      setUseSavedAddress(true);
    } else {
      setUseSavedAddress(false);
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      const res = await fetch("/api/cart", {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCartItems(data.data.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch cart", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchCart();
  }, [user]);

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity < 1 || quantity > 3) return; // Limit min 1, max 3
    try {
      // Optimistic upate
      setCartItems((prev) =>
        prev.map((item) =>
          item.product?._id === productId ? { ...item, quantity } : item,
        ),
      );
      await fetch("/api/cart", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ productId, quantity }),
      });
    } catch (err) {
      console.error("Failed to update quantity", err);
      fetchCart(); // Revert on fail
    }
  };

  const removeItem = async (productId: string) => {
    try {
      setCartItems((prev) =>
        prev.filter((item) => item.product?._id !== productId),
      );
      await fetch(`/api/cart?productId=${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    } catch (err) {
      console.error("Failed to remove item", err);
      fetchCart();
    }
  };

  const handleBuyItem = (productId: string) => {
    setCheckoutMode(productId);
    setShowAddressModal(true);
  };

  const handleBuyAll = () => {
    setCheckoutMode("ALL");
    setShowAddressModal(true);
  };

  const confirmOrder = async () => {
    if (!address.trim()) return alert("Please enter delivery address");

    setProcessing(true);
    try {
      const itemsToBuy =
        checkoutMode === "ALL"
          ? cartItems
          : cartItems.filter((i) => i.product?._id === checkoutMode);

      // We place individual orders for each item because each product might have a different seller
      for (const item of itemsToBuy) {
        await fetch("/api/orders/instant", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            productId: item.product._id,
            quantity: item.quantity,
            deliveryAddress: address,
            paymentMethod: "COD",
          }),
        });
      }

      // Clear the cart if ALL were bought, or remove the specific item
      if (checkoutMode === "ALL") {
        await fetch("/api/cart", {
          method: "DELETE",
          headers: { Authorization: `Bearer ${getToken()}` },
        });
      } else {
        await removeItem(checkoutMode!);
      }

      alert("Order(s) placed successfully!");
      setShowAddressModal(false);
      router.push("/orders");
    } catch (err) {
      console.error(err);
      alert("Failed to place order.");
    } finally {
      setProcessing(false);
    }
  };

  if (authLoading) return <div className="p-8 text-center">Loading...</div>;

  if (!user) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
        <p className="mb-4">Please login to view your cart.</p>
        <Link href="/auth/login">
          <Button>Login</Button>
        </Link>
      </div>
    );
  }

  if (loading) return <div className="p-8 text-center">Loading cart...</div>;

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-xl mb-4">Your cart is empty</p>
          <Link href="/">
            <Button>Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {cartItems.map((item, index) => {
            if (!item.product) return null;
            return (
              <div
                key={index}
                className="flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-transparent dark:border-gray-700"
              >
                <div className="w-24 h-24 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                  {item.product.images?.[0]?.url && (
                    <img
                      src={item.product.images[0].url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                    {item.product.name}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Price: ₹{item.product.price}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={item.quantity}
                    onChange={(e) =>
                      updateQuantity(item.product._id, parseInt(e.target.value))
                    }
                    className="border dark:border-gray-600 rounded px-2 py-1 bg-gray-50 dark:bg-gray-700 dark:text-gray-100"
                  >
                    {[1, 2, 3].map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="font-bold text-xl min-w-[80px] text-right">
                  ₹{item.product.price * item.quantity}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleBuyItem(item.product._id)}
                  >
                    Buy Item
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 border-red-500 hover:bg-red-50"
                    onClick={() => removeItem(item.product._id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}

          <div className="flex justify-end pt-6 border-t dark:border-gray-700 font-bold text-2xl text-gray-900 dark:text-gray-100">
            Total: ₹
            {cartItems.reduce(
              (acc, item) => acc + (item.product?.price || 0) * item.quantity,
              0,
            )}
          </div>
          <div className="flex justify-end mt-4">
            <Button size="lg" onClick={handleBuyAll}>
              Checkout All Items
            </Button>
          </div>
        </div>
      )}

      {/* Address Selection Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-300 border border-transparent dark:border-gray-700">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Complete Checkout
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
                    if (useSavedAddress) setAddress("");
                  }}
                  className="w-4 h-4 text-purple-600"
                />
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  Add New Address
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
                disabled={processing}
              >
                Cancel
              </Button>
              <Button onClick={confirmOrder} disabled={processing}>
                {processing ? "Processing..." : "Confirm Purchase"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
