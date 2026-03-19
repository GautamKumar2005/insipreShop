import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Review from "@/models/Review";
import { success, error } from "@/lib/response";
import { ROLES } from "@/lib/constants";
import { verifyAccessToken } from "@/lib/jwt";
import { v2 as cloudinary } from "cloudinary";

function getUserFromToken(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  try {
    return verifyAccessToken(token) as any;
  } catch (err) {
    return null;
  }
}

// GET /api/products/[id]/reviews
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;

    const reviews = await Review.find({ product: id })
      .populate("user", "name profilePhoto")
      .sort({ createdAt: -1 });

    return success(reviews);
  } catch (err: any) {
    return error(err.message || "Failed to fetch reviews");
  }
}

// POST /api/products/[id]/reviews
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params; // product ID

    const user = getUserFromToken(req);
    // User must be logged in. The prompt says "but coomment phots or video upload by only buyer"
    // So if the user is not a BUYER, they cannot post those items 
    if (!user) return error("Unauthorized", 401);
    
    // Check if they are a buyer
    if (user.role !== ROLES.BUYER) {
      return error("Only buyers can leave feedback", 403);
    }

    const body = await req.json();
    const { rating = 4.5, comment, mediaData } = body;

    const media: any[] = [];

    // mediaData should be array of base64 strings
    if (mediaData && Array.isArray(mediaData) && mediaData.length > 0) {
      for (const fileStr of mediaData) {
        // Upload to cloudinary
        const uploaded = await cloudinary.uploader.upload(fileStr, {
          folder: "product_reviews",
          resource_type: "auto", // handles video and image automatically
        });
        media.push({
          publicId: uploaded.public_id,
          url: uploaded.secure_url,
          type: uploaded.resource_type === "video" ? "video" : "image"
        });
      }
    }

    const newReview = await Review.create({
      product: id,
      user: user.id,
      rating,
      comment,
      media,
    });

    const populatedReview = await newReview.populate("user", "name profilePhoto");

    return success(populatedReview);
  } catch (err: any) {
    return error(err.message || "Failed to submit review");
  }
}
