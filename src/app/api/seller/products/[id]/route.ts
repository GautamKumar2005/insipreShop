export const runtime = "nodejs";

import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import { success, error } from "@/lib/response";
import { ROLES } from "@/lib/constants";
import { verifyAccessToken } from "@/lib/jwt";

/* =========================
   Helper: get user from JWT
========================= */
function getUserFromToken(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.split(" ")[1];
  const decoded: any = verifyAccessToken(token);

  if (!decoded?.id || !decoded?.role) {
    throw new Error("Invalid or expired token");
  }

  return decoded; // { id, role }
}

/* =========================
   GET /api/seller/products/:id
========================= */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;

    const user = getUserFromToken(req);
    if (user.role !== ROLES.SELLER) {
      return error("Seller only", 403);
    }

    const product = await Product.findOne({
      _id: new mongoose.Types.ObjectId(id),
      seller: new mongoose.Types.ObjectId(user.id),
    });

    if (!product) return error("Product not found", 404);

    return success(product);
  } catch (err: any) {
    return error(err.message || "Failed to fetch product", 400);
  }
}

/* =========================
   PUT /api/seller/products/:id
========================= */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params; 

    const user = getUserFromToken(req);
    if (user.role !== ROLES.SELLER) {
      return error("Seller only", 403);
    }

    const productBefore = await Product.findOne({
      _id: new mongoose.Types.ObjectId(id),
      seller: new mongoose.Types.ObjectId(user.id),
    });

    if (!productBefore) {
      return error("Product not found or unauthorized", 404);
    }

    if (productBefore.isEdited) {
      return error("This product has already been edited once. Further edits are not allowed to avoid misleading assignments.", 400);
    }

    const body = await req.json();
    delete body.seller;
    body.isEdited = true; // Mark as edited

    const product = await Product.findByIdAndUpdate(
      productBefore._id,
      body,
      { new: true, runValidators: true }
    );

    return success(product);
  } catch (err: any) {
    return error(err.message || "Product update failed", 400);
  }
}

/* =========================
   DELETE /api/seller/products/:id
========================= */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params; // ✅ FIX HERE

    const user = getUserFromToken(req);
    if (user.role !== ROLES.SELLER) {
      return error("Seller only", 403);
    }

    const product = await Product.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      seller: new mongoose.Types.ObjectId(user.id),
    });

    if (!product) {
      return error("Product not found or unauthorized", 404);
    }

    return success({ message: "Product deleted successfully" });
  } catch (err: any) {
    return error(err.message || "Product deletion failed", 400);
  }
}
