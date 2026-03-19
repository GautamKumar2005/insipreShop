// seller/products/route.ts
export const runtime = "nodejs"; // ✅ Force Node runtime

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import { success, error } from "@/lib/response";
import { verifyAccessToken } from "@/lib/jwt";
import { ROLES } from "@/lib/constants";

// -------------------
// Helper: get user info from JWT
// -------------------
async function getUserFromToken(req: NextRequest) {
  const authHeader = req.headers.get("authorization"); // Bearer <token>
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");

  const token = authHeader.split(" ")[1];
  const decoded: any = verifyAccessToken(token);

  if (!decoded || !decoded.id || !decoded.role) {
    throw new Error("Invalid or expired token");
  }

  return decoded; // { id, role }
}

// -------------------
// POST /api/seller/products
// Only seller can add products
// -------------------
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // ✅ Get seller info from JWT
    const user = await getUserFromToken(req);
    if (user.role !== ROLES.SELLER) return error("Seller only", 403);

    const body = await req.json();
    const { name, description, price, stock, category, images } = body;

    // ✅ Validation
    if (!name || !price || !stock || !category) {
      return error("Missing required fields: name, price, stock, category", 400);
    }

    // ✅ Create product
    const product = await Product.create({
      seller: user.id, // link seller automatically
      name,
      description: description || "",
      price,
      stock,
      category,
      images: images || [],
    });

    return success(product, "Product created");
  } catch (err: any) {
    return error(err.message || "Product creation failed");
  }
}

// -------------------
// GET /api/seller/products
// Fetch all products (anyone can see)
// -------------------
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Fetch all products
    const products = await Product.find({}).sort({ createdAt: -1 });

    return success(products);
  } catch (err: any) {
    return error(err.message || "Failed to fetch products");
  }
}
