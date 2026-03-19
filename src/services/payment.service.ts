import Order from "@/models/Order";

export async function createPayment(orderId: string) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  // Razorpay / Stripe order creation goes here
  return {
    orderId: order._id,
    amount: order.totalAmount,
    currency: "INR",
  };
}

export async function verifyPayment(orderId: string, status: string) {
  return Order.findByIdAndUpdate(
    orderId,
    { paymentStatus: status },
    { new: true }
  );
}
