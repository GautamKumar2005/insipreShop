import mongoose, { Schema, Document } from "mongoose";

export interface ISellerProfile extends Document {
  user: mongoose.Types.ObjectId;
  shopName: string;
  isApproved: boolean;
}

const SellerProfileSchema = new Schema<ISellerProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    shopName: { type: String, required: true },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.SellerProfile ||
  mongoose.model<ISellerProfile>("SellerProfile", SellerProfileSchema);
