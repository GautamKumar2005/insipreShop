import Order from "@/models/Order";
import Cart from "@/models/Cart";

export async function createOrder(
  buyerId: string,
  sellerId: string,
  address: string
) {
  const cart = await Cart.findOne({ user: buyerId }).populate("items.product");
  if (!cart) throw new Error("Cart is empty");

  const items = cart.items.map((i: any) => ({
    product: i.product._id,
    quantity: i.quantity,
    price: i.product.price,
  }));

  const totalAmount = items.reduce(
    (sum: number, i: any) => sum + i.price * i.quantity,
    0
  );

  const order = await Order.create({
    buyer: buyerId,
    seller: sellerId,
    items,
    totalAmount,
    deliveryAddress: address,
  });

  await Cart.findOneAndDelete({ user: buyerId });

  return order;
}

export async function updateOrderStatus(orderId: string, status: string) {
  return Order.findByIdAndUpdate(orderId, { status }, { new: true });
}
