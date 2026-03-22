"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
}

interface DeliveryPerson {
  _id: string; // Ensure this is returned
  name: string;
  phone: string;
  email: string;
  profilePhoto?: { url: string };
}

interface DeliveryTask {
  status: string;
  pickupLocation: string;
  dropLocation: string;
  deliveryPerson?: DeliveryPerson;
}

interface Order {
  _id: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  paymentStatus: string;
  deliveryAddress: string; // Used for display
  deliveryInfo?: {
    // Existing structure just in case
    name: string;
    phone: string;
    address: string;
  };
  createdAt: string;
  deliveryStatus?: string;
  deliveryTask?: DeliveryTask;
}

export default function OrderDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
                return;
      }

      const res = await fetch(`/api/orders/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
      } else {
              }
    } catch (err) {
          } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const handleChat = async () => {
    if (!order?.deliveryTask?.deliveryPerson?._id) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/chat/room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          participantId: order.deliveryTask.deliveryPerson._id,
          orderId: order._id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/chat/${data.data._id}`);
      } else {
              }
    } catch (err) {
          }
  };

  if (loading) return <p className="p-4">Loading order...</p>;
  if (!order) return <p className="p-4">Order not found.</p>;

  const deliveryPerson = order.deliveryTask?.deliveryPerson;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Link href="/orders" className="text-sm text-blue-600">
        ← Back to Orders
      </Link>

      <h1 className="text-2xl font-bold">Order Details</h1>

      {/* Order Info */}
      <div className="border rounded-lg p-4 space-y-2">
        <p>
          <strong>Order ID:</strong> {order._id}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          <span className="px-2 py-1 rounded bg-gray-100">{order.status}</span>
        </p>
        <p>
          <strong>Payment:</strong>{" "}
          <span className="px-2 py-1 rounded bg-gray-100">
            {["DELIVERED", "COMPLETED"].includes(order.status)
              ? "PAID"
              : order.paymentStatus || "PENDING"}
          </span>
        </p>
        <p>
          <strong>Placed on:</strong> {formatDate(order.createdAt)}
        </p>
      </div>

      {/* Items */}
      <div className="border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold text-lg">Items</h2>
        {order.items.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between border-b pb-2"
          >
            <div className="flex items-center gap-4">
              {item.product.images?.[0]?.url && (
                <img
                  src={item.product.images[0].url}
                  alt={item.product.name}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div>
                <p className="font-medium">{item.product.name}</p>
                <p className="text-sm text-gray-500">
                  ₹{item.product.price} × {item.quantity}
                </p>
              </div>
            </div>
            <p className="font-medium">₹{item.product.price * item.quantity}</p>
          </div>
        ))}
      </div>

      {/* Delivery Information */}
      <div className="border rounded-lg p-4 space-y-3 bg-blue-50">
        <h2 className="font-semibold text-lg text-blue-800">
          Delivery Information
        </h2>

        {/* Status */}
        <p>
          <strong>Delivery Status: </strong>
          <span className="font-medium text-blue-900">
            {order.deliveryStatus || "WAITING"}
          </span>
        </p>

        {/* Locations */}
        {order.deliveryTask && (
          <div className="text-sm space-y-1">
            <p>
              <strong>From:</strong> {order.deliveryTask.pickupLocation}
            </p>
            <p>
              <strong>To:</strong> {order.deliveryTask.dropLocation}
            </p>
          </div>
        )}

        {/* Delivery Person */}
        {deliveryPerson ? (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="font-medium">Delivery Partner:</p>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                {deliveryPerson.profilePhoto?.url ? (
                  <img
                    src={deliveryPerson.profilePhoto.url}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                    👤
                  </div>
                )}
                <div>
                  <p className="font-semibold">{deliveryPerson.name}</p>
                  <p className="text-xs text-gray-600">
                    {deliveryPerson.phone}
                  </p>
                </div>
              </div>

              <Button onClick={handleChat} variant="outline" size="sm">
                💬 Chat
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic mt-2">
            Searching for a delivery partner...
          </p>
        )}
      </div>

      {/* Total */}
      <div className="border rounded-lg p-4 flex justify-between items-center">
        <p className="text-lg font-bold">Total: ₹{order.totalAmount}</p>
        {order.status === "PENDING" && <Button>Cancel Order</Button>}
      </div>
    </div>
  );
}
