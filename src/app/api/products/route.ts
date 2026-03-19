import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import { ROLES } from "@/lib/constants";

/**
 * PUBLIC: anyone can fetch products
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    console.log("Fetching products with filters");
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    const query: any = { isActive: true }; // Only active products

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } }, // Allow searching by category name too
      ];
    }

    if (category && category !== "All") {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    return NextResponse.json(
      { success: true, data: products },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

/**
 * PROTECTED: seller only
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const userId = req.headers.get("x-user-id");
    const role = req.headers.get("x-user-role");

    if (!userId || role !== ROLES.SELLER) {
      return NextResponse.json(
        { success: false, message: "Only sellers can add products" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const product = await Product.create({
      seller: userId,
      name: body.name,
      description: body.description,
      price: body.price,
      stock: body.stock,
      images: body.images || [],
    });

    return NextResponse.json(
      { success: true, data: product },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
