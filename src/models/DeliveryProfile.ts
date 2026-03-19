import mongoose, { Schema, Document } from "mongoose";

export interface IDeliveryProfile extends Document {
  user: mongoose.Types.ObjectId;
  currentLocation: {
    lat: number;
    lng: number;
  };
  isAvailable: boolean;
}

const DeliveryProfileSchema = new Schema<IDeliveryProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },

    currentLocation: {
      lat: Number,
      lng: Number,
    },

    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.DeliveryProfile ||
  mongoose.model<IDeliveryProfile>("DeliveryProfile", DeliveryProfileSchema);
