import Cart from "@/models/Cart";

export async function getCart(userId: string) {
  return Cart.findOne({ user: userId }).populate("items.product");
}

export async function addToCart(userId: string, productId: string) {
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [{ product: productId, quantity: 1 }],
    });
  } else {
    const item = cart.items.find(
      (i) => i.product.toString() === productId
    );
    if (item) item.quantity += 1;
    else cart.items.push({ product: productId, quantity: 1 });

    await cart.save();
  }

  return cart;
}

export async function clearCart(userId: string) {
  return Cart.findOneAndDelete({ user: userId });
}
