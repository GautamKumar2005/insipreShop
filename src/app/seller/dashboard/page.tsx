"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/utils/date";

interface Product {
  _id: string;
  name: string;
  price: number;
}

interface Order {
  _id: string;
  totalAmount: number;
  status: string;
}

export default function SellerDashboardPage() {
  const router = useRouter();
  const { getAuthHeaders } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const headers = getAuthHeaders();

      const [productRes, orderRes] = await Promise.all([
        fetch("/api/seller/products", { headers }),
        fetch("/api/orders", { headers }),
      ]);

      const productData = await productRes.json();
      const orderData = await orderRes.json();

      if (!productData.success) throw new Error(productData.message);
      if (!orderData.success) throw new Error(orderData.message);

      setProducts(productData.data);
      setOrders(orderData.data);
    } catch (err: any) {
      setError(err.message || "Dashboard failed");
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (participantId: string, orderId: string) => {
    try {
      const res = await fetch("/api/chat/room", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ participantId, orderId }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/chat/${data.data._id}`);
      } else {
              }
    } catch (err) {
          }
  };

  if (loading) return <p className="p-4">Loading...</p>;
  if (error) return <p className="p-4 text-red-600">{error}</p>;

  const revenue = orders.reduce((a, o) => a + o.totalAmount, 0);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold">Seller Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat title="Products" value={products.length} />
        <Stat title="Orders" value={orders.length} />
        <Stat title="Revenue" value={`₹${revenue}`} />
      </div>

      <div className="flex gap-3 border-b pb-6">
        <Button onClick={() => router.push("/seller/products")}>
          My Products
        </Button>
        <Button onClick={() => router.push("/seller/products/create")}>
          Add Product
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* New Orders */}
          <div>
            <h2 className="text-xl font-semibold border-b pb-2 mb-4 text-gray-800">
              New Orders (Placed / Pending)
            </h2>
            <div className="space-y-4">
              {orders.filter((o: any) =>
                ["PLACED", "PROCESSING"].includes(o.status),
              ).length === 0 ? (
                <p className="text-gray-500">No new orders found.</p>
              ) : (
                orders
                  .filter((o: any) =>
                    ["PLACED", "PROCESSING"].includes(o.status),
                  )
                  .slice(0, 10)
                  .map((o: any) => (
                    <OrderCard key={o._id} order={o} onChat={startChat} />
                  ))
              )}
            </div>
          </div>

          {/* In Progress */}
          <div>
            <h2 className="text-xl font-semibold border-b pb-2 mb-4 text-gray-800">
              In Progress (Picked Up / Transit)
            </h2>
            <div className="space-y-4">
              {orders.filter((o: any) =>
                ["CONFIRMED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(
                  o.status,
                ),
              ).length === 0 ? (
                <p className="text-gray-500">
                  No orders currently in progress.
                </p>
              ) : (
                orders
                  .filter((o: any) =>
                    [
                      "CONFIRMED",
                      "ASSIGNED",
                      "PICKED_UP",
                      "IN_TRANSIT",
                    ].includes(o.status),
                  )
                  .slice(0, 10)
                  .map((o: any) => (
                    <OrderCard key={o._id} order={o} onChat={startChat} />
                  ))
              )}
            </div>
          </div>

          {/* Completed */}
          <div>
            <h2 className="text-xl font-semibold border-b pb-2 mb-4 text-gray-800">
              Completed
            </h2>
            <div className="space-y-4">
              {orders.filter((o: any) =>
                ["DELIVERED", "COMPLETED", "CANCELLED"].includes(o.status),
              ).length === 0 ? (
                <p className="text-gray-500">No completed orders yet.</p>
              ) : (
                orders
                  .filter((o: any) =>
                    ["DELIVERED", "COMPLETED", "CANCELLED"].includes(o.status),
                  )
                  .slice(0, 10)
                  .map((o: any) => (
                    <OrderCard key={o._id} order={o} onChat={startChat} />
                  ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Top Products</h2>
          <div className="border rounded-xl divide-y bg-white shadow-sm">
            {products.length === 0 ? (
              <p className="text-gray-500 p-4">No products added yet.</p>
            ) : (
              products.slice(0, 5).map((p) => (
                <div key={p._id} className="flex justify-between p-4">
                  <span className="truncate pr-4 font-medium">{p.name}</span>
                  <span className="font-bold flex-shrink-0">₹{p.price}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ title, value }: any) {
  return (
    <div className="border rounded-xl p-4 shadow-sm bg-white">
      <p className="text-gray-500 text-sm uppercase font-semibold">{title}</p>
      <p className="text-3xl font-bold mt-1 text-purple-700">{value}</p>
    </div>
  );
}

function OrderCard({ order, onChat }: any) {
  return (
    <div className="border rounded-xl p-5 shadow-sm bg-white transition hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] px-2 py-1 uppercase tracking-wide rounded font-bold ${getStatusColor(order.status)}`}
            >
              {order.status}
            </span>
            <span className="text-xs text-gray-500 font-mono">
              #{order._id.slice(-6)}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            Placed on: {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="font-bold text-lg text-emerald-600">
          ₹{order.totalAmount}
        </div>
      </div>

      <div className="space-y-2">
        {order.items?.map((item: any, idx: number) => (
          <div
            key={idx}
            className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 p-2 rounded border border-gray-100"
          >
            <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
              {item.product?.images?.[0]?.url ? (
                <img
                  src={item.product.images[0].url}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-[10px] text-gray-400">
                  N/A
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-gray-800 dark:text-gray-100">
                {item.product?.name || "Product Removed"}
              </p>
              <div className="flex justify-between items-center pr-2 mt-1">
                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t">
        {order.delivery && (
          <Button
            onClick={() => onChat(order.delivery, order._id)}
            variant="outline"
            className="text-[11px] px-3 py-1 h-8 rounded-full border-purple-200 text-purple-600 hover:bg-purple-50"
          >
            🚚 Chat w/ Delivery
          </Button>
        )}
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case "PLACED":
      return "bg-gray-100 text-gray-800 border border-gray-200";
    case "PROCESSING":
    case "WAITING":
      return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    case "CONFIRMED":
    case "ASSIGNED":
      return "bg-blue-100 text-blue-800 border border-blue-200";
    case "PICKED_UP":
    case "IN_TRANSIT":
      return "bg-indigo-100 text-indigo-800 border border-indigo-200";
    case "DELIVERED":
    case "COMPLETED":
      return "bg-green-100 text-green-800 border border-green-200";
    case "CANCELLED":
      return "bg-red-100 text-red-800 border border-red-200";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
