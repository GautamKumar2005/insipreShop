import mongoose, { Schema, Document } from "mongoose";

export interface IFeedback extends Document {
  user?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  type: "FEEDBACK" | "COMPLAINT";
  message: string;
  status: "OPEN" | "RESOLVED";
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["FEEDBACK", "COMPLAINT"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["OPEN", "RESOLVED"],
      default: "OPEN",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Feedback ||
  mongoose.model<IFeedback>("Feedback", FeedbackSchema);
