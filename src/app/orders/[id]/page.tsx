"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  _id: string;
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
  deliveryAddress: string;
  createdAt: string;
  deliveryStatus?: string;
  deliveryTask?: DeliveryTask;
}

export default function OrderDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoPay = searchParams?.get("pay") === "true";
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Payment Configuration & Session States
  const [showPaymentConfig, setShowPaymentConfig] = useState(false);
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [isInitializingSession, setIsInitializingSession] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [transactionId, setTransactionId] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  
  // Card details mock states
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`/api/orders/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
      }
    } catch (err) {
      console.error("Error loading order details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  useEffect(() => {
    if (order && autoPay && order.paymentStatus !== "PAID" && !showPaymentConfig) {
      handleInitializePayment();
    }
  }, [order, autoPay]);

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
      }
    } catch (err) {
      console.error("Error creating chat room:", err);
    }
  };

  // Payment countdown timer effect
  useEffect(() => {
    if (!sessionExpiry) return;

    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((sessionExpiry.getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);

      if (diff <= 0) {
        setShowPaymentConfig(false);
        setSessionExpiry(null);
        setPaymentError("Your 10-minute payment session has expired. Please start a new session.");
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [sessionExpiry]);

  const handleInitializePayment = async () => {
    if (!order) return;
    setPaymentError("");
    setIsInitializingSession(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/orders/pay/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId: order._id }),
      });

      const data = await res.json();
      if (data.success) {
        setSessionExpiry(new Date(data.data.expiresAt));
        setShowPaymentConfig(true);
      } else {
        setPaymentError(data.message || "Failed to initialize payment session.");
      }
    } catch (err) {
      setPaymentError("Server error starting payment session.");
    } finally {
      setIsInitializingSession(false);
    }
  };

  const handleCompletePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setPaymentError("");

    if (!transactionId.trim()) {
      setPaymentError("Transaction Reference/UTR ID is required to log the payment.");
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/orders/pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: order._id,
          amount: order.totalAmount,
          paymentMethod,
          transactionId: transactionId.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Payment verified and completed successfully!");
        setShowPaymentConfig(false);
        setSessionExpiry(null);
        fetchOrder();
      } else {
        setPaymentError(data.message || "Failed to log payment transaction.");
      }
    } catch (err) {
      setPaymentError("Server error processing payment verification.");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const formatTimeLeft = () => {
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (loading) return <p className="p-4">Loading order...</p>;
  if (!order) return <p className="p-4">Order not found.</p>;

  const deliveryPerson = order.deliveryTask?.deliveryPerson;
  const isPaymentPending = order.paymentStatus !== "PAID" && !["DELIVERED", "COMPLETED", "CANCELLED"].includes(order.status);

  // Generate real dynamic scan-ready UPI payment string
  const upiUrl = `upi://pay?pa=inspireshop@upi&pn=InspireShop&am=${order.totalAmount}&tr=${order._id}&cu=INR`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-3xl">
      <Link href="/orders" className="text-sm text-blue-600 hover:underline">
        ← Back to Orders
      </Link>

      <h1 className="text-3xl font-extrabold tracking-tight">Order Details</h1>

      {/* Order Info */}
      <div className="border rounded-2xl p-6 bg-white dark:bg-gray-900 shadow-sm space-y-3">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <p className="text-sm text-gray-500">
            <strong>Order ID:</strong> <span className="font-mono text-gray-800 dark:text-gray-200">{order._id}</span>
          </p>
          <span className="text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
            {order.status}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <p className="text-sm">
            <strong>Payment Status:</strong>{" "}
            <span className={`ml-1 font-bold ${order.paymentStatus === "PAID" ? "text-green-600" : "text-amber-600"}`}>
              {["DELIVERED", "COMPLETED"].includes(order.status) ? "PAID" : order.paymentStatus || "PENDING"}
            </span>
          </p>
          <p className="text-sm">
            <strong>Placed on:</strong> {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      {/* Complete Payment Section (Interactive UPI QR Code & Forms) */}
      {isPaymentPending && (
        <div className="border border-amber-200 dark:border-amber-900/40 rounded-2xl p-6 bg-amber-50/50 dark:bg-amber-950/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
              <span className="text-2xl">💳</span>
              <h2 className="font-extrabold text-xl">Order Payment</h2>
            </div>
            
            {!showPaymentConfig && (
              <Button
                onClick={handleInitializePayment}
                disabled={isInitializingSession}
                className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-6 py-2.5 rounded-full shadow"
              >
                {isInitializingSession ? "Starting Session..." : "Make Payment"}
              </Button>
            )}
          </div>
          
          {paymentError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl">
              ⚠️ {paymentError}
            </div>
          )}

          {!showPaymentConfig ? (
            <p className="text-sm text-gray-500">
              Payment is pending for this order. Click the **Make Payment** button to start a secure 10-minute payment session.
            </p>
          ) : (
            <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-gray-900">
              {/* Session timer banner */}
              <div className="flex items-center justify-between bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 px-4 py-2.5 rounded-xl border border-red-100 dark:border-red-950/50 text-xs font-bold">
                <span>⏱️ SESSION TIMEOUT WARNING</span>
                <span className="font-mono text-sm tracking-wider">Expires in: {formatTimeLeft()}</span>
              </div>

              {/* Payment option tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-800">
                {(["upi", "card", "netbanking"] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                      paymentMethod === method
                        ? "border-amber-500 text-amber-700 dark:text-amber-400 font-extrabold"
                        : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {method === "upi" ? "📲 UPI QR Code" : method === "card" ? "💳 Card" : "🏛️ Net Banking"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleCompletePayment} className="space-y-6">
                {/* Method Details */}
                {paymentMethod === "upi" && (
                  <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="relative w-44 h-44 bg-white p-2 border rounded-xl flex-shrink-0 shadow-sm">
                      <img src={qrImageUrl} alt="UPI Payment QR Code" className="w-full h-full object-contain" />
                    </div>
                    <div className="space-y-2 text-center md:text-left">
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">Scan QR to Pay via UPI</h4>
                      <p className="text-xs text-gray-500 max-w-sm">
                        Open Google Pay, PhonePe, Paytm, or BHIM and scan this QR code. Once paid, write the transaction UTR below.
                      </p>
                      <div className="pt-1">
                        <span className="text-xs font-mono bg-gray-50 dark:bg-gray-950 p-2 rounded border block select-all">
                          UPI ID: inspireshop@upi
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "card" && (
                  <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 space-y-4 max-w-md">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">Mock Card Details</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Card Number"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                        className="w-full p-2.5 rounded-lg border text-sm font-semibold dark:bg-gray-950 dark:border-gray-800"
                      />
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value.slice(0, 5))}
                          className="w-1/2 p-2.5 rounded-lg border text-sm font-semibold dark:bg-gray-950 dark:border-gray-800"
                        />
                        <input
                          type="password"
                          placeholder="CVV"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                          className="w-1/2 p-2.5 rounded-lg border text-sm font-semibold dark:bg-gray-950 dark:border-gray-800"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "netbanking" && (
                  <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 space-y-3 max-w-md">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">Choose Your Bank</h4>
                    <select className="w-full p-2.5 rounded-lg border text-sm font-semibold dark:bg-gray-950 dark:border-gray-800">
                      <option>State Bank of India (SBI)</option>
                      <option>HDFC Bank</option>
                      <option>ICICI Bank</option>
                      <option>Axis Bank</option>
                      <option>Kotak Mahindra Bank</option>
                    </select>
                  </div>
                )}

                {/* Reference Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase text-amber-800 dark:text-amber-400 tracking-wider">
                    Transaction Reference / UTR ID
                  </label>
                  <input
                    type="text"
                    placeholder="Enter 12-digit UTR or Payment Reference ID"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full max-w-md p-3 rounded-xl border border-amber-200 dark:border-amber-900/40 text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none dark:bg-gray-950"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPaymentConfig(false);
                      setSessionExpiry(null);
                    }}
                    className="rounded-full px-6 font-bold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingPayment}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-8 py-3 rounded-full shadow-lg shadow-amber-500/10"
                  >
                    {isSubmittingPayment ? "Verifying..." : "Confirm & Submit Payment"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Items List */}
      <div className="border rounded-2xl p-6 bg-white dark:bg-gray-900 shadow-sm space-y-4">
        <h2 className="font-extrabold text-xl">Items Ordered</h2>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {order.items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-50 border rounded-xl overflow-hidden relative flex-shrink-0">
                  {item.product.images?.[0]?.url ? (
                    <img
                      src={item.product.images[0].url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white line-clamp-1">{item.product.name}</p>
                  <p className="text-xs text-gray-400 font-bold mt-1">
                    ₹{item.product.price} × {item.quantity}
                  </p>
                </div>
              </div>
              <p className="font-extrabold text-gray-900 dark:text-white">₹{item.product.price * item.quantity}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Information */}
      <div className="border rounded-2xl p-6 bg-blue-50/50 dark:bg-blue-950/10 space-y-4">
        <h2 className="font-extrabold text-xl text-blue-900 dark:text-blue-400">
          Delivery Status
        </h2>

        <p className="text-sm">
          <strong>Status: </strong>
          <span className="font-black text-blue-900 dark:text-blue-300">
            {order.deliveryStatus || "WAITING"}
          </span>
        </p>

        {order.deliveryTask && (
          <div className="text-xs text-gray-500 space-y-1">
            <p>
              <strong>Pickup from:</strong> {order.deliveryTask.pickupLocation}
            </p>
            <p>
              <strong>Deliver to:</strong> {order.deliveryTask.dropLocation}
            </p>
          </div>
        )}

        {deliveryPerson ? (
          <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-950">
            <p className="font-bold text-xs text-blue-900 dark:text-blue-400 mb-2">Delivery Partner:</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 overflow-hidden flex items-center justify-center font-bold">
                  {deliveryPerson.profilePhoto?.url ? (
                    <img src={deliveryPerson.profilePhoto.url} className="w-full h-full object-cover" alt="Delivery partner" />
                  ) : (
                    "👤"
                  )}
                </div>
                <div>
                  <p className="font-extrabold text-sm">{deliveryPerson.name}</p>
                  <p className="text-xs text-gray-500">{deliveryPerson.phone}</p>
                </div>
              </div>

              <Button onClick={handleChat} variant="outline" size="sm">
                💬 Chat
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic">
            Assigning delivery partner...
          </p>
        )}
      </div>

      {/* Total amount summary bar */}
      <div className="border rounded-2xl p-6 bg-white dark:bg-gray-900 shadow-sm flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Payable Amount</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">₹{order.totalAmount}</p>
        </div>
        {order.status === "PENDING" && <Button>Cancel Order</Button>}
      </div>
    </div>
  );
}
