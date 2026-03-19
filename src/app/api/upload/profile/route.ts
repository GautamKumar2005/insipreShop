import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { v2 as cloudinary } from "cloudinary";
import { success, error } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const userId = req.headers.get("x-user-id");
    if (!userId) return error("Unauthorized", 401);

    const data = await req.json(); // { image: base64 }

    if (!data.image) return error("No image provided", 400);

    // Upload to Cloudinary
    const uploaded = await cloudinary.uploader.upload(data.image, {
      folder: "profile_photos",
      width: 500,
      height: 500,
      crop: "fill",
    });

    // Update user profile
    const user = await User.findByIdAndUpdate(
      userId,
      {
        profilePhoto: {
          publicId: uploaded.public_id,
          url: uploaded.secure_url,
        },
      },
      { new: true }
    );

    return success(user);
  } catch (err: any) {
    return error(err.message || "Profile upload failed");
  }
}
