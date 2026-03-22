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

  if (loading) return <p className="p-4">Loading orders...</p>;
  if (orders.length === 0)
    return <p className="p-4">You have no orders yet.</p>;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">My Orders</h1>

      {orders.map((order) => (
        <div key={order._id} className="border rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <p className="font-semibold">
              Order ID: <span className="text-gray-600">{order._id}</span>
            </p>
            <span className="text-sm px-3 py-1 rounded bg-gray-100">
              {order.status}
            </span>
          </div>

          <div className="text-sm text-gray-600">
            Placed on: {formatDate(order.createdAt)}
          </div>

          <div className="space-y-4 pt-2">
            {order.items.map((item, index) => (
              <div
                key={index}
                className="flex gap-4 items-center border-b pb-2 last:border-0"
              >
                {/* Product Image */}
                <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden border">
                  {item.product?.images?.[0]?.url ? (
                    <img
                      src={item.product.images[0].url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No Img
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <p className="font-medium text-sm line-clamp-1">
                    {item.product?.name || "Product Unavailable"}
                  </p>
                  <div className="flex justify-between mt-1 text-sm text-gray-600">
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

          <div className="flex justify-between items-center pt-2 border-t">
            <p className="font-semibold">Total: ₹{order.totalAmount}</p>

            <Link href={`/orders/${order._id}`}>
              <Button>View Details</Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
