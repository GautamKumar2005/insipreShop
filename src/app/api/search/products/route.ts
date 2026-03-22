import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import "@/models/User"; // Import User model to fix populate crash
import { success, error } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;
    const minPrice = searchParams.get("minPrice") || undefined;
    const maxPrice = searchParams.get("maxPrice") || undefined;

    // Use the static method on the model
    // Cast strict type as we know the method exists from our model definition
    const products = await (Product as any).searchProducts({
      search,
      category,
      minPrice,
      maxPrice,
    });

    return success(products);
  } catch (err: any) {
    console.error("Product search error:", err);
    return error(err.message || "Product search failed");
  }
}
