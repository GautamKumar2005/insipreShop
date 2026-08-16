"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/utils/date";

interface OrderItem {
  product: {
    _id: string;
    name: string;
    price: number;
    images?: { url: string }[];
  };
  quantity: number;
  price: number; // Historical price
}

interface Order {
  _id: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return; // or redirect to login

      const res = await fetch("/api/orders", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (err) {
          } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) return <p className="p-4 text-center text-gray-500 dark:text-gray-400">Loading orders...</p>;
  if (orders.length === 0)
    return <p className="p-4 text-center text-gray-500 dark:text-gray-400">You have no orders yet.</p>;

  return (
    <div className="container mx-auto p-4 space-y-6 text-gray-850 dark:text-gray-100">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Orders</h1>

      {orders.map((order) => (
        <div key={order._id} className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <p className="font-semibold text-gray-900 dark:text-white">
              Order ID: <span className="text-gray-600 dark:text-gray-400 font-mono text-sm">#{order._id.slice(-6).toUpperCase()}</span>
            </p>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                (order.paymentStatus === "PAID" || ["DELIVERED", "COMPLETED"].includes(order.status)) ? "bg-green-50 text-green-700 dark:bg-green-950/20" : "bg-amber-50 text-amber-700 dark:bg-amber-950/20"
              }`}>
                {(order.paymentStatus === "PAID" || ["DELIVERED", "COMPLETED"].includes(order.status)) ? "PAID" : order.paymentStatus || "PENDING"}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 font-bold">
                {order.status}
              </span>
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            Placed on: {formatDate(order.createdAt)}
          </div>

          <div className="space-y-4 pt-2">
            {order.items.map((item, index) => (
              <div
                key={index}
                className="flex gap-4 items-center border-b border-gray-100 dark:border-gray-800 pb-2 last:border-0"
              >
                {/* Product Image */}
                <div className="w-16 h-16 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
                  {item.product?.images?.[0]?.url ? (
                    <img
                      src={item.product.images[0].url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs">
                      No Img
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900 dark:text-white line-clamp-1">
                    {item.product?.name || "Product Unavailable"}
                  </p>
                  <div className="flex justify-between mt-1 text-sm text-gray-600 dark:text-gray-400">
                    <span>Qty: {item.quantity}</span>
                    <span className="font-semibold">
                      ₹
                      {(item.price || item.product?.price || 0) * item.quantity}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800">
            <p className="font-semibold text-gray-900 dark:text-white">Total: ₹{order.totalAmount}</p>

            <div className="flex gap-2">
              {order.paymentStatus !== "PAID" && !["DELIVERED", "COMPLETED", "CANCELLED"].includes(order.status) && (
                <Link href={`/orders/${order._id}?pay=true`}>
                  <Button className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                    Make Payment
                  </Button>
                </Link>
              )}
              <Link href={`/orders/${order._id}`}>
                <Button variant="outline">View Details</Button>
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
