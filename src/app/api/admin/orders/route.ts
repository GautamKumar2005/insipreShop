import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { success, error } from "@/lib/response";
import { ROLES } from "@/lib/constants";

import Product from "@/models/Product";
import User from "@/models/User";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const role = req.headers.get("x-user-role");
    if (role !== ROLES.ADMIN) return error("Unauthorized", 403);

    const search = req.nextUrl.searchParams.get("search") || "";
    let orderQuery: any = {};

    if (search) {
      const orConditions: any[] = [];

      if (mongoose.Types.ObjectId.isValid(search)) {
        orConditions.push({ _id: search });
      }

      // Match Users
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } }
        ]
      }).select('_id');

      if (matchingUsers.length > 0) {
        const userIds = matchingUsers.map((user) => user._id);
        orConditions.push({ buyer: { $in: userIds } });
        orConditions.push({ seller: { $in: userIds } });
        orConditions.push({ delivery: { $in: userIds } });
      }

      // Match Products
      const matchingProducts = await Product.find({
        name: { $regex: search, $options: "i" }
      }).select('_id');

      if (matchingProducts.length > 0) {
        const productIds = matchingProducts.map((p) => p._id);
        orConditions.push({ "items.product": { $in: productIds } });
      }

      // Match Numbers (quantity, price, total Amount)
      const numSearch = Number(search);
      if (!isNaN(numSearch)) {
        orConditions.push({ totalAmount: numSearch });
        orConditions.push({ "items.price": numSearch });
        orConditions.push({ "items.quantity": numSearch });
      }

      orderQuery = { $or: orConditions };
    }

    const orders = await Order.find(orderQuery)
      .populate("items.product")
      .populate("buyer", "name email phone")
      .populate("seller", "name email phone shopName")
      .populate("delivery", "name email phone")
      .sort({ createdAt: -1 });

    return success(orders);
  } catch (err: any) {
    return error(err.message || "Failed to fetch orders");
  }
}
