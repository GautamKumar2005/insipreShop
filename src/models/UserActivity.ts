import mongoose, { Schema, Document } from "mongoose";

export interface IUserActivity extends Document {
  userId: string;
  email: string;
  name: string;
  role: string;
  type: "login" | "logout" | "ping" | "action";
  ip?: string;
  userAgent?: string;
  path?: string;
  duration: number; // in seconds
  timestamp: Date;
  details?: string;
}

const UserActivitySchema = new Schema<IUserActivity>({
  userId: { type: String, required: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  type: { type: String, required: true, enum: ["login", "logout", "ping", "action"] },
  ip: String,
  userAgent: String,
  path: String,
  duration: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
  details: String
}, {
  timestamps: true
});

UserActivitySchema.index({ email: 1, type: 1 });
UserActivitySchema.index({ timestamp: -1 });

export default mongoose.models.UserActivity ||
  mongoose.model<IUserActivity>("UserActivity", UserActivitySchema);
