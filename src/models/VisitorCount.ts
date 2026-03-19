import mongoose, { Schema, Document } from "mongoose";

export interface IVisitorCount extends Document {
  count: number;
}

const VisitorCountSchema = new Schema<IVisitorCount>(
  {
    count: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.VisitorCount || 
  mongoose.model<IVisitorCount>("VisitorCount", VisitorCountSchema);
