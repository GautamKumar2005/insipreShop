import mongoose, { Schema, Document } from "mongoose";

export interface IDeliveryTask extends Document {
  order: mongoose.Types.ObjectId;
  delivery?: mongoose.Types.ObjectId;

  pickupLocation: string;
  dropLocation: string;
  quantity: number;

  isAvailable: boolean;   // 👈 NEW
  isAccept: boolean;      // 👈 NEW
  isDelivered: boolean;   // 👈 NEW
  status: string;
}

const DeliveryTaskSchema = new Schema<IDeliveryTask>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    delivery: {
      type: Schema.Types.ObjectId,
      ref: "DeliveryProfile",
      default: null,
    },

    pickupLocation: {
      type: String,
      required: true,
    },

    dropLocation: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
    },

    // ✅ DELIVERY FLOW FLAGS
    isAvailable: {
      type: Boolean,
      default: true,
    },

    isAccept: {
      type: Boolean,
      default: false,
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["WAITING", "ASSIGNED", "IN_TRANSIT", "COMPLETED"],
      default: "WAITING",
    },
  },
  { timestamps: true }
);

export default mongoose.models.DeliveryTask ||
  mongoose.model<IDeliveryTask>("DeliveryTask", DeliveryTaskSchema);
