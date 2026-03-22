// app/api/cart/route.ts
export const runtime = "nodejs";

import "@/models/_init"; // 🔥 ensures all models registered

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import { success, error } from "@/lib/response";


// ==========================
// GET CART
// ==========================
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const userId = req.headers.get("x-user-id");
    if (!userId) return error("Unauthorized", 401);

    const cart = await Cart.findOne({ user: userId })
      .populate("items.product", "name price images");

    return success(cart || { items: [] });
  } catch (err: any) {
    return error(err.message || "Failed to fetch cart");
  }
}


// ==========================
// ADD TO CART
// ==========================
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const userId = req.headers.get("x-user-id");
    if (!userId) return error("Unauthorized", 401);

    const { productId, quantity = 1 } = await req.json();

    if (!productId) return error("Product ID required", 400);
    if (quantity <= 0) return error("Quantity must be greater than 0", 400);

    const product = await Product.findById(productId);
    if (!product) return error("Product not found", 404);

    let cart = await Cart.findOne({ user: userId });

    // 🔹 CREATE CART
    if (!cart) {
      cart = await Cart.create({
        user: userId,
        items: [{ product: productId, quantity }],
      });

      return success(cart, 201);
    }

    // 🔹 UPDATE CART
    const itemIndex = cart.items.findIndex(
      (item: any) => item.product.toString() === productId
    );

    if (itemIndex !== -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();

    return success(cart, 200);
  } catch (err: any) {
    return error(err.message || "Failed to add to cart");
  }
}

// ==========================
// UPDATE CART ITEM QUANTITY
// ==========================
export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    const userId = req.headers.get("x-user-id");
    if (!userId) return error("Unauthorized", 401);

    const { productId, quantity } = await req.json();

    if (!productId) return error("Product ID required", 400);

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return error("Cart not found", 404);

    const itemIndex = cart.items.findIndex(
      (item: any) => item.product.toString() === productId
    );

    if (itemIndex !== -1) {
      if (quantity <= 0) {
        // Remove item
        cart.items.splice(itemIndex, 1);
      } else {
        // Limit max to 3
        cart.items[itemIndex].quantity = Math.min(quantity, 3);
      }
      await cart.save();
      return success(cart, 200);
    } else {
      return error("Item not found in cart", 404);
    }
  } catch (err: any) {
    return error(err.message || "Failed to update cart");
  }
}

// ==========================
// REMOVE FROM CART
// ==========================
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    await connectDB();
    const userId = req.headers.get("x-user-id");
    if (!userId) return error("Unauthorized", 401);

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return error("Cart not found", 404);

    if (!productId) {
      // Clear entire cart
      cart.items = [];
      await cart.save();
      return success(cart, 200);
    }

    const itemIndex = cart.items.findIndex(
      (item: any) => item.product.toString() === productId
    );

    if (itemIndex !== -1) {
      cart.items.splice(itemIndex, 1);
      await cart.save();
    }

    return success(cart, 200);
  } catch (err: any) {
    return error(err.message || "Failed to remove item");
  }
}
