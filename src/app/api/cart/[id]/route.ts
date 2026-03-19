import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Cart from "@/models/Cart";
import { success, error } from "@/lib/response";

interface Params {
  params: { id: string };
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await connectDB();

    const userId = req.headers.get("x-user-id");
    if (!userId) return error("Unauthorized", 401);

    const { quantity } = await req.json();

    const cartItem = await Cart.findOneAndUpdate(
      { _id: params.id, user: userId },
      { quantity },
      { new: true }
    ).populate("product");

    if (!cartItem) return error("Cart item not found", 404);

    return success(cartItem);
  } catch (err: any) {
    return error(err.message || "Failed to update cart item");
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await connectDB();

    const userId = req.headers.get("x-user-id");
    if (!userId) return error("Unauthorized", 401);

    const cartItem = await Cart.findOneAndDelete({
      _id: params.id,
      user: userId,
    });

    if (!cartItem) return error("Cart item not found", 404);

    return success({ message: "Cart item removed" });
  } catch (err: any) {
    return error(err.message || "Failed to delete cart item");
  }
}
