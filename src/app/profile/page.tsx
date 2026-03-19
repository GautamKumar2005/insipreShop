"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import Image from "next/image";
import { formatDateShort } from "@/utils/date";
import { useState, useEffect } from "react";

interface OrderSummary {
  _id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: {
    product: {
      name: string;
      images: { url: string }[];
    };
    quantity: number;
  }[];
}

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    dob: "",
  });
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: (user as any).phone || "",
        address: user.address || "",
        dob: (user as any).dob
          ? new Date((user as any).dob).toISOString().split("T")[0]
          : "",
      });

      if (user.role === "buyer") {
        fetchOrders();
      }
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data.slice(0, 5)); // Show recent 5
      }
    } catch (err) {
          }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setIsEditing(false);
        window.location.reload();
      } else {
        alert(data.message || "Failed to update");
      }
    } catch (err) {
            alert("Error saving profile");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result;
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");

        const res = await fetch("/api/upload/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "x-user-id": userId || "",
          },
          body: JSON.stringify({ image: base64data }),
        });

        const data = await res.json();
        if (data.success) {
          window.location.reload();
        } else {
          alert("Failed to upload image: " + data.message);
        }
      };
    } catch (err) {
            alert("Something went wrong uploading the image.");
    } finally {
      // Re-enable form after processing starts
      setTimeout(() => setUploadingImage(false), 2000);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center py-32">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    );

  if (!user) {
    return (
      <div className="container mx-auto p-8 text-center max-w-lg mt-20">
        <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
            Please Login
          </h1>
          <p className="text-gray-500 mb-8">
            You need to be securely logged in to view your profile settings.
          </p>
          <Link href="/auth/login">
            <Button className="w-full text-lg py-6 rounded-full shadow-lg">
              Login to Account
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const profileImageUrl =
    (user as any).profilePhoto?.url ||
    "https://ui-avatars.com/api/?name=" +
      encodeURIComponent(user.name) +
      "&background=F3E8FF&color=9333EA&size=200";

  return (
    <div className="bg-gray-50/50 min-h-screen pb-16">
      {/* Dynamic Header Badge Section */}
      <div className="h-48 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl -mt-24 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: Profile Identity Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl flex flex-col items-center pt-8 pb-10 px-6 border border-gray-100">
              <div className="relative group">
                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-white relative">
                  <Image
                    src={profileImageUrl}
                    alt={user.name}
                    fill
                    className={`object-cover ${uploadingImage ? "opacity-50" : ""}`}
                  />
                  {uploadingImage && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></span>
                    </div>
                  )}
                </div>

                {/* Upload Button overlaying avatar */}
                <label className="absolute bottom-1 right-2 w-10 h-10 bg-purple-600 hover:bg-purple-700 active:scale-95 transition-all text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg border-2 border-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              </div>

              <div className="text-center mt-5 w-full">
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.name}
                </h1>
                <p className="text-purple-600 font-medium text-sm mt-1 mb-2 capitalize px-3 py-1 bg-purple-50 rounded-full inline-block">
                  {user.role}
                </p>
                <p className="text-gray-500 text-sm mt-2">{user.email}</p>
                <p className="text-gray-500 text-sm mt-1">
                  {(user as any).phone || "+00 0000 0000"}
                </p>
              </div>

              <div className="w-full mt-8 border-t border-gray-100 pt-6">
                <Button
                  variant="outline"
                  className="w-full text-red-500 border-red-100 hover:bg-red-50 hover:border-red-200 transition-colors h-12 rounded-xl font-semibold"
                  onClick={() => logout()}
                >
                  Sign Out Securely
                </Button>
              </div>
            </div>

            {/* Role Specific Control Panel injected here for cleanliness */}
            {user.role === "seller" && (
              <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl shadow-xl p-8 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>
                <h2 className="text-2xl font-bold mb-3 relative z-10">
                  Seller Portal
                </h2>
                <p className="mb-6 opacity-80 text-sm leading-relaxed relative z-10">
                  Access advanced analytics, inventory management, and fulfill
                  active customer orders.
                </p>
                <Link href="/seller/dashboard">
                  <button className="bg-white/10 hover:bg-white backdrop-blur-md hover:text-purple-900 border border-white/20 transition-all w-full py-3 rounded-xl font-bold tracking-wide relative z-10">
                    Open Dashboard →
                  </button>
                </Link>
              </div>
            )}

            {user.role === "delivery" && (
              <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl shadow-xl p-8 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>
                <h2 className="text-2xl font-bold mb-3 relative z-10">
                  Delivery Hub
                </h2>
                <p className="mb-6 opacity-90 text-sm leading-relaxed relative z-10">
                  Track your active routes, manage package handoffs, and view
                  available local jobs.
                </p>
                <Link href="/delivery/dashboard">
                  <button className="bg-white/20 hover:bg-white backdrop-blur-md hover:text-orange-700 border border-white/30 transition-all w-full py-3 rounded-xl font-bold tracking-wide shadow-lg relative z-10">
                    Access Console →
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Edit Forms & History */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 p-8">
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800">
                  Account Settings
                </h2>
                <Button
                  variant={isEditing ? "outline" : "default"}
                  className={
                    !isEditing
                      ? "bg-purple-600 hover:bg-purple-700 shadow-lg px-6 rounded-full"
                      : "px-6 rounded-full"
                  }
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? "Cancel Edit" : "Edit Profile"}
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Full Legal Name
                  </label>
                  {isEditing ? (
                    <input
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none rounded-xl transition-all"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-lg font-medium text-gray-800 py-2">
                      {user.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Registered Email
                  </label>
                  <p className="text-lg font-medium text-gray-500 py-2 cursor-not-allowed opacity-80">
                    {user.email}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none rounded-xl transition-all"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-lg font-medium text-gray-800 py-2">
                      {(user as any).phone || "—"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Date of Birth
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none rounded-xl transition-all"
                      value={formData.dob}
                      onChange={(e) =>
                        setFormData({ ...formData, dob: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-lg font-medium text-gray-800 py-2">
                      {formData.dob || "—"}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Primary Address
                  </label>
                  {isEditing ? (
                    <textarea
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none rounded-xl transition-all"
                      rows={3}
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-lg font-medium text-gray-800 py-2 whitespace-pre-wrap leading-relaxed">
                      {user.address || (
                        <span className="text-gray-400 italic">
                          No primary shipping address configured
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end mt-8 pt-6 border-t border-gray-100">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto px-10 rounded-full h-12 shadow-lg shadow-purple-200 transition-all font-bold text-lg"
                  >
                    {saving ? "Processing..." : "Save Configuration"}
                  </Button>
                </div>
              )}
            </div>

            {/* BUYER: Order History */}
            {user.role === "buyer" && (
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 p-8">
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Order History
                  </h2>
                  <Link href="/orders">
                    <Button
                      variant="outline"
                      className="rounded-full text-purple-600 border-purple-200 hover:bg-purple-50"
                    >
                      View All Orders
                    </Button>
                  </Link>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium">
                      No order history available.
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      When you make a purchase, it will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {orders.map((order) => {
                      const firstProduct = order.items?.[0]?.product;
                      const imageUrl =
                        firstProduct?.images?.[0]?.url || "/placeholder.png";

                      return (
                        <Link
                          href={`/orders/${order._id}`}
                          key={order._id}
                          className="block group"
                        >
                          <div className="flex gap-5 items-center p-4 rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all bg-white hover:bg-purple-50/30">
                            <div className="relative w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-gray-200/50">
                              <Image
                                src={imageUrl}
                                alt={firstProduct?.name || "Product"}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between flex-wrap gap-2 mb-2">
                                <span
                                  className={`text-[11px] uppercase tracking-wider font-bold px-3 py-1 rounded-full ${
                                    order.status === "DELIVERED"
                                      ? "bg-green-100 text-green-700"
                                      : order.status === "CANCELLED"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-blue-100 text-blue-700"
                                  }`}
                                >
                                  {order.status}
                                </span>
                                <p className="text-xs text-gray-400 font-medium">
                                  #{order._id.slice(-6).toUpperCase()}
                                </p>
                              </div>

                              <h3 className="text-lg font-bold text-gray-900 truncate pr-4">
                                {firstProduct?.name || "Unavailable Product"}
                                {order.items.length > 1 && (
                                  <span className="text-gray-400 font-normal text-sm ml-2 px-2 py-0.5 bg-gray-100 rounded-full">
                                    +{order.items.length - 1} more
                                  </span>
                                )}
                              </h3>

                              <div className="flex justify-between items-center mt-2">
                                <p className="text-sm text-gray-500">
                                  {formatDateShort(order.createdAt)}
                                </p>
                                <p className="font-bold text-gray-900 text-lg">
                                  ₹{order.totalAmount}
                                </p>
                              </div>
                            </div>

                            <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 text-gray-400 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 ml-1"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
