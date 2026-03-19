import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import { v2 as cloudinary } from "cloudinary";
import { success, error } from "@/lib/response";
import { ROLES } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const userId = req.headers.get("x-user-id");
    const role = req.headers.get("x-user-role");

    if (!userId || role !== ROLES.SELLER) return error("Unauthorized", 403);

    const body = await req.json(); // { productId, images: [base64,...] }

    const { productId, images } = body;
    if (!productId || !images?.length) return error("No images provided", 400);

    const uploadedImages = [];

    for (const img of images) {
      const uploaded = await cloudinary.uploader.upload(img, {
        folder: "product_images",
        width: 800,
        height: 800,
        crop: "fill",
      });
      uploadedImages.push({
        publicId: uploaded.public_id,
        url: uploaded.secure_url,
      });
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { $push: { images: { $each: uploadedImages } } },
      { new: true }
    );

    if (!product) return error("Product not found", 404);

    return success(product);
  } catch (err: any) {
    return error(err.message || "Product image upload failed");
  }
}
